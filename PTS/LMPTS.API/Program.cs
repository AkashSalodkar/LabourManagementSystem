using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using LMPTS.Infrastructure.Sms;
using Microsoft.EntityFrameworkCore;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ MSG91 SMS service - real values (AuthKey/SenderId/FlowId) come from
// App Service Application Settings (Msg91__AuthKey etc.), never committed to source.
builder.Services.Configure<Msg91Settings>(builder.Configuration.GetSection("Msg91"));
builder.Services.AddHttpClient<ISmsService, Msg91SmsService>();

// Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b =>
        {
            b.MigrationsAssembly("LMPTS.Infrastructure");
            // ✅ Retry transient connection failures automatically - this covers the
            // Azure SQL Serverless auto-pause/auto-resume delay (can take 30-60+ seconds
            // on the first request after being idle) instead of failing immediately.
            b.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
            b.CommandTimeout(90);
        });

    // ✅ Only log sensitive parameter values / SQL in Development.
    // Never enable this in Production - it can leak PII/secrets into App Service logs.
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

// ✅ READ CORS FROM appsettings.json (single source of truth - no hardcoded env-specific origins here)
var allowedOrigins = builder.Configuration
    .GetSection("CorsOrigins:AllowedOrigins")
    .Get<string[]>();

if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    // Fallback only - you should still set CorsOrigins:AllowedOrigins in Azure App
    // Service > Configuration > Application settings (as CorsOrigins__AllowedOrigins__0,
    // __1, etc.) so this list lives in config, not code. This fallback exists so the
    // Capacitor mobile app (origin https://localhost / capacitor://localhost by default)
    // and local browser dev both still work even if that setting is missing, instead of
    // silently allowing nothing.
    //
    // NOTE: "http://localhost" with no port is NOT the same CORS origin as
    // "http://localhost:5173" (Vite), "http://localhost:3000" (CRA), etc. - browsers
    // match scheme + host + port exactly. The common dev-server ports are listed
    // explicitly below so a plain `npm run dev` against this deployed API works without
    // requiring an Azure config change first. Add/remove ports here to match your setup,
    // but the real fix for anything beyond quick local testing is still to set
    // CorsOrigins__AllowedOrigins__N in Azure App Service Configuration.
    allowedOrigins = builder.Environment.IsDevelopment()
        ? new[] { "http://localhost:5173" }
        : new[]
        {
            "https://localhost",
            "capacitor://localhost",
            "http://localhost",
            "http://localhost:5173",  // Vite default
            "http://localhost:3000",  // CRA default
            "http://localhost:8100",  // Ionic default
        };
}

// ✅ Log the active allowed origins at startup - makes CORS misconfiguration visible in the
// App Service log stream instead of only showing up as an opaque "Failed to fetch" in the browser.
Console.WriteLine($"CORS allowed origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ✅ Firebase Admin SDK - used by AuthController to verify phone-auth ID tokens from the client.
// In Azure: set FIREBASE_CREDENTIALS_JSON as an App Service Application Setting containing the
// raw service-account JSON (never commit the key file to source). For local dev, set
// "FirebaseCredentialsPath" in appsettings.Development.json to point at a key file kept outside the repo.
var firebaseCredentialsJson = builder.Configuration["FIREBASE_CREDENTIALS_JSON"]
    ?? Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_JSON");

if (!string.IsNullOrEmpty(firebaseCredentialsJson))
{
    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromJson(firebaseCredentialsJson)
    });
}
else
{
    var firebaseCredentialsPath = builder.Configuration["FirebaseCredentialsPath"];
    if (!string.IsNullOrEmpty(firebaseCredentialsPath) && File.Exists(firebaseCredentialsPath))
    {
        FirebaseApp.Create(new AppOptions
        {
            Credential = GoogleCredential.FromFile(firebaseCredentialsPath)
        });
    }
    else if (builder.Environment.IsProduction())
    {
        // ✅ Fail fast in production - phone auth login/register cannot function without this,
        // same philosophy as the migration failure handling further down this file.
        throw new InvalidOperationException(
            "Firebase credentials not configured. Set FIREBASE_CREDENTIALS_JSON in App Service Application Settings.");
    }
    else
    {
        // Dev-only: log and continue so the rest of the app (non-auth endpoints) still runs
        // if a developer hasn't set up their local Firebase credentials yet.
        Console.WriteLine("⚠ Firebase credentials not found (FIREBASE_CREDENTIALS_JSON / FirebaseCredentialsPath). " +
            "Phone-auth login/register endpoints will fail until this is configured.");
    }
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    // ✅ Don't leak stack traces in production; add HSTS for HTTPS enforcement.
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseCors("AllowSpecificOrigins");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// ✅ Minimal error endpoint used by UseExceptionHandler above.
app.Map("/error", (HttpContext context) =>
{
    return Results.Problem(title: "An unexpected error occurred.", statusCode: 500);
});

// ✅ Simple health check endpoint - useful for Azure App Service health checks / monitoring.
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));

// Ensure database is migrated and seeded
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        if (app.Environment.IsProduction())
        {
            // NOTE: If you ever scale this App Service plan to more than one instance,
            // move this to a one-time deployment step (e.g. `dotnet ef database update`
            // in your release process) instead of running it on every instance startup,
            // to avoid concurrent migration attempts against the same database.
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");
        }
        else
        {
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migrated successfully");
        }

        var userCount = await dbContext.Users.CountAsync();
        logger.LogInformation("Found {UserCount} users in database", userCount);

        if (userCount == 0)
        {
            logger.LogInformation("Seeding default user...");
            var defaultUser = new User
            {
                FullName = "Default User",
                MobileNumber = "9876543210",
                Industry = "Construction & Real Estate",
                Role = UserRole.Supervisor,
                IsVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(defaultUser);
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Default user created with ID: {UserId}", defaultUser.Id);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during database initialization");

        // ✅ In production, fail fast rather than silently starting an app whose
        // migrations didn't apply - a half-migrated schema is worse than a failed deploy.
        if (app.Environment.IsProduction())
        {
            throw;
        }
    }
}

app.Run();