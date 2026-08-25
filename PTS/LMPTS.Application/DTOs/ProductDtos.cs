using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class ProductRequestDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public decimal? Gst { get; set; }
        public string? Description { get; set; }
        public string? Unit { get; set; }
        public string? Hsn { get; set; }
    }

    public class ProductResponseDto : ProductRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}