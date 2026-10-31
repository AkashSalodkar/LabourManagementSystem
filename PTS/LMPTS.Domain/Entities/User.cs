using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("Users")]
    public class User : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string MobileNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Industry { get; set; }

        // Base64 data URL of the user's profile photo (e.g. "data:image/jpeg;base64,...").
        // Stored inline for now - move to blob storage + URL if this needs to scale.
        public string? ProfileImage { get; set; }

        public bool IsVerified { get; set; } = false;

        public UserRole Role { get; set; } = UserRole.Supervisor;

        [MaxLength(128)]
        public string? CurrentSessionToken { get; set; }

        // When the currently-active session token was issued (audit / support).
        [Column(TypeName = "datetime2")]
        public DateTime? SessionTokenCreatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
        public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public virtual DashboardStats? DashboardStats { get; set; }
    }

    public enum UserRole
    {
        Supervisor = 1,
        Admin = 2
    }
}