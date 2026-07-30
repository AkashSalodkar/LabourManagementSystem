using LMPTS.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{

    [Table("WorkerAdvances")]
    public class WorkerAdvance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AdvanceId { get; set; }

        [Required]
        public int WorkerId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime AdvanceDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [MaxLength(20)]
        public string PaymentMethod { get; set; } = "Cash"; // Cash, UPI, Bank Transfer

        [MaxLength(255)]
        public string? Note { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey(nameof(WorkerId))]
        public virtual Worker Worker { get; set; }
    }
}
