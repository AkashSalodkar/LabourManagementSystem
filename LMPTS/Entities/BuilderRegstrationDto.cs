namespace LMPTS.Entities
{
    public class BuilderRegistrationDto
    {
        public int UserId { get; set; }

        public string CompanyName { get; set; } = string.Empty;

        public string RegisteredAddress { get; set; } = string.Empty;

        public string GSTNumber { get; set; } = string.Empty;

        public string PANNumber { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string RegisteredMobileNumber { get; set; } = string.Empty;

        public int SupervisorCount { get; set; }

        public int ContractorCount { get; set; }

        public string BuilderType { get; set; } = string.Empty;
    }
}
