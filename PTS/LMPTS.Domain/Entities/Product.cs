using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("Products")]
    public class Product
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Price { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Gst { get; set; }

        public string? Description { get; set; }

        [MaxLength(20)]
        public string? Unit { get; set; }

        [MaxLength(20)]
        public string? Hsn { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}