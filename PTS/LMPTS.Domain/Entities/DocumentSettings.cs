using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    public abstract class DocumentSetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [MaxLength(20)]
        public string NumberPrefix { get; set; } = string.Empty;

        [MaxLength(10)]
        public string SerialNumber { get; set; } = "1";

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }

    [Table("QuotationSettings")]
    public class QuotationSetting : DocumentSetting
    {
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string ShowShippingAddress { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "Yes";
        public string ShowUpiInfo { get; set; } = "Yes";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("InvoiceSettings")]
    public class InvoiceSetting : DocumentSetting
    {
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "Yes";
        public string ShowUpiInfo { get; set; } = "Yes";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("PurchaseOrderSettings")]
    public class PurchaseOrderSetting : DocumentSetting
    {
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "No";
        public string ShowUpiInfo { get; set; } = "No";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("ProformaInvoiceSettings")]
    public class ProformaInvoiceSetting : DocumentSetting
    {
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "No";
        public string ShowUpiInfo { get; set; } = "No";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("DeliveryNoteSettings")]
    public class DeliveryNoteSetting : DocumentSetting
    {
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("ReceiptSettings")]
    public class ReceiptSetting : DocumentSetting
    {
        public string ReceiptType { get; set; } = "Simple";
        public string ShowSignature { get; set; } = "Yes";
    }

    [Table("ColumnHeadingSettings")]
    public class ColumnHeadingSetting
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public string TaxLabel { get; set; } = "GST";
        public string HsnLabel { get; set; } = "HSN";
        public string OtherChargesLabel { get; set; } = "Other Charges";
        public bool ShowQty2Column { get; set; } = false;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}