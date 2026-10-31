import { COLUMN_HEADING_SETTINGS_STORAGE_KEY, DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE, DELIVERY_NOTE_DEFAULT_TOP_MESSAGE, DELIVERY_NOTE_SETTINGS_STORAGE_KEY, INVOICE_DEFAULT_BOTTOM_MESSAGE, INVOICE_DEFAULT_TOP_MESSAGE, INVOICE_SETTINGS_STORAGE_KEY, INVOICE_STATUS_OPTIONS, MESSAGE_MODE_SCHEMA_VERSION, PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE, PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE, PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE, PURCHASE_ORDER_DEFAULT_TOP_MESSAGE, PURCHASE_ORDER_SETTINGS_STORAGE_KEY, QUOTATION_DEFAULT_BOTTOM_MESSAGE, QUOTATION_DEFAULT_TOP_MESSAGE, QUOTATION_SETTINGS_STORAGE_KEY, RECEIPT_SETTINGS_STORAGE_KEY, TERMS_STORAGE_KEY } from './constants';

// Displays a state name in Title Case (e.g. "ANDHRA PRADESH" -> "Andhra Pradesh")
// without altering the underlying stored/matched value, which stays uppercase.
export const toTitleCase = (str) => (str || '').toLowerCase().replace(/(^|[^a-zA-Z])([a-zA-Z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // The true, hardcoded factory defaults for Quotation Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
export const getDefaultQuotationSettings = () => ({
    numberPrefix: 'Quote-',
    serialNumber: '5',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: QUOTATION_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: QUOTATION_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });

  // Reads Quotation Settings from local storage (normalizing legacy fields), or falls back
  // to getDefaultQuotationSettings() below. Used only as the initial state on load - the
  // Reset button below intentionally does NOT use this (see getDefaultQuotationSettings).
export const loadQuotationSettings = () => {
    try {
      const saved = localStorage.getItem(QUOTATION_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes".
        {
          // Settings saved under an older schema version (before this migration existed,
          // or by a build that used to pre-fill "Customize" with preset text) can't be
          // trusted to reflect a real user choice - migrate them straight back to
          // "Default" mode/text. Settings already on the current version are honored as-is,
          // including a genuine Customize selection with the user's own typed message.
          const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
          const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
          const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
          return {
            ...parsed,
            taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
            messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
            topMessageMode: topMode,
            topMessage: topMode === 'Default' ? QUOTATION_DEFAULT_TOP_MESSAGE : parsed.topMessage,
            bottomMessageMode: bottomMode,
            bottomMessage: bottomMode === 'Default' ? QUOTATION_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
          };
        }
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultQuotationSettings();
  };

  // The true, hardcoded factory defaults for Invoice Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
export const getDefaultInvoiceSettings = () => ({
    numberPrefix: 'INV-',
    serialNumber: '2',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: INVOICE_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: INVOICE_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });

  // Reads Invoice Settings from local storage (normalizing legacy fields), or falls back to
  // getDefaultInvoiceSettings() below. Used only as the initial state on load - the Reset
  // button below intentionally does NOT use this (see getDefaultInvoiceSettings).
export const loadInvoiceSettings = () => {
    try {
      const saved = localStorage.getItem(INVOICE_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes". Settings saved under an older
        // schema version (before this migration existed, or by a build that used to
        // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
        // choice - migrate them straight back to "Default" mode/text. Settings already on
        // the current version are honored as-is, including a genuine Customize selection.
        const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
        const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
        const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
        return {
          ...parsed,
          taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
          messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
          topMessageMode: topMode,
          topMessage: topMode === 'Default' ? INVOICE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
          bottomMessageMode: bottomMode,
          bottomMessage: bottomMode === 'Default' ? INVOICE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
        };
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultInvoiceSettings();
  };

  // The true, hardcoded factory defaults for Purchase Order Settings - used (a) as the very
  // first-run values before anything has ever been saved, and (b) by the Reset button,
  // which must always land on these exact values regardless of whatever was previously
  // saved/modified (i.e. Reset does NOT just reload the last-saved localStorage copy).
export const getDefaultPurchaseOrderSettings = () => ({
    numberPrefix: 'PO-',
    serialNumber: '1',
    discountType: 'No Discount',
    taxType: 'Yes',
    showProductHSN: 'No',
    showShippingAddress: 'No',
    topMessageMode: 'Default',
    topMessage: PURCHASE_ORDER_DEFAULT_TOP_MESSAGE,
    bottomMessageMode: 'Default',
    bottomMessage: PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE,
    showBankInfo: 'No',
    showUpiInfo: 'No',
    showSignature: 'Yes',
    messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
  });

  // Reads Purchase Order Settings from local storage (normalizing legacy fields), or falls
  // back to getDefaultPurchaseOrderSettings() below. Used only as the initial state on load -
  // the Reset button below intentionally does NOT use this (see getDefaultPurchaseOrderSettings).
export const loadPurchaseOrderSettings = () => {
    try {
      const saved = localStorage.getItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
        // supported Yes/No options, defaulting to "Yes". Settings saved under an older
        // schema version (before this migration existed, or by a build that used to
        // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
        // choice - migrate them straight back to "Default" mode/text. Settings already on
        // the current version are honored as-is, including a genuine Customize selection.
        const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
        const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
        const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
        return {
          ...parsed,
          taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
          messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
          topMessageMode: topMode,
          topMessage: topMode === 'Default' ? PURCHASE_ORDER_DEFAULT_TOP_MESSAGE : parsed.topMessage,
          bottomMessageMode: bottomMode,
          bottomMessage: bottomMode === 'Default' ? PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
        };
      }
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return getDefaultPurchaseOrderSettings();
  };

// The true, hardcoded factory defaults for Proforma Invoice Settings - used (a) as the very
// first-run values before anything has ever been saved, and (b) by the Reset button, which
// must always land on these exact values regardless of whatever was previously saved/modified
// (i.e. Reset does NOT just reload the last-saved localStorage copy).
export const getDefaultProformaInvoiceSettings = () => ({
  numberPrefix: 'PI-',
  serialNumber: '1',
  discountType: 'No Discount',
  taxType: 'Yes',
  showProductHSN: 'No',
  showShippingAddress: 'No',
  topMessageMode: 'Default',
  topMessage: PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE,
  bottomMessageMode: 'Default',
  bottomMessage: PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE,
  showBankInfo: 'No',
  showUpiInfo: 'No',
  showSignature: 'Yes',
  messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
});

// Reads Proforma Invoice Settings from local storage (normalizing legacy fields), or falls
// back to getDefaultProformaInvoiceSettings() below. Used only as the initial state on load -
// the Reset button below intentionally does NOT use this (see getDefaultProformaInvoiceSettings).
export const loadProformaInvoiceSettings = () => {
  try {
    const saved = localStorage.getItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") to the
      // supported Yes/No options, defaulting to "Yes". Settings saved under an older
      // schema version (before this migration existed, or by a build that used to
      // pre-fill "Customize" with preset text) can't be trusted to reflect a real user
      // choice - migrate them straight back to "Default" mode/text. Settings already on
      // the current version are honored as-is, including a genuine Customize selection.
      const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
      const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
      return {
        ...parsed,
        taxType: parsed.taxType === 'No' ? 'No' : 'Yes',
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: topMode,
        topMessage: topMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
        bottomMessageMode: bottomMode,
        bottomMessage: bottomMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
      };
    }
  } catch {
    // Corrupted/unreadable localStorage entry - fall back to defaults below.
  }
  return getDefaultProformaInvoiceSettings();
};

// The true, hardcoded factory defaults for Delivery Note Settings - used (a) as the very
// first-run values before anything has ever been saved, and (b) by the Reset button, which
// must always land on these exact values regardless of whatever was previously saved/modified
// (i.e. Reset does NOT just reload the last-saved localStorage copy).
export const getDefaultDeliveryNoteSettings = () => ({
  numberPrefix: 'DN-',
  serialNumber: '1',
  showProductHSN: 'No',
  showShippingAddress: 'No',
  topMessageMode: 'Default',
  topMessage: DELIVERY_NOTE_DEFAULT_TOP_MESSAGE,
  bottomMessageMode: 'Default',
  bottomMessage: DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE,
  showBankInfo: 'No',
  showUpiInfo: 'No',
  showSignature: 'Yes',
  messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
});

// Reads Delivery Note Settings from local storage (backfilling legacy fields), or falls
// back to getDefaultDeliveryNoteSettings() below. Used only as the initial state on load -
// the Reset button below intentionally does NOT use this (see getDefaultDeliveryNoteSettings).
export const loadDeliveryNoteSettings = () => {
  try {
    const saved = localStorage.getItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Settings saved under an older schema version (before this migration existed, or
      // by a build that used to pre-fill "Customize" with preset text) can't be trusted
      // to reflect a real user choice - migrate them straight back to "Default" mode/text.
      // Settings already on the current version are honored as-is, including a genuine
      // Customize selection.
      const isCurrentSchema = parsed.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const topMode = isCurrentSchema ? (parsed.topMessageMode || 'Default') : 'Default';
      const bottomMode = isCurrentSchema ? (parsed.bottomMessageMode || 'Default') : 'Default';
      return {
        ...parsed,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: topMode,
        topMessage: topMode === 'Default' ? DELIVERY_NOTE_DEFAULT_TOP_MESSAGE : parsed.topMessage,
        bottomMessageMode: bottomMode,
        bottomMessage: bottomMode === 'Default' ? DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE : parsed.bottomMessage,
      };
    }
  } catch {
    // Corrupted/unreadable localStorage entry - fall back to defaults below.
  }
  return getDefaultDeliveryNoteSettings();
};

  // ===== Quotations module: Receipt Settings =====
  // Receipt Settings only has one field (Signature Display), so there is no Reset button
  // here - just Update. Reads from local storage, or falls back to the factory default
  // below (Signature: Yes), used only as the initial state on load.
export const loadReceiptSettings = () => {
    try {
      const saved = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      numberPrefix: 'RECEIPT-',
      serialNumber: '1',
      showSignature: 'Yes',
    };
  };

  // ===== Quotations module: Column Heading Settings =====
  // Reads Column Heading Settings from local storage, or falls back to the defaults below.
  // Used both as the initial state and by the Settings screen's Reset button (which re-runs
  // this to discard any unsaved in-memory edits).
export const loadColumnHeadingSettings = () => {
    try {
      const saved = localStorage.getItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      taxLabel: 'GST',
      hsnLabel: 'HSN',
      otherChargesLabel: 'Other Charges',
      showQty2Column: false,
    };
  };

  // ===== Quotations module: Customer List / Add Customer =====
export const emptyCustomerForm = {
    name: '', companyName: '', email: '', mobile: '',
    addressLine1: '', addressLine2: '', addressLine3: '', otherInfo: '', gstin: '', state: '', pincode: '',
    shippingSameAsBilling: false,
    shippingAddressLine1: '', shippingAddressLine2: '', shippingCity: '', shippingState: '', shippingPincode: '',
    shippingAddress: '', billingAddress: '',
  };

  // ===== Quotations module: Product List / Add Product =====
export const emptyProductForm = {
    name: '', price: '', gst: '', description: '', unit: '', hsn: '',
  };

  // ===== Quotations module: Make Quotation =====
export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const formatQuotationDate = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  // Parses a 'DD/MM/YYYY' string (as produced by formatQuotationDate) back into a Date object.
export const parseQuotationDate = (str) => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
  };

export const emptyQuotationForm = () => ({
    date: formatQuotationDate(new Date()),
    quotationNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
  });

  // ===== Add Quotation Product (dedicated per-line form: Product / Quantity / Price / Description) =====
export const emptyQuotationProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };

  // ===== Terms & Conditions: one independent catalog per document type =====
  // Each document type manages its own list of Terms & Conditions entries, so adding,
  // editing, or deleting a term in one document type never affects any other type.
export const loadTermsCatalog = (perTypeKey) => {
    try {
      const saved = localStorage.getItem(perTypeKey);
      if (saved) return JSON.parse(saved);
      // One-time migration: older versions of the app stored a single shared catalog.
      // Seed this document type's catalog from it so existing terms aren't lost, after
      // which each type is edited and persisted completely independently.
      const legacy = localStorage.getItem(TERMS_STORAGE_KEY);
      if (legacy) return JSON.parse(legacy);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  };

  // ===== Quotations module: Make Purchase Order =====
export const emptyPurchaseOrderForm = () => ({
    date: formatQuotationDate(new Date()),
    purchaseOrderNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
  });

  // ===== Add Purchase Order Product (dedicated per-line form: Product / Quantity / Price / Description) =====
export const emptyPurchaseOrderProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };

  // ===== Quotations module: Make Proforma Invoice =====
export const emptyProformaInvoiceForm = () => ({
    date: formatQuotationDate(new Date()),
    proformaInvoiceNo: '',
    dueDate: '',
    poNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
    paidInfo: [], // { id, date, amount, note }
  });

  // ===== Add Proforma Invoice Product (dedicated per-line form: Product / Quantity / Price / Description) =====
export const emptyProformaInvoiceProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };

  // Paid Info (extra field vs. Make Quotation)
export const emptyProformaPaidInfoForm = () => ({ date: '', amount: '', note: '' });

  // ===== Quotations module: Make Delivery Note =====
export const emptyDeliveryNoteForm = () => ({
    date: formatQuotationDate(new Date()),
    deliveryNoteNo: '',
    refNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    termsIds: [],
  });

  // ===== Add Delivery Note Product (dedicated per-line form: Product / Quantity / Price / Description) =====
export const emptyDeliveryNoteProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };

  // ===== Invoices module: Make Invoice =====
export const emptyInvoiceForm = () => ({
    date: formatQuotationDate(new Date()),
    invoiceNo: '',
    dueDate: '',
    poNo: '',
    otherInfo: '',
    customerId: null,
    products: [], // { productId, name, price, gst, qty }
    otherCharges: [], // { id, label, amount, taxable }
    termsIds: [],
    paidInfo: [], // { id, date, amount, note }
  });

  // ===== Add Invoice Product (dedicated per-line form: Product / Quantity / Price / Description) =====
export const emptyInvoiceProductLineForm = { productId: null, name: '', price: '', gst: 0, unit: '', hsn: '', qty: '1', description: '' };

  // Paid Info (extra field vs. Make Quotation)
export const emptyPaidInfoForm = () => ({ date: '', amount: '', note: '' });

  // ===== Receipts module: Make Receipt =====
export const emptyReceiptForm = () => ({
    date: formatQuotationDate(new Date()),
    receiptNo: '',
    customerId: null,
    paymentMode: '',
    referenceNo: '',
    paidAmount: '',
    paymentFor: '',
  });

  // Receipt Payment Info sub-screen (Matches Screenshot 3)
export const emptyReceiptPaymentDraft = () => ({ paymentMode: '', referenceNo: '', paidAmount: '', paymentFor: '' });

  // Older invoices (and any newly created/converted invoice that doesn't carry a status
  // yet) may still have a leftover generic status like 'In-Progress' / 'Approved' / 'Rejected',
  // or no status at all. Since the Invoice screen now only understands the Paid / Unpaid /
  // Partially Paid / Cancelled set, treat anything outside that set as 'Unpaid' by default.
export const normalizeInvoiceStatus = (status) => (
    INVOICE_STATUS_OPTIONS.includes(status) ? status : 'Unpaid'
  );

export const documentStatusColors = {
    'In-Progress': { bg: '#D97706', text: '#ffffff' },
    'Approved': { bg: '#16A34A', text: '#ffffff' },
    'Rejected': { bg: '#DC2626', text: '#ffffff' },
    'Paid': { bg: '#16A34A', text: '#ffffff' },
    'Unpaid': { bg: '#DC2626', text: '#ffffff' },
    'Partially Paid': { bg: '#D97706', text: '#ffffff' },
    'Cancelled': { bg: '#64748B', text: '#ffffff' },
  };

  // Splits a settings "Top Message" (which may contain a literal newline, e.g.
  // "Dear Sir/Mam,\nThank you...") into separate greeting lines for display.
export const splitTopMessageLines = (msg) => (msg || '').split('\n').map((s) => s.trim()).filter(Boolean);

  // Builds the "To," customer block used by every document preview/PDF. Company + contact
  // name are combined onto one line, and Address Line 1 / Address Line 2 / City
  // (customerAddressLine1-3) are combined onto a second line - condensed from what would
  // otherwise be 5 separate lines, so more product rows fit on the first PDF page.
export const buildCustomerLines = (entity) => {
    const companyNameLine = (entity.customerCompany && entity.customerName)
      ? `${entity.customerCompany} -> ${entity.customerName}`
      : (entity.customerCompany || entity.customerName);
    // Prefer the full billing address (Address Line 1, Address Line 2, City, State, Pincode)
    // saved on the entity; fall back to the raw line1-3 join for older records that predate it.
    const addressLine = entity.customerBillingAddress
      || [entity.customerAddressLine1, entity.customerAddressLine2, entity.customerAddressLine3].filter(Boolean).join(', ');
    return [
      companyNameLine,
      addressLine,
      entity.customerMobile ? `Mobile: ${entity.customerMobile}` : null,
      entity.customerEmail ? `Email: ${entity.customerEmail}` : null,
    ].filter(Boolean);
  };

  // Generic document-model builder shared by Invoice / Purchase Order / Proforma Invoice /
  // Delivery Note detail screens and their PDFs. Produces the exact same shape as
  // buildQuotationDocModel (header/business info + logo, To/Date, item rows, totals,
  // terms, signature + signature image) so every document type gets the identical layout
  // Quotation Detail already has — only the type-specific text/labels/fields passed in via
  // `opts` differ (doc title prefix, greeting/closing copy, which totals rows apply, etc).
export const buildDocModel = (doc, opts) => {
  const {
    docTypeLabel, docNo, terms, toLabel, greetingLines, closingText, pricing = true, hasPayment = false,
    showBankInfo = false, showUpi = false, showSignature = true, showHsn = true, showGst = true, 
    showShippingAddress = false, showReceivedBy = false, snapshot = {},
  } = opts;
  
  const rows = (doc.products || []).map((p, idx) => {
    const taxableAmt = (p.price || 0) * (p.qty || 0);
    const gstAmt = taxableAmt * (p.gst || 0) / 100;
    return {
      index: idx + 1, name: p.name, hsn: p.hsn || '-', qty: p.qty, unit: p.unit || '',
      price: p.price || 0, gstPct: p.gst || 0, gstAmt, total: taxableAmt + gstAmt,
    };
  });
  const subTotal = (doc.products || []).reduce((sum, p) => sum + (p.price || 0) * (p.qty || 0), 0);
  const gstTotal = (doc.products || []).reduce((sum, p) => sum + ((p.price || 0) * (p.qty || 0) * (p.gst || 0) / 100), 0);
  
  // Updated other charges with tax information
  const otherChargesRows = (doc.otherCharges || []).map((c) => {
    const amount = Number(c.amount) || 0;
    const gstPercent = c.taxable ? (Number(c.gstPercent) || 0) : 0;
    const gstAmt = amount * gstPercent / 100;
    return { 
      label: c.label || 'Other Charges', 
      amount, 
      taxable: !!c.taxable, 
      gstPercent, 
      gstAmt, 
      total: amount + gstAmt,
      displayLabel: c.taxable && gstPercent > 0 ? `${c.label} (GST ${gstPercent}%)` : c.label
    };
  });
  const extraChargesTotal = otherChargesRows.reduce((sum, c) => sum + c.total, 0);
  const customerLines = buildCustomerLines(doc);
  const termsLines = (terms || []).filter((t) => (doc.termsIds || []).includes(t.id)).map((t) => t.text);
  
  return {
    docTitle: docTypeLabel,
    businessName: snapshot.businessName || 'Manufacturer',
    businessPhone: snapshot.businessPhone || '',
    businessEmail: snapshot.businessEmail || '',
    hsnLabel: snapshot.hsnLabel || 'HSN',
    date: doc.date,
    toLabel: toLabel || 'To,',
    customerLines,
    shippingAddress: doc.customerShippingAddress || '',
    greetingLines: greetingLines || [],
    closingText: closingText || '',
    rows,
    subTotal,
    gstTotal,
    otherChargesTotal: extraChargesTotal,
    otherChargesRows,
    grandTotal: doc.grandTotal || 0,
    hasPayment,
    paidTotal: doc.paidTotal || 0,
    balanceDue: doc.balanceDue ?? doc.grandTotal ?? 0,
    paidInfo: doc.paidInfo || [],
    termsLines,
    signatureName: snapshot.businessName || 'Manufacturer',
    logoImg: snapshot.logoImg || null,
    signatureImg: snapshot.signatureImg || null,
    pricing,
    otherInfo: doc.otherInfo || '',
    showBankInfo,
    showUpi,
    showSignature,
    showHsn,
    showGst,
    showShippingAddress,
    showReceivedBy,
    bankAccountName: snapshot.bankAccountName || '',
    bankAccountNumber: snapshot.bankAccountNumber || '',
    bankName: snapshot.bankName || '',
    ifscCode: snapshot.ifscCode || '',
    upiId: snapshot.upiId || '',
    qrCodeImg: snapshot.qrCodeImg || null,
  };
};

  // Returns doc's 1-based position among all documents of the same type (list),
  // ordered by creation - i.e. this is the Nth quotation/invoice/etc. the logged-in
  // user has made overall (numbering is separate per document type). Used to name
  // shared PDFs as "<LoggedInUserName>_<DocType>_<n>.pdf".
export const getDocTypeSequence = (list, doc) => {
    if (!doc) return 1;
    const sortKey = (d) => (d.createdAt ? new Date(d.createdAt).getTime() : (Number(d.id) || 0));
    const sorted = [...(list || [])].sort((a, b) => sortKey(a) - sortKey(b));
    const idx = sorted.findIndex((d) => d.id === doc.id);
    return idx >= 0 ? idx + 1 : sorted.length + 1;
  };
