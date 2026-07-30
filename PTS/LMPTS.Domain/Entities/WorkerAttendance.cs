using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("WorkerAttendances")]
    public class WorkerAttendance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AttendanceId { get; set; }

        [Required]
        public int WorkerId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime AttendanceDate { get; set; }

        [Required]
        [MaxLength(2)]
        public string Status { get; set; } = string.Empty; // 'P', 'HD', 'A'

        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyRate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal NetAmount { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(WorkerId))]
        public virtual Worker Worker { get; set; } = null!;
    }

    public enum AttendanceStatus
    {
        Present = 1,
        HalfDay = 2,
        Absent = 3
    }
}