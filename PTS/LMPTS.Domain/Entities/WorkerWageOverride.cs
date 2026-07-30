using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("WorkerWageOverrides")]
    public class WorkerWageOverride
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OverrideId { get; set; }

        [Required]
        public int WorkerId { get; set; }

        [Column(TypeName = "date")]
        public DateTime? EffectiveFrom { get; set; }

        [Column(TypeName = "date")]
        public DateTime? EffectiveTo { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyWageAmount { get; set; }

        [MaxLength(255)]
        public string? Note { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(WorkerId))]
        public virtual Worker Worker { get; set; } = null!;
    }
}