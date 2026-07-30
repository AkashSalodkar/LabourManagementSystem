namespace LMPTS.Entities
{
    public class Worker
    {
        public int WorkerId { get; set; }
        public int ProjectId { get; set; }
        public string FullName { get; set; }
        public string MobileNumber { get; set; }
        public DateTime JoiningDate { get; set; }
        public decimal DailyWage { get; set; }
        public string Role { get; set; }
        public decimal Advance { get; set; }
        public decimal Bonus { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; }
        public bool IsActive { get; set; }

        // Navigation properties
        public Project Project { get; set; }
        public ICollection<WorkerAttendance> Attendances { get; set; }
        public ICollection<WorkerWageOverride> WageOverrides { get; set; }
        public ICollection<WorkerPayment> Payments { get; set; }
        public ICollection<WorkerAdvance> Advances { get; set; }
        public ICollection<WorkerBonus> Bonuses { get; set; }
        public ICollection<WorkerMonthlyStatement> MonthlyStatements { get; set; }
    }
}
