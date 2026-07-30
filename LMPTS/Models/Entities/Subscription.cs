using LMPTS.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    /// <summary>
    /// Represents user subscriptions for the app
    /// </summary>
    [Table("Subscriptions")]
    public class Subscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SubscriptionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(20)]
        public string PlanType { get; set; } = "free"; // 'free', 'pro', 'business'

        [Required]
        [Column(TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Column(TypeName = "date")]
        public DateTime? EndDate { get; set; } // NULL means active indefinitely

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PricePaid { get; set; } // Track how much was paid

        [MaxLength(50)]
        public string? PaymentMethod { get; set; } // Cash, UPI, Card, etc.

        [MaxLength(255)]
        public string? Note { get; set; }

        public bool IsActive { get; set; } = true;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        // Navigation property
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }
    }

    // Optional: Enum for Plan Types
    public enum PlanType
    {
        Free,
        Pro,
        Business
    }
}
