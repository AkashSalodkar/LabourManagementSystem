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

        public virtual ICollection<DocumentProduct> Products { get; set; } = new List<DocumentProduct>();
        public virtual ICollection<DocumentOtherCharge> OtherCharges { get; set; } = new List<DocumentOtherCharge>();
        public virtual ICollection<DocumentTermSelection> TermSelections { get; set; } = new List<DocumentTermSelection>();
    }

    [Table("Quotations")]
    public class Quotation : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string QuotationNo { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }
    }

    [Table("PurchaseOrders")]
    public class PurchaseOrder : DocumentBase
    {
        [Required]
        [MaxLength(50)]
        public string PurchaseOrderNo { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrandTotal { get; set; }
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
        public decimal GrandTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceDue { get; set; }

        public virtual ICollection<DocumentPaidInfo> PaidInfos { get; set; } = new List<DocumentPaidInfo>();
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
        public decimal GrandTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceDue { get; set; }

        public virtual ICollection<DocumentPaidInfo> PaidInfos { get; set; } = new List<DocumentPaidInfo>();
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
        public decimal? PaidAmount { get; set; }

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