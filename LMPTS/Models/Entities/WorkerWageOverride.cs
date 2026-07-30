using LMPTS.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    /// <summary>
    /// Represents wage overrides for a worker (wage edits with date ranges)
    /// </summary>
    [Table("WorkerWageOverrides")]
    public class WorkerWageOverride
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OverrideId { get; set; }

        [Required]
        public int WorkerId { get; set; }

        [Column(TypeName = "date")]
        public DateTime? EffectiveFrom { get; set; } // NULL means from the beginning

        [Column(TypeName = "date")]
        public DateTime? EffectiveTo { get; set; } // NULL means ongoing

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyWageAmount { get; set; }

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
