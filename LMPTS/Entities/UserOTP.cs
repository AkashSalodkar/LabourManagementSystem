using System.ComponentModel.DataAnnotations;

namespace LMPTS.Entities
{
    public class UserOtp
    {
        [Key]
        public string MobileNumber { get; set; } = string.Empty; // Primary Key

        [Required]
        public string Role { get; set; } = string.Empty;

        [Required]
        public string OtpCode { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryTime { get; set; }
    }
}
