namespace LMPTS.Entities
{
    public class LoginRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public bool IsPasswordRequired { get; set; }
    }

}
