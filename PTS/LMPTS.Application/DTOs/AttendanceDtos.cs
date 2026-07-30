using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class MarkAttendanceRequestDto
    {
        [Required]
        public int WorkerId { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; }

        [Required]
        [MaxLength(2)]
        public string Status { get; set; } = string.Empty;
    }

    public class BulkMarkAttendanceRequestDto
    {
        [Required]
        public int ProjectId { get; set; }

        [Required]
        public List<DateTime> Dates { get; set; } = new List<DateTime>();

        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class AttendanceResponseDto
    {
        public int AttendanceId { get; set; }
        public int WorkerId { get; set; }
        public string WorkerName { get; set; } = string.Empty;
        public DateTime AttendanceDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal DailyRate { get; set; }
        public decimal NetAmount { get; set; }
    }
}