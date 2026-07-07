namespace LMPTS.Entities
{
    // Data Transfer Object (DTO) for the registration payload
    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public required string MobileNumber { get; set; }
        public required string PasswordHash { get; set; }
        public required string Industry { get; set; }
        public string? CompanyName { get; set; }
        public string? Address { get; set; }
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? City { get; set; }
        public double? PinCode { get; set; }
        public string? State { get; set; }
    }
}
