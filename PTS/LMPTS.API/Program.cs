using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("LMPTS.Infrastructure"));

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
    // Fallback only - you should always have CorsOrigins configured per environment.
    allowedOrigins = builder.Environment.IsDevelopment()
        ? new[] { "http://localhost:5173" }
        : Array.Empty<string>();
}

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
            logger.LogInformation("Database created successfully");
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
