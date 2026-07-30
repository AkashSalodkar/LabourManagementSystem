using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
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
        public int Month { get; set; }

        [Required]
        public int Year { get; set; }

        public int PresentDays { get; set; }
        public int HalfDays { get; set; }
        public int AbsentDays { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalWages { get; set; }

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

        [ForeignKey(nameof(WorkerId))]
        public virtual Worker Worker { get; set; } = null!;
    }
}