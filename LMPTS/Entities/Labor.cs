namespace LMPTS.Entities
{
    public class Labor
    {
        public int LaborId { get; set; }
        public string Address { get; set; } = string.Empty;

        public int UserId { get; set; }

        public User User { get; set; } = null!;
        public int SkillId { get; set; }

        public Skill Skill { get; set; }

        public int? ContractorSupervisorId { get; set; }
        public ContractorSupervisor? ContractorSupervisor { get; set; }

        public int? ContractorId { get; set; }
        public Contractor? Contractor { get; set; }

        public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
            = new List<AttendanceRecord>();

        public ICollection<Payment> Payments { get; set; }
            = new List<Payment>();
    }
    public enum Skill
    {
        Mason = 0,
        Electrician = 1,
        Plumber = 2,
        Carpenter = 3,
        Painter = 4,
        Welder = 5,
        Male_Worker = 6,
        Female_worker = 7,
        PopWorker = 8,

    }
}
