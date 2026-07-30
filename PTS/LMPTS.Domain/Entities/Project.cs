using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("Projects")]
    public class Project : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? ProjectAddress { get; set; }

        [Required]
        public int UserId { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        public virtual ICollection<Worker> Workers { get; set; } = new List<Worker>();
    }
}