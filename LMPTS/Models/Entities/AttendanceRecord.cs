using LMPTS.Entities;
using System.ComponentModel.DataAnnotations.Schema;
namespace LMPTS.Entities
{
    public class AttendanceRecord
    {
        public int AttendanceRecordId { get; set; }

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        public DateOnly AttendanceDate { get; set; }

        public AttendanceStatus Status { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DailyRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OvertimeHours { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalHoursWorked { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OvertimeRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Bonus { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Deduction { get; set; }

        public string? Remarks { get; set; }

        public decimal TotalCostSpent =>
            Status switch
            {
                AttendanceStatus.Absent => 0,

                AttendanceStatus.HalfDay => (DailyRate / 2)
                                           + (OvertimeHours * OvertimeRate)
                                           + Bonus
                                           - Deduction,

                AttendanceStatus.Present => DailyRate
                                            + (OvertimeHours * OvertimeRate)
                                            + Bonus
                                            - Deduction,

                _ => 0
            };
    }

    public enum AttendanceStatus
    {
        Absent = 0,
        Present = 1,
        HalfDay = 2
    }
}