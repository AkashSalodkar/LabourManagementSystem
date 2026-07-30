using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class CreateProjectRequestDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProjectAddress { get; set; }
    }

    public class UpdateProjectRequestDto
    {
        [Required]
        [MaxLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProjectAddress { get; set; }
    }

    public class ProjectResponseDto
    {
        public int Id { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string? ProjectAddress { get; set; }
        public int WorkerCount { get; set; }
        public int PresentToday { get; set; }
        public decimal TotalDue { get; set; }
        public DateTime LastModifiedAt { get; set; }
        public bool IsActive { get; set; }
        public List<WorkerResponseDto>? Employees { get; set; }
    }
}