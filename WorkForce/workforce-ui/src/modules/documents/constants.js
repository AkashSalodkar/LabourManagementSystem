export const BUSINESS_INFO_STORAGE_KEY = 'workforce_app_business_info';

export const QUOTATION_SETTINGS_STORAGE_KEY = 'workforce_app_quotation_settings';

export const INVOICE_SETTINGS_STORAGE_KEY = 'workforce_app_invoice_settings';

export const PURCHASE_ORDER_SETTINGS_STORAGE_KEY = 'workforce_app_purchase_order_settings';

export const PROFORMA_INVOICE_SETTINGS_STORAGE_KEY = 'workforce_app_proforma_invoice_settings';

export const DELIVERY_NOTE_SETTINGS_STORAGE_KEY = 'workforce_app_delivery_note_settings';

export const RECEIPT_SETTINGS_STORAGE_KEY = 'workforce_app_receipt_settings';

// Bump this whenever the Top/Bottom Message Default/Customize/Hide feature's stored shape
// changes in a way that makes old saved data untrustworthy (e.g. an older build that used
// to pre-fill "Customize" with preset text). Settings saved under an older version are
// migrated back to "Default" mode on load rather than trying to guess whether their text
// is "real" custom content or stale leftovers - the user can always re-enter Customize and
// type their own message, which will then be saved under the current version and trusted
// on every later load.
export const MESSAGE_MODE_SCHEMA_VERSION = 2;

export const COLUMN_HEADING_SETTINGS_STORAGE_KEY = 'workforce_app_column_heading_settings';

export const CUSTOMERS_STORAGE_KEY = 'workforce_app_customers';

export const PRODUCTS_STORAGE_KEY = 'workforce_app_products';

export const TERMS_STORAGE_KEY = 'workforce_app_terms';

 // legacy shared key - kept only to migrate existing data into the per-type keys below
export const QUOTATION_TERMS_STORAGE_KEY = 'workforce_app_terms_quotation';

export const PURCHASE_ORDER_TERMS_STORAGE_KEY = 'workforce_app_terms_purchase_order';

export const PROFORMA_INVOICE_TERMS_STORAGE_KEY = 'workforce_app_terms_proforma_invoice';

export const DELIVERY_NOTE_TERMS_STORAGE_KEY = 'workforce_app_terms_delivery_note';

export const INVOICE_TERMS_STORAGE_KEY = 'workforce_app_terms_invoice';

export const QUOTATIONS_STORAGE_KEY = 'workforce_app_quotations';

export const INVOICES_STORAGE_KEY = 'workforce_app_invoices';

export const PURCHASE_ORDERS_STORAGE_KEY = 'workforce_app_purchase_orders';

export const PROFORMA_INVOICES_STORAGE_KEY = 'workforce_app_proforma_invoices';

export const DELIVERY_NOTES_STORAGE_KEY = 'workforce_app_delivery_notes';

export const RECEIPTS_STORAGE_KEY = 'workforce_app_receipts';

export const RECEIPT_PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

// ===== Indian States / Union Territories list (for "Select State" pickers) =====
// Standard GST-portal state list, used wherever a customer's State is captured.
export const INDIAN_STATE_LIST = [
  'ANDAMAN AND NICOBAR ISLANDS', 'ANDHRA PRADESH', 'ANDHRA PRADESH(BEFORE DIVISION)',
  'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CENTRE JURISDICTION', 'CHANDIGARH',
  'CHHATTISGARH', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DELHI', 'GOA',
  'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JAMMU AND KASHMIR', 'JHARKHAND',
  'KARNATAKA', 'KERALA', 'LADAKH', 'LAKSHADWEEP', 'MADHYA PRADESH', 'MAHARASHTRA',
  'MANIPUR', 'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'OTHER TERRITORY',
  'PUDUCHERRY', 'PUNJAB', 'RAJASTHAN', 'SIKKIM', 'TAMIL NADU', 'TELANGANA',
  'TRIPURA', 'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
];

// ===== GSTIN validation =====
// Standard 15-character GSTIN format: 2-digit state code, 10-char PAN,
// 1-digit entity number, fixed 'Z', and a final checksum char.
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ===== Email validation =====
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ===== PIN code validation =====
// Standard Indian PIN code: exactly 6 digits, first digit 1-9 (0 is not a valid leading digit).
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// ===== HSN code validation =====
// HSN/SAC codes on Indian tax documents are numeric, 4/6/8 digits long.
export const HSN_REGEX = /^\d{4}(\d{2}){0,2}$/;

// ===== PAN validation =====
// Standard 10-character PAN format: 5 letters, 4 digits, 1 letter.
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ===== IFSC code validation =====
// Standard 11-character IFSC format: 4 letters (bank code), fixed '0', then
// 6 alphanumeric characters (branch code).
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// ===== UPI ID validation =====
// e.g. "name@bankhandle" - handle part before @ plus a short alphabetic bank/app suffix.
export const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  // ===== Quotations module: Quotation Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
export const QUOTATION_DEFAULT_TOP_MESSAGE = 'Please find our quotation below';

export const QUOTATION_DEFAULT_BOTTOM_MESSAGE = 'We look forward to working with you';

  // ===== Quotations module: Invoice Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
export const INVOICE_DEFAULT_TOP_MESSAGE = 'Please find the invoice details below';

export const INVOICE_DEFAULT_BOTTOM_MESSAGE = 'Thank you for choosing us';

  // ===== Quotations module: Purchase Order Settings =====
  // Professional default copy used whenever "Default" mode is selected for the top/bottom
  // message (also the fallback text for brand-new settings before the user has customized).
export const PURCHASE_ORDER_DEFAULT_TOP_MESSAGE = 'Please find the purchase order below';

export const PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE = 'Thank you for your prompt attention to this order';

  // ===== Quotations module: Proforma Invoice Settings =====
  // ===== Quotations module: Proforma Invoice Settings =====
// Professional default copy used whenever "Default" mode is selected for the top/bottom
// message (also the fallback text for brand-new settings before the user has customized).
export const PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE = 'Please find the proforma invoice below';

export const PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE = 'We look forward to your confirmation.';

  // ===== Quotations module: Delivery Note Settings =====
  // ===== Quotations module: Delivery Note Settings =====
// Professional default copy used whenever "Default" mode is selected for the top/bottom
// message (also the fallback text for brand-new settings before the user has customized).
export const DELIVERY_NOTE_DEFAULT_TOP_MESSAGE = 'Please find the delivery details below';

export const DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE = 'Kindly acknowledge receipt of the goods.';

export const DOCUMENT_STATUS_OPTIONS = ['In-Progress', 'Approved', 'Rejected'];

  // Invoice Status uses its own set of options (Paid / Unpaid / Partially Paid / Cancelled)
  // instead of the generic In-Progress / Approved / Rejected set used by the other document modules.
export const INVOICE_STATUS_OPTIONS = ['Paid', 'Unpaid', 'Partially Paid', 'Cancelled'];

  // ===== Shared professional-document design system =====
  // One consistent typography/spacing scale used by every generated-document preview
  // screen (Quotation, Purchase Order, Proforma Invoice, Delivery Note, Invoice, Receipt)
  // so all documents in the Quotation Module look like one coherent, business-grade product.
export const DOC_FONT = "'Helvetica Neue', Arial, 'Segoe UI', sans-serif";
