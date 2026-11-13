using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("RewardedAdAccess")]
    public class RewardedAdAccess
    {
        [Key]
        public int RewardedAdAccessId { get; set; }

        [Required, MaxLength(64)]
        public string ChallengeToken { get; set; } = "";

        [MaxLength(128)]
        public string? TransactionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Column(TypeName = "datetime2")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime2")]
        public DateTime ExpiresAt { get; set; }

        [Column(TypeName = "datetime2")]
        public DateTime? UsedAt { get; set; }
    }
}
