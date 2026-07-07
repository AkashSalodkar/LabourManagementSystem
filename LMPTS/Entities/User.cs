using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    public class User
    {
        public int UserId { get; set; }
        [Column("Full Name")]
        public string FullName { get; set; } = string.Empty;
        [Column("Mobile Number")]
        public required string MobileNumber { get; set; }
        public required string Industry { get; set; }
        [Column("Password")]
        public required string PasswordHash { get; set; }
        [Column("Company Name")]
        public string? CompanyName { get; set; }
        [Column("GST Number")]
        public string? GSTNumber { get; set; }
        [Column("PAN Number")]
        public string? PANNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        [Column("Pin Code")]
        public double? PinCode { get; set; }
        public string? State { get; set; }

        public ICollection<AttendanceRecord> AttendanceRecords { get; set; }
            = new List<AttendanceRecord>();
        public ICollection<Payment> Payments { get; set; }
            = new List<Payment>();
    }
}
