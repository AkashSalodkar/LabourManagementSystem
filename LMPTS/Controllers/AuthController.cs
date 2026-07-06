using LMPTS.Data;
using LMPTS.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LMPTS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] OtpRequestDto request)
        {
            // 1. Core input parameter validation
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Invalid parameters: Mobile number is required." });
            }

            try
            {
                // 2. Generate a secure random 6-digit verification code packet
                string generatedOtp = new Random().Next(100000, 999999).ToString();

                // Set an operational expiration window (e.g., Token valid for 5 minutes)
                DateTime expiry = DateTime.UtcNow.AddMinutes(5);

                // 3. Query your UserOtps context to check if an OTP record exists for this mobile number
                var existingOtpRecord = await _context.UserOtps
                    .FirstOrDefaultAsync(u => u.MobileNumber == request.MobileNumber);

                if (existingOtpRecord != null)
                {
                    // Update existing instance database fields cleanly
                    existingOtpRecord.OtpCode = generatedOtp;
                    existingOtpRecord.Role = request.Role;
                    existingOtpRecord.ExpiryTime = expiry;
                    _context.UserOtps.Update(existingOtpRecord);
                }
                else
                {
                    // Create an entirely new data table trace log tracking metrics row
                    var newOtpRecord = new UserOtp
                    {
                        MobileNumber = request.MobileNumber,
                        Role = request.Role,
                        OtpCode = generatedOtp,
                        ExpiryTime = expiry
                    };
                    await _context.UserOtps.AddAsync(newOtpRecord);
                }

                // 4. Commit changes synchronously down to SQL Server (SSMS)
                await _context.SaveChangesAsync();

                // For development, print code value to console logger screen:
                Console.WriteLine($"[SMS GATEWAY SIMULATION] -> Sent OTP {generatedOtp} to user {request.MobileNumber}");

                // 5. Return an explicit JSON configuration object to prevent browser fetch crashes
                return Ok(new
                {
                    message = "OTP verification token generated successfully.",
                    // Tip: In production, remove this debug line. Keep it for testing without checking logs!
                    debugOtp = generatedOtp
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database processing crash error trace: {ex.Message}");
                return StatusCode(500, new { message = "An internal server framework error occurred while updating SSMS context metrics." });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // 1. Validation check
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Username/Mobile number is required." });
            }

            try
            {
                // 2. Check if the user exists
                var userExists = await _context.Users
                    .AnyAsync(u => u.MobileNumber.ToLower() == request.MobileNumber.ToLower());

                if (userExists)
                {
                    return BadRequest(new { message = "This mobile number is already registered." });
                }

                // 3. Hash the password text
                string securePasswordHash = BCrypt.Net.BCrypt.HashPassword(request.PasswordHash);

                var newUser = new User
                {
                    MobileNumber = request.MobileNumber,
                    PasswordHash = securePasswordHash,
                    FullName = request.FullName,
                    Role = request.Role ?? "Contractor"
                };

                // 4. Stage the object inside EF Core tracking
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                //If the User is Builder then add those details in Builders table
                if (request.Role == "Builder")
                {
                    var builder = new Builder
                    {
                        UserId = newUser.UserId,

                        CompanyName = request.CompanyName!,
                        RegisteredAddress = request.RegisteredAddress!,
                        GSTNumber = request.GSTNumber!,
                        PANNumber = request.PANNumber!,
                        City = request.City!,
                        RegisteredMobileNumber = request.RegisteredMobileNumber!,

                        SupervisorCount = request.SupervisorCount ?? 0,
                        ContractorCount = request.ContractorCount ?? 0,

                        BuilderType = request.BuilderType!,

                        IsVerified = true
                    };

                    _context.Builders.Add(builder);

                    await _context.SaveChangesAsync();
                }
                if (request.Role == "Contractor")
                {
                    var contractor = new Contractor
                    {
                        UserId = newUser.UserId,
                        Address = request.Address,
                        Specialization = request.Specialization
                    };
                    _context.Contractors.Add(contractor);

                    await _context.SaveChangesAsync();
                }
                if (request.Role == "BuilderSupervisor")
                {
                    var builderSupervisor = new BuilderSupervisor
                    {
                        UserId = newUser.UserId,
                        Address = request.Address
                    };
                    _context.BuilderSupervisors.Add(builderSupervisor);

                    await _context.SaveChangesAsync();
                }
                if (request.Role == "ContractorSupervisor")
                {
                    var contractorSupervisor = new ContractorSupervisor
                    {
                        UserId = newUser.UserId,
                        Address = request.Address
                    };
                    _context.ContractorSupervisors.Add(contractorSupervisor);

                    await _context.SaveChangesAsync();
                }
                if (request.Role == "Labor")
                {
                    var labor = new Labor
                    {
                        UserId = newUser.UserId,
                        Address = request.Address,
                        Skill = request.Skill
                    };
                    _context.Labours.Add(labor);

                    await _context.SaveChangesAsync();
                }

                // Standard HTTP 201 response with safe metadata
                return StatusCode(201, new
                {
                    message = "Registration successful.",
                    userId = newUser.UserId,
                    mobileNumber = newUser.MobileNumber,
                    role = newUser.Role
                });
            }
            catch (Exception ex)
            {
                // Catch any hidden SQL database constraint or connection errors
                Console.WriteLine($"[DB CRASH ERROR] -> Registration failed: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[DB CRASH INNER] -> {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = $"Database error: {ex.Message}" });
            }
        }



        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // --- FIXED LINE: Query using request.Otp instead of request.Password ---
            var validOtp = await _context.UserOtps
                .FirstOrDefaultAsync(o => o.MobileNumber == request.MobileNumber && o.OtpCode == request.Otp);

            if (validOtp == null)
            {
                return BadRequest(new { message = "Invalid OTP verification code. Please check and try again." });
            }

            // 2. FIXED EXPIRY CHECK: Flexible DateTime buffer comparison
            var currentUtcTime = DateTime.UtcNow;
            var expiryTime = validOtp.ExpiryTime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(validOtp.ExpiryTime, DateTimeKind.Utc)
                : validOtp.ExpiryTime.ToUniversalTime();

            if (expiryTime < currentUtcTime)
            {
                return BadRequest(new { message = "The OTP code has expired. Please request a fresh token code." });
            }

            // 3. FIXED LOOKUP: Use Trim, case-insensitive, and normalization checks to match strings safely
            string sanitizedUsername = request.MobileNumber.Trim();

            // If the front-end accidentally passed a "+91" header, trim it off to match the DB format shown in your screenshot
            if (sanitizedUsername.StartsWith("+91"))
            {
                sanitizedUsername = sanitizedUsername.Substring(3);
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.MobileNumber.Trim() == sanitizedUsername);

            if (user == null)
            {
                // Debug logger printing what your code was actually looking for vs what failed
                Console.WriteLine($"[AUTH BREAK] -> SQL was looking for Name matching: '{sanitizedUsername}' but found nothing.");
                return Unauthorized(new { message = "Account record not found. Please register first." });
            }


            // 4. CONDITIONAL CHECK: Validate password only if explicit logout occurred
            if (request.IsPasswordRequired)
            {
                // Now request.Password correctly contains the typed account password text string
                if (string.IsNullOrWhiteSpace(request.Password) ||
                    !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid account password. Access Denied." });
                }
            }

            // 5. Clean up used transient record upon validation completion
            _context.UserOtps.Remove(validOtp);
            await _context.SaveChangesAsync();

            return Ok(new { userId = user.UserId, name = user.MobileNumber, role = user.Role });
        }


    }
}
