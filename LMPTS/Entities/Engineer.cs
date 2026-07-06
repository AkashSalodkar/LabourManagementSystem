namespace LMPTS.Entities
{
    public class Engineer
    {
        public int EngineerId { get; set; }
        public int UserId { get; set;}
        public User User { get; set; }
        public int BuilderId { get; set; }
        public Builder Builder { get; set; }

    }
}
