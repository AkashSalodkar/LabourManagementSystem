using LMPTS.Entities;

public class User
{
    public int UserId { get; set; }
    public string FullName { get; set; }
    public string MobileNumber { get; set; }
    public string Industry { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; }

    // Add role
    public UserRole Role { get; set; } = UserRole.Supervisor;

    // Navigation properties
    public ICollection<Project> Projects { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; }
    public ICollection<Notification> Notifications { get; set; }
    public ICollection<AuditLog> AuditLogs { get; set; }
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
    public ICollection<Payment> Payments { get; set; }
    public DashboardStats DashboardStats { get; set; }
}

public enum UserRole
{
    Supervisor = 1,
    Admin = 2
}