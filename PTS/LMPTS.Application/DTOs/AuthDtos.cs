using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class SendOtpRequestDto
    {
        [Required]
        [MaxLength(10)]
        public string MobileNumber { get; set; } = string.Empty;

        public string? Industry { get; set; }

        public bool IsLoginView { get; set; }
    }

    public class VerifyOtpRequestDto
    {
        [Required]
        [MaxLength(10)]
        public string MobileNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(6)]
        public string Otp { get; set; } = string.Empty;
    }

    public class RegisterRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string MobileNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Industry { get; set; }

        [Required]
        public string IdToken { get; set; } = string.Empty;
    }

    public class LoginRequestDto
    {
        [Required]
        [MaxLength(10)]
        public string MobileNumber { get; set; } = string.Empty;

        [Required]
        public string IdToken { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public string? Token { get; set; }
        public string? ProfileImage { get; set; }
    }

    public class UpdateProfileRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        // Base64 data URL (e.g. "data:image/jpeg;base64,...") sent from the client,
        // or null/empty to leave the existing photo unchanged.
        public string? ProfileImage { get; set; }
    }

    public class OtpResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public string? DebugOtp { get; set; } // Remove in production
    }
}