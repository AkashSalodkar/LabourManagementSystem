using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class ProductRequestDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; } = 0;  // Non-nullable with default
        public decimal Gst { get; set; } = 0;    // Non-nullable with default
        public string? Description { get; set; }
        public string? Unit { get; set; }
        public string? Hsn { get; set; }
    }

    public class ProductResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Gst { get; set; }
        public string? Description { get; set; }
        public string? Unit { get; set; }
        public string? Hsn { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}