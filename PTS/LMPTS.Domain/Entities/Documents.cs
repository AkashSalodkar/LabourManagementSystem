using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    public abstract class DocumentBase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        public string? OtherInfo { get; set; }

        public int? CustomerId { get; set; }

        // Snapshot fields
        [MaxLength(100)]
        public string? CustomerName { get; set; }

        [MaxLength(100)]
        public string? CustomerCompany { get; set; }

        [MaxLength(10)]
        public string? CustomerMobile { get; set; }

        [MaxLength(100)]
        public string? CustomerEmail { get; set; }

        [MaxLength(200)]
        public string? CustomerAddressLine1 { get; set; }

        [MaxLength(200)]
        public string? CustomerAddressLine2 { get; set; }

        [MaxLength(100)]
        public string? CustomerAddressLine3 { get; set; }

        public string? CustomerBillingAddress { get; set; }
        public string? CustomerShippingAddress { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; } // In-Progress, Approved, Rejected

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }

        // NOTE: This class intentionally does NOT declare navigation collections to
        // DocumentProduct/DocumentOtherCharge/DocumentTermSelection. Those tables are
        // shared across all five document types (Quotation, Invoice, PurchaseOrder,
        // ProformaInvoice, DeliveryNote), distinguished only by the DocumentType string
        // column — a polymorphic association enforced in application code
        // (see DocumentsController.SaveDocumentChildren), not a real relational FK.
        // A navigation property here would make EF infer a hard foreign key from the
        // shared DocumentId column to *this* table specifically, which breaks the moment
        // the same row needs to satisfy that same column against four other tables too.
    }

    [Table("Quotations")]
    public class Quotation : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string QuotationNo { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; } = 0;
    }

    [Table("PurchaseOrders")]
    public class PurchaseOrder : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string PurchaseOrderNo { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; } = 0;
    }

    [Table("ProformaInvoices")]
    public class ProformaInvoice : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string ProformaInvoiceNo { get; set; } = string.Empty;

        [Column(TypeName = "date")]
        public DateTime? DueDate { get; set; }

        [MaxLength(50)]
        public string? PoNo { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidTotal { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceDue { get; set; } = 0;

    }

    [Table("Invoices")]
    public class Invoice : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string InvoiceNo { get; set; } = string.Empty;

        [Column(TypeName = "date")]
        public DateTime? DueDate { get; set; }

        [MaxLength(50)]
        public string? PoNo { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidTotal { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceDue { get; set; } = 0;

    }

    [Table("DeliveryNotes")]
    public class DeliveryNote : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string DeliveryNoteNo { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? RefNo { get; set; }
    }

    [Table("Receipts")]
    public class Receipt
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(50)]
        public string ReceiptNo { get; set; } = string.Empty;

        public int? CustomerId { get; set; }

        [MaxLength(20)]
        public string? PaymentMode { get; set; }

        [MaxLength(50)]
        public string? ReferenceNo { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidAmount { get; set; } = 0; // Changed to non-nullable with default

        public string? PaymentFor { get; set; }

        // Snapshot fields
        [MaxLength(100)]
        public string? CustomerName { get; set; }

        [MaxLength(100)]
        public string? CustomerCompany { get; set; }

        [MaxLength(10)]
        public string? CustomerMobile { get; set; }

        [MaxLength(100)]
        public string? CustomerEmail { get; set; }

        [MaxLength(200)]
        public string? CustomerAddressLine1 { get; set; }

        [MaxLength(200)]
        public string? CustomerAddressLine2 { get; set; }

        [MaxLength(100)]
        public string? CustomerAddressLine3 { get; set; }

        public string? CustomerBillingAddress { get; set; }
        public string? CustomerShippingAddress { get; set; }

        [MaxLength(20)]
        public string? Status { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer? Customer { get; set; }
    }
}