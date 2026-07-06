namespace LMPTS.Entities
{
    // Data Transfer Object (DTO) for the registration payload
    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;
        public required string MobileNumber { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; }  // e.g., "Builder", "Contractor", "Supervisor"
        
        public string? CompanyName { get; set; }
        public string? RegisteredAddress { get; set; }
        public string? Address { get; set; }
        public string? GSTNumber { get; set; }
        public string? PANNumber { get; set; }
        public string? City { get; set; }
        public string? RegisteredMobileNumber { get; set; }
        public int? SupervisorCount { get; set; }
        public int? ContractorCount { get; set; }
        public string? BuilderType { get; set; }

        public string Specialization { get; set; } = string.Empty;

        public Skill Skill { get; set; }
    }
}
