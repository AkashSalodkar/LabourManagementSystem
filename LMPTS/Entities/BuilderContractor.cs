namespace LMPTS.Entities
{
    public class BuilderContractor
    {
        public int BuilderId { get; set; }

        public Builder Builder { get; set; } = null!;

        public int ContractorId { get; set; }

        public Contractor Contractor { get; set; } = null!;
    }
}
