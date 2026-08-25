using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    // Product Line Item
    public class DocumentProductDto
    {
        public string? ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal Gst { get; set; }
        public decimal Qty { get; set; }
        public string? Unit { get; set; }
        public string? Hsn { get; set; }
        public string? Description { get; set; }
    }

    // Other Charge
    public class DocumentOtherChargeDto
    {
        public string? Id { get; set; }
        public string Label { get; set; } = "Other Charges";
        public decimal Amount { get; set; }
        public bool Taxable { get; set; }
    }

    // Paid Info (for Invoices & Proforma Invoices)
    public class DocumentPaidInfoDto
    {
        public string? Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public string DocumentType { get; set; } = "Invoice"; // Added this
    }

    // Terms & Conditions
    public class DocumentTermDto
    {
        public string? Id { get; set; }
        public string Text { get; set; } = string.Empty;
    }

    // ---------- Base Document ----------
    public abstract class DocumentBaseDto
    {
        public string Date { get; set; } = string.Empty;
        public string? OtherInfo { get; set; }
        public int? CustomerId { get; set; }
        public List<DocumentProductDto> Products { get; set; } = new();
        public List<DocumentOtherChargeDto> OtherCharges { get; set; } = new();
        public List<string> TermsIds { get; set; } = new();

        // Snapshot fields
        public string? CustomerName { get; set; }
        public string? CustomerCompany { get; set; }
        public string? CustomerMobile { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerAddressLine1 { get; set; }
        public string? CustomerAddressLine2 { get; set; }
        public string? CustomerAddressLine3 { get; set; }
        public string? CustomerBillingAddress { get; set; }
        public string? CustomerShippingAddress { get; set; }
    }

    // ---------- Quotation ----------
    public class QuotationRequestDto : DocumentBaseDto
    {
        public string QuotationNo { get; set; } = string.Empty;
    }

    public class QuotationResponseDto : QuotationRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ---------- Purchase Order ----------
    public class PurchaseOrderRequestDto : DocumentBaseDto
    {
        public string PurchaseOrderNo { get; set; } = string.Empty;
    }

    public class PurchaseOrderResponseDto : PurchaseOrderRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal GrandTotal { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ---------- Proforma Invoice ----------
    public class ProformaInvoiceRequestDto : DocumentBaseDto
    {
        public string ProformaInvoiceNo { get; set; } = string.Empty;
        public string? DueDate { get; set; }
        public string? PoNo { get; set; }
        public List<DocumentPaidInfoDto> PaidInfo { get; set; } = new();
    }

    public class ProformaInvoiceResponseDto : ProformaInvoiceRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal GrandTotal { get; set; }
        public decimal PaidTotal { get; set; }
        public decimal BalanceDue { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ---------- Delivery Note ----------
    public class DeliveryNoteRequestDto : DocumentBaseDto
    {
        public string DeliveryNoteNo { get; set; } = string.Empty;
        public string? RefNo { get; set; }
    }

    public class DeliveryNoteResponseDto : DeliveryNoteRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ---------- Invoice ----------
    public class InvoiceRequestDto : DocumentBaseDto
    {
        public string InvoiceNo { get; set; } = string.Empty;
        public string? DueDate { get; set; }
        public string? PoNo { get; set; }
        public List<DocumentPaidInfoDto> PaidInfo { get; set; } = new();
    }

    public class InvoiceResponseDto : InvoiceRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal GrandTotal { get; set; }
        public decimal PaidTotal { get; set; }
        public decimal BalanceDue { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // ---------- Receipt ----------
    public class ReceiptRequestDto
    {
        public string Date { get; set; } = string.Empty;
        public string ReceiptNo { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string? PaymentMode { get; set; }
        public string? ReferenceNo { get; set; }
        public decimal? PaidAmount { get; set; }
        public string? PaymentFor { get; set; }

        // Snapshot fields
        public string? CustomerName { get; set; }
        public string? CustomerCompany { get; set; }
        public string? CustomerMobile { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerAddressLine1 { get; set; }
        public string? CustomerAddressLine2 { get; set; }
        public string? CustomerAddressLine3 { get; set; }
        public string? CustomerBillingAddress { get; set; }
        public string? CustomerShippingAddress { get; set; }
    }

    public class ReceiptResponseDto : ReceiptRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}