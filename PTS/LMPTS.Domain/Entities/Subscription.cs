using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    /// <summary>
    /// One row = one period of access for a user.
    ///   - PlanType "trial"   : the 30-day free trial. Exactly ONE per user (unique index), created on first login.
    ///   - PlanType "monthly" : a paid 30-day period, created only after a verified UPI payment.
    /// Access is decided from StartDate/EndDate against the SERVER clock (UTC), never from the device.
    /// </summary>
    [Table("Subscriptions")]
    public class Subscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SubscriptionId { get; set; }

        [Required]
        public int UserId { get; set; }

        // CHANGED meaning: "trial" | "monthly" (legacy values "free" / "pro" / "business" may exist in old rows).
        [Required]
        [MaxLength(20)]
        public string PlanType { get; set; } = SubscriptionPlan.Trial;

        // CHANGED: was SQL "date". Now a UTC date-time, because the trial runs from the exact moment of first login.
        [Required]
        [Column(TypeName = "datetime2")]
        public DateTime StartDate { get; set; }

        // CHANGED: was SQL "date" (nullable). Now a UTC date-time.
        [Column(TypeName = "datetime2")]
        public DateTime? EndDate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PricePaid { get; set; }

        // "UPI" for paid rows, null for the trial.
        [MaxLength(50)]
        public string? PaymentMethod { get; set; }

        [MaxLength(255)]
        public string? Note { get; set; }

        // false = revoked (e.g. refunded). A row only grants access while IsActive AND now is inside Start/End.
        public bool IsActive { get; set; } = true;

        // ---- NEW: payment proof (paid rows only) ----

        // Gateway payment id (e.g. Razorpay "pay_xxx"). UNIQUE: the same payment can never activate two periods.
        [MaxLength(64)]
        public string? ProviderPaymentId { get; set; }

        // Bank reference (UPI RRN / UTR) reported by the gateway.
        [MaxLength(64)]
        public string? PaymentReference { get; set; }

        // When the money was confirmed (UTC).
        [Column(TypeName = "datetime2")]
        public DateTime? PaidAt { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }

    /// <summary>A UPI QR payment attempt. Starts "pending"; becomes "paid" only via the verified gateway webhook.</summary>
    [Table("SubscriptionPayments")]
    public class SubscriptionPayment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SubscriptionPaymentId { get; set; }

        [Required]
        public int UserId { get; set; }

        // Our own id, sent to the app and used when it polls.
        [Required, MaxLength(64)]
        public string OrderRef { get; set; } = "";

        // Gateway id of the single-use QR for this order.
        [Required, MaxLength(64)]
        public string ProviderQrId { get; set; } = "";

        // FIXED: Increased from 400 to 1000 for long gateway/CDN URLs
        [Required, MaxLength(1000)]
        public string QrImageUrl { get; set; } = "";

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        // pending | paid | expired
        [Required, MaxLength(16)]
        public string Status { get; set; } = "pending";

        [Column(TypeName = "datetime2")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime2")]
        public DateTime ExpiresAt { get; set; }

        // FIXED: Added UpdatedAt property required by ApplicationDbContext
        [Column(TypeName = "datetime2")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }

    // Old enum kept so existing code that references it still compiles; new values appended.
    public enum PlanType
    {
        Free = 1,
        Pro = 2,
        Business = 3,
        Trial = 4,
        Monthly = 5
    }

    public static class SubscriptionPlan
    {
        public const string Trial = "trial";
        public const string Monthly = "monthly";
    }
}