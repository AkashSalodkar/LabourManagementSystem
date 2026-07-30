using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("Workers")]
    public class Worker : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(10)]
        public string? MobileNumber { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime JoiningDate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyWage { get; set; } = 400;

        [MaxLength(50)]
        public string Role { get; set; } = "Worker";

        [Column(TypeName = "decimal(10,2)")]
        public decimal Advance { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Bonus { get; set; } = 0;

        [Column(TypeName = "datetime")]
        public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public int ProjectId { get; set; }

        // Navigation properties
        [ForeignKey(nameof(ProjectId))]
        public virtual Project Project { get; set; } = null!;

        public virtual ICollection<WorkerAttendance> Attendances { get; set; } = new List<WorkerAttendance>();
        public virtual ICollection<WorkerWageOverride> WageOverrides { get; set; } = new List<WorkerWageOverride>();
        public virtual ICollection<WorkerPayment> Payments { get; set; } = new List<WorkerPayment>();
        public virtual ICollection<WorkerAdvance> Advances { get; set; } = new List<WorkerAdvance>();
        public virtual ICollection<WorkerBonus> Bonuses { get; set; } = new List<WorkerBonus>();
        public virtual ICollection<WorkerMonthlyStatement> MonthlyStatements { get; set; } = new List<WorkerMonthlyStatement>();
    }
}