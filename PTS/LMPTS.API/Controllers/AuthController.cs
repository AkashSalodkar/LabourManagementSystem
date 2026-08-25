using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using LMPTS.Infrastructure.Sms;
using FirebaseAdmin.Auth;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AuthController> _logger;
        private readonly ISmsService _smsService;

        public AuthController(ApplicationDbContext context, ILogger<AuthController> logger, ISmsService smsService)
        {
            _context = context;
            _logger = logger;
            _smsService = smsService;
        }

        // Verifies the Firebase ID token and confirms the phone number Firebase verified
        // actually matches the mobile number the client claims to be registering/logging in with.
        // Returns null on success, or an IActionResult to return immediately on failure.
        private async Task<IActionResult?> VerifyFirebasePhoneAsync(string idToken, string expectedMobileNumber)
        {
            if (string.IsNullOrWhiteSpace(idToken))
            {
                return BadRequest(new { message = "Verification token is required." });
            }

            FirebaseToken decodedToken;
            try
            {
                decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogWarning(ex, "Firebase ID token verification failed");
                return Unauthorized(new { message = "Invalid or expired verification. Please request a new OTP." });
            }

            if (!decodedToken.Claims.TryGetValue("phone_number", out var phoneClaim) || phoneClaim == null)
            {
                return Unauthorized(new { message = "This verification is not associated with a phone number." });
            }

            var verifiedPhone = phoneClaim.ToString() ?? string.Empty;
            var normalizedVerifiedPhone = verifiedPhone.StartsWith("+91") ? verifiedPhone.Substring(3) : verifiedPhone;

            if (normalizedVerifiedPhone != expectedMobileNumber)
            {
                return Unauthorized(new { message = "Verified phone number does not match the number provided." });
            }

            return null;
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

                _logger.LogInformation("OTP generated for {Mobile}", mobileNumber);

                var smsSent = await _smsService.SendOtpAsync(mobileNumber, generatedOtp);

                if (!smsSent)
                {
                    _logger.LogError("Failed to send OTP SMS to {Mobile}", mobileNumber);
                    return StatusCode(502, new { message = "Could not send OTP SMS. Please try again shortly." });
                }

                return Ok(new OtpResponseDto
                {
                    Message = "OTP sent successfully."
                    // ✅ DebugOtp removed - never return the OTP itself in the API response in production.
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

                // Verify the Firebase ID token instead of matching a stored OTP.
                var verificationError = await VerifyFirebasePhoneAsync(request.IdToken, mobileNumber);
                if (verificationError != null)
                {
                    return verificationError;
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
                    IsVerified = user.IsVerified,
                    ProfileImage = user.ProfileImage
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

                // Verify the Firebase ID token instead of matching a stored OTP.
                var verificationError = await VerifyFirebasePhoneAsync(request.IdToken, mobileNumber);
                if (verificationError != null)
                {
                    return verificationError;
                }

                // Find user
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);

                if (user == null)
                {
                    return Unauthorized(new { message = "Account not found. Please register first." });
                }

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    MobileNumber = user.MobileNumber,
                    Industry = user.Industry,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified,
                    ProfileImage = user.ProfileImage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in");
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }

        [HttpPut("profile/{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new { message = "Full name is required." });
            }

            // Stop-gap size guard: a base64 data URL over ~2MB shouldn't be stored inline in the
            // Users table. For real production use, swap this for upload-to-blob-storage-and-store-URL.
            const int maxBase64Length = 2 * 1024 * 1024;
            if (request.ProfileImage != null && request.ProfileImage.Length > maxBase64Length)
            {
                return BadRequest(new { message = "Profile image is too large. Please choose a smaller photo." });
            }

            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                user.FullName = request.FullName.Trim();

                // Empty string means "no change" (client didn't pick a new photo);
                // an explicit new data URL replaces the stored photo.
                if (!string.IsNullOrEmpty(request.ProfileImage))
                {
                    user.ProfileImage = request.ProfileImage;
                }

                await _context.SaveChangesAsync();

                return Ok(new AuthResponseDto
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    MobileNumber = user.MobileNumber,
                    Industry = user.Industry,
                    Role = user.Role.ToString(),
                    IsVerified = user.IsVerified,
                    ProfileImage = user.ProfileImage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating your profile." });
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