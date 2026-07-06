namespace LMPTS.Entities
{
    public class Builder
    {
        public int BuilderId { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        public string CompanyName { get; set; } = "";

        public string RegisteredAddress { get; set; } = "";

        public string GSTNumber { get; set; } = "";

        public string PANNumber { get; set; } = "";

        public string City { get; set; } = "";

        public string RegisteredMobileNumber { get; set; } = "";

        public int SupervisorCount { get; set; }

        public int ContractorCount { get; set; }

        public string BuilderType { get; set; } = "";

        public bool IsVerified { get; set; }

        public ICollection<BuilderContractor> BuilderContractors { get; set; }
            = new List<BuilderContractor>();
    }
}
