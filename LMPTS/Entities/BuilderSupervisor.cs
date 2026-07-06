namespace LMPTS.Entities
{
    public class BuilderSupervisor
    {
        public int BuilderSupervisorId { get; set; }
        public string Address { get; set; } = string.Empty;
        public int? BuilderId { get; set; }
        public Builder? Builder { get; set; } = null!;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public int ContractorCount { get; set; }
        public ICollection<Contractor> Contractors { get; set; }
            = new List<Contractor>(); 

    }
}
