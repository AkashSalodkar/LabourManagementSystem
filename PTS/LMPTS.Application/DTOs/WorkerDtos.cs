using System.ComponentModel.DataAnnotations;

public class CreateWorkerRequestDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? MobileNumber { get; set; }

    [Required]
    public DateTime JoiningDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal DailyWage { get; set; } = 400;

    [MaxLength(50)]
    public string Role { get; set; } = "Worker";

    [Range(0, double.MaxValue)]
    public decimal Advance { get; set; } = 0;

    [Range(0, double.MaxValue)]
    public decimal Bonus { get; set; } = 0;

    [Required]
    public int ProjectId { get; set; }
}

public class UpdateWorkerRequestDto
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? MobileNumber { get; set; }

    [Required]
    public DateTime JoiningDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal DailyWage { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = "Worker";

    [Range(0, double.MaxValue)]
    public decimal Advance { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Bonus { get; set; }
}