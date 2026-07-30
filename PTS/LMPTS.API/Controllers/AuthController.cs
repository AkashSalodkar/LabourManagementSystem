using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, ILogger<AuthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            try
            {
                var mobileNumber = request.MobileNumber.Trim();
                if (mobileNumber.StartsWith("+91")) mobileNumber = mobileNumber.Substring(3);

                // Check registration status up front, before generating any OTP.
                var existingUserForOtp = await _context.Users
                    .FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);

                if (request.IsLoginView && existingUserForOtp == null)
                {
                    return NotFound(new { message = "Account not found. Please register first." });
                }

                if (!request.IsLoginView && existingUserForOtp != null)
                {
                    return BadRequest(new { message = "This mobile number is already registered. Please login instead." });
                }

                string generatedOtp = new Random().Next(100000, 999999).ToString();
                DateTime expiry = DateTime.UtcNow.AddMinutes(5);

                var existingOtp = await _context.UserOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == mobileNumber);

                if (existingOtp != null)
                {
                    existingOtp.OtpCode = generatedOtp;
                    existingOtp.ExpiryTime = expiry;
                    _context.UserOtps.Update(existingOtp);
                }
                else
                {
                    var newOtp = new UserOtp
                    {
                        MobileNumber = mobileNumber,
                        Role = "Supervisor",
                        OtpCode = generatedOtp,
                        ExpiryTime = expiry
                    };
                    await _context.UserOtps.AddAsync(newOtp);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"OTP generated for {mobileNumber}: {generatedOtp}");

                return Ok(new OtpResponseDto
                {
                    Message = "OTP sent successfully.",
                    DebugOtp = generatedOtp // Remove in production
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP");
                return StatusCode(500, new { message = "An error occurred while sending OTP." });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            try
            {
                var mobileNumber = request.MobileNumber.Trim();
                if (mobileNumber.StartsWith("+91")) mobileNumber = mobileNumber.Substring(3);

                // Check if user exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "This mobile number is already registered." });
                }

                // Verify OTP
                var validOtp = await _context.UserOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == mobileNumber && o.OtpCode == request.Otp);

                if (validOtp == null)
                {
                    return BadRequest(new { message = "Invalid OTP. Please request a new code." });
                }

                if (validOtp.ExpiryTime < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "OTP has expired. Please request a new code." });
                }

                // Create user
                var user = new User
                {
                    FullName = request.FullName,
                    MobileNumber = mobileNumber,
                    Industry = request.Industry,
                    Role = UserRole.Supervisor,
                    IsVerified = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Users.AddAsync(user);

                // Remove used OTP
                _context.UserOtps.Remove(validOtp);

                await _context.SaveChangesAsync();

                // Create default subscription (Free plan)
                var subscription = new Subscription
                {
                    UserId = user.Id,
                    PlanType = "free",
                    StartDate = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Subscriptions.AddAsync(subscription);
                await _context.SaveChangesAsync();

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    MobileNumber = user.MobileNumber,
                    Industry = user.Industry,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user");
                return StatusCode(500, new { message = "An error occurred during registration." });
            }
        }

        [HttpPost("login")]

        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                return BadRequest(new { message = "Mobile number is required." });
            }

            try
            {
                var mobileNumber = request.MobileNumber.Trim();
                if (mobileNumber.StartsWith("+91")) mobileNumber = mobileNumber.Substring(3);

                // Verify OTP
                var validOtp = await _context.UserOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == mobileNumber && o.OtpCode == request.Otp);

                if (validOtp == null)
                {
                    return BadRequest(new { message = "Invalid OTP. Please request a new code." });
                }

                if (validOtp.ExpiryTime < DateTime.UtcNow)
                {
                    return BadRequest(new { message = "OTP has expired. Please request a new code." });
                }

                // Find user
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);

                if (user == null)
                {
                    return Unauthorized(new { message = "Account not found. Please register first." });
                }

                // Remove used OTP
                _context.UserOtps.Remove(validOtp);
                await _context.SaveChangesAsync();

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    MobileNumber = user.MobileNumber,
                    Industry = user.Industry,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in");
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }

        [HttpGet("test-user/{userId}")]
        public async Task<IActionResult> TestUser(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = $"User with ID {userId} not found" });
                }
                return Ok(new
                {
                    userId = user.Id,
                    fullName = user.FullName,
                    mobileNumber = user.MobileNumber,
                    hasProjects = _context.Projects.Any(p => p.UserId == userId)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}