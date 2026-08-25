namespace LMPTS.Application.DTOs
{
    public class QuotationSettingsDto
    {
        public string NumberPrefix { get; set; } = "Quote-";
        public string SerialNumber { get; set; } = "5";
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

    public class InvoiceSettingsDto
    {
        public string NumberPrefix { get; set; } = "INV-";
        public string SerialNumber { get; set; } = "2";
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "Yes";
        public string ShowUpiInfo { get; set; } = "Yes";
        public string ShowSignature { get; set; } = "Yes";
    }

    public class PurchaseOrderSettingsDto
    {
        public string NumberPrefix { get; set; } = "PO-";
        public string SerialNumber { get; set; } = "1";
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "No";
        public string ShowUpiInfo { get; set; } = "No";
        public string ShowSignature { get; set; } = "Yes";
    }

    public class ProformaInvoiceSettingsDto
    {
        public string NumberPrefix { get; set; } = "PI-";
        public string SerialNumber { get; set; } = "1";
        public string DiscountType { get; set; } = "No Discount";
        public string TaxType { get; set; } = "No Tax";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowBankInfo { get; set; } = "No";
        public string ShowUpiInfo { get; set; } = "No";
        public string ShowSignature { get; set; } = "Yes";
    }

    public class DeliveryNoteSettingsDto
    {
        public string NumberPrefix { get; set; } = "DN-";
        public string SerialNumber { get; set; } = "1";
        public string ShowProductHSN { get; set; } = "No";
        public string TopMessage { get; set; } = "";
        public string BottomMessage { get; set; } = "";
        public string ShowSignature { get; set; } = "Yes";
    }

    public class ReceiptSettingsDto
    {
        public string NumberPrefix { get; set; } = "RECEIPT-";
        public string SerialNumber { get; set; } = "1";
        public string ReceiptType { get; set; } = "Simple";
        public string ShowSignature { get; set; } = "Yes";
    }

    public class ColumnHeadingSettingsDto
    {
        public string TaxLabel { get; set; } = "GST";
        public string HsnLabel { get; set; } = "HSN";
        public string OtherChargesLabel { get; set; } = "Other Charges";
        public bool ShowQty2Column { get; set; } = false;
    }
}