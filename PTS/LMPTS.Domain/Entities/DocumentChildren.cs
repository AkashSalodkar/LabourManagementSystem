using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("DocumentProducts")]
    public class DocumentProduct
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        public int DocumentId { get; set; }

        public int? ProductId { get; set; }

        [Required]
        [MaxLength(200)]
        public string ProductName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } = 0; // Added default

        [Column(TypeName = "decimal(5,2)")]
        public decimal Gst { get; set; } = 0; // Added default

        [Column(TypeName = "decimal(18,2)")]
        public decimal Qty { get; set; } = 1; // Added default

        [MaxLength(20)]
        public string? Unit { get; set; }

        [MaxLength(20)]
        public string? Hsn { get; set; }

        public string? Description { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(ProductId))]
        public virtual Product? Product { get; set; }
    }

    [Table("DocumentOtherCharges")]
    public class DocumentOtherCharge
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        public int DocumentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Label { get; set; } = "Other Charges";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 0; // Added default

        public bool IsTaxable { get; set; } = false; // Added default

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("DocumentPaidInfos")]
    public class DocumentPaidInfo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        public int DocumentId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 0; // Added default

        public string? Note { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("DocumentTermSelections")]
    public class DocumentTermSelection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string DocumentType { get; set; } = string.Empty;

        [Required]
        public int DocumentId { get; set; }

        [Required]
        public int TermId { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(TermId))]
        public virtual DocumentTerm Term { get; set; } = null!;
    }
}