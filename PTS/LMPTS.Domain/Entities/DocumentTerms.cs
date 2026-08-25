using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("DocumentTerms")]
    public class DocumentTerm
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(20)]
        public string DocumentType { get; set; } = string.Empty; // Quotation, Invoice, etc.

        [Required]
        public string Text { get; set; } = string.Empty;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}