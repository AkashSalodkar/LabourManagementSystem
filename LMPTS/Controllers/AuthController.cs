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

        // AuthController.cs - Updated methods

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] OtpRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Invalid parameters: Mobile number is required." });
            }

            try
            {
                string generatedOtp = new Random().Next(100000, 999999).ToString();
                DateTime expiry = DateTime.UtcNow.AddMinutes(5);

                // Remove existing OTP for this mobile number (if any)
                var existingOtps = await _context.UserOtps
                    .Where(u => u.MobileNumber == request.MobileNumber)
                    .ToListAsync();

                if (existingOtps.Any())
                {
                    _context.UserOtps.RemoveRange(existingOtps);
                }

                // Create new OTP
                var newOtpRecord = new UserOtp
                {
                    MobileNumber = request.MobileNumber,
                    Role = request.Role,
                    OtpCode = generatedOtp,
                    ExpiryTime = expiry
                };

                await _context.UserOtps.AddAsync(newOtpRecord);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[SMS GATEWAY SIMULATION] -> Sent OTP {generatedOtp} to user {request.MobileNumber}");

                return Ok(new
                {
                    message = "OTP verification token generated successfully.",
                    debugOtp = generatedOtp // Remove this in production
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database processing crash error trace: {ex.Message}");
                return StatusCode(500, new { message = "An internal server framework error occurred." });
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

                var newUser = new User
                {
                    FullName = request.FullName,
                    MobileNumber = request.MobileNumber
                };

                // 4. Stage the object inside EF Core tracking
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // Standard HTTP 201 response with safe metadata
                return StatusCode(201, new
                {
                    message = "Registration successful."
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
            var validOtp = await _context.UserOtps
                .FirstOrDefaultAsync(o => o.MobileNumber == request.MobileNumber && o.OtpCode == request.Otp);

            if (validOtp == null)
            {
                return BadRequest(new { message = "Invalid OTP verification code. Please check and try again." });
            }

            var currentUtcTime = DateTime.UtcNow;
            var expiryTime = validOtp.ExpiryTime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(validOtp.ExpiryTime, DateTimeKind.Utc)
                : validOtp.ExpiryTime.ToUniversalTime();

            if (expiryTime < currentUtcTime)
            {
                return BadRequest(new { message = "The OTP code has expired. Please request a fresh token code." });
            }

            string sanitizedUsername = request.MobileNumber.Trim();
            if (sanitizedUsername.StartsWith("+91"))
            {
                sanitizedUsername = sanitizedUsername.Substring(3);
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.MobileNumber.Trim() == sanitizedUsername);

            if (user == null)
            {
                Console.WriteLine($"[AUTH BREAK] -> SQL was looking for Name matching: '{sanitizedUsername}' but found nothing.");
                return Unauthorized(new { message = "Account record not found. Please register first." });
            }

            // Remove used OTP
            _context.UserOtps.Remove(validOtp);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                userId = user.UserId,
                fullName = user.FullName,
                mobileNumber = user.MobileNumber,
                industry = user.Industry,
                role = user.Role
            });
        }

    }
}
