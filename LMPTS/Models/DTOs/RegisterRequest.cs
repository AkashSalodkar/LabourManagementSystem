namespace LMPTS.Entities
{
    // Data Transfer Object (DTO) for the registration payload
    public class RegisterRequest
    {
        public string FullName { get; set; }
        public string MobileNumber { get; set; }
        public string Industry { get; set; }
        public string Otp { get; set; }
    }
}
