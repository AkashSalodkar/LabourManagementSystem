using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } // 'CREATE', 'UPDATE', 'DELETE'

        [Required]
        [MaxLength(50)]
        public string EntityName { get; set; } // 'Worker', 'Payment', etc.

        public int EntityId { get; set; }

        [MaxLength(500)]
        public string? Details { get; set; } // JSON of changes

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }
    }
}
