using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    [Table("WorkerMonthlyStatements")]
    public class WorkerMonthlyStatement
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int StatementId { get; set; }

        [Required]
        public int WorkerId { get; set; }

        [Required]
        public int Month { get; set; } // 1-12

        [Required]
        public int Year { get; set; }

        // Attendance Summary
        public int PresentDays { get; set; }
        public int HalfDays { get; set; }
        public int AbsentDays { get; set; }

        // Earnings
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalWages { get; set; }

        // Adjustments
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAdvances { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalBonuses { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPayments { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey(nameof(WorkerId))]
        public virtual Worker Worker { get; set; }
    }
}
