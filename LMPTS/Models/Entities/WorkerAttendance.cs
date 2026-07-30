namespace LMPTS.Entities
{
    public class WorkerAttendance
    {
        public int AttendanceId { get; set; }
        public int WorkerId { get; set; }
        public DateTime AttendanceDate { get; set; }
        public string Status { get; set; } // 'P', 'HD', 'A'
        public decimal DailyRate { get; set; }
        public decimal NetAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation property
        public Worker Worker { get; set; }
    }
}
