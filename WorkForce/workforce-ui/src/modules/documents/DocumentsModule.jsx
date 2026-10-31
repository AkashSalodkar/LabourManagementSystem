// ===== Module 2: Quotation, Invoice & Business Docs =====
// Everything for this module lives here: business info, customers, products, quotations, invoices,
// purchase orders, proforma invoices, delivery notes, receipts, settings and terms. It is always
// mounted while the user is signed in (so its data stays loaded) and only draws its screens while
// activeModule === 'quotations'.

import { AppPopup, ContactPickButton } from '../../shared/components';
import { BUSINESS_INFO_STORAGE_KEY, COLUMN_HEADING_SETTINGS_STORAGE_KEY, CUSTOMERS_STORAGE_KEY, DELIVERY_NOTES_STORAGE_KEY, DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE, DELIVERY_NOTE_DEFAULT_TOP_MESSAGE, DELIVERY_NOTE_SETTINGS_STORAGE_KEY, DELIVERY_NOTE_TERMS_STORAGE_KEY, INDIAN_STATE_LIST, INVOICES_STORAGE_KEY, INVOICE_DEFAULT_BOTTOM_MESSAGE, INVOICE_DEFAULT_TOP_MESSAGE, INVOICE_SETTINGS_STORAGE_KEY, INVOICE_STATUS_OPTIONS, INVOICE_TERMS_STORAGE_KEY, MESSAGE_MODE_SCHEMA_VERSION, PRODUCTS_STORAGE_KEY, PROFORMA_INVOICES_STORAGE_KEY, PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE, PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE, PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, PROFORMA_INVOICE_TERMS_STORAGE_KEY, PURCHASE_ORDERS_STORAGE_KEY, PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE, PURCHASE_ORDER_DEFAULT_TOP_MESSAGE, PURCHASE_ORDER_SETTINGS_STORAGE_KEY, PURCHASE_ORDER_TERMS_STORAGE_KEY, QUOTATIONS_STORAGE_KEY, QUOTATION_DEFAULT_BOTTOM_MESSAGE, QUOTATION_DEFAULT_TOP_MESSAGE, QUOTATION_SETTINGS_STORAGE_KEY, QUOTATION_TERMS_STORAGE_KEY, RECEIPTS_STORAGE_KEY, RECEIPT_PAYMENT_MODES, RECEIPT_SETTINGS_STORAGE_KEY } from './constants';
import { DocumentListCard, DocumentStatusBadge, DocumentStatusSheet, FieldInput, GeneratedDocumentPreview, LabeledField, SegmentedModeRow, ToggleSwitchRow } from './components';
import { FiArrowLeft, FiBox, FiCamera, FiCheck, FiChevronDown, FiChevronRight, FiCreditCard, FiEdit3, FiEye, FiFileText, FiFilter, FiImage, FiPercent, FiPlus, FiSearch, FiTag, FiTrash2, FiTruck, FiUser } from 'react-icons/fi';
import { HiOutlineBuildingOffice2, HiOutlineCog6Tooth, HiOutlinePencil } from 'react-icons/hi2';
import { buildCustomerLines, buildDocModel, emptyCustomerForm, emptyDeliveryNoteForm, emptyDeliveryNoteProductLineForm, emptyInvoiceForm, emptyInvoiceProductLineForm, emptyPaidInfoForm, emptyProductForm, emptyProformaInvoiceForm, emptyProformaInvoiceProductLineForm, emptyProformaPaidInfoForm, emptyPurchaseOrderForm, emptyPurchaseOrderProductLineForm, emptyQuotationForm, emptyQuotationProductLineForm, emptyReceiptForm, emptyReceiptPaymentDraft, formatQuotationDate, genId, getDefaultDeliveryNoteSettings, getDefaultInvoiceSettings, getDefaultProformaInvoiceSettings, getDefaultPurchaseOrderSettings, getDefaultQuotationSettings, getDocTypeSequence, loadColumnHeadingSettings, loadDeliveryNoteSettings, loadInvoiceSettings, loadProformaInvoiceSettings, loadPurchaseOrderSettings, loadQuotationSettings, loadReceiptSettings, loadTermsCatalog, normalizeInvoiceStatus, parseQuotationDate, splitTopMessageLines, toTitleCase } from './helpers';
import { businessInfoService, customerService, deliveryNotesService, documentService, invoicesService, productsService, proformaInvoicesService, purchaseOrdersService, receiptsService, settingsService, termsService } from './services';
import { businessInfoStyles, customerModuleStyles, themeStyles } from '../../shared/styles';
import { deliverGeneratedPdf, drawAmountText, ensureJsPDF, jsPDF, registerRupeeFont } from '../../shared/pdf';
import { docActionBarStyles, docStyles, makeQuotationStyles, quotationModuleStyles, quotationSettingsStyles } from './styles';
import { getInitials, toLocalISODate } from '../../shared/helpers';
import { isValidEmailAddress, isValidGSTIN, isValidHSN, isValidIFSC, isValidPAN, isValidPincode, isValidUPI } from './validators';
import { isValidMobileNumber } from '../../shared/validators';
import smartpayLogo from '../../assets/icon.png';
import { useAppShell } from '../../app/AppShellContext';
import { useEffect, useRef, useState } from 'react';

export default function DocumentsModule() {
  const {
    activeModule,
    appPopup,
    closeAppPopup,
    closeProfileModalIfOpen,
    closeSubscribeOrHelpIfOpen,
    confirmDiscardThen,
    getAppLogoDataUrl,
    isReconnecting,
    isUserAuthenticated,
    loggedInUser,
    moduleRegistryRef,
    openImageCropper,
    profileImg,
    renderImageCropperModal,
    renderProfileModal,
    setActiveModule,
    //setShowProformaInvoiceMoreSheet,
    //setShowProformaInvoiceStatusSheet,
    showAlert,
    showConfirm,
    showSuccess,
    t,
  } = useAppShell();


// Add this state near other state declarations
// ===== LOAD BUSINESS INFO =====
const [loadingBusinessInfo, setLoadingBusinessInfo] = useState(false);

const loadUserBusinessInfo = async (userId) => {
  try {
    setLoadingBusinessInfo(true);
    const response = await businessInfoService.getBusinessInfo(userId);
    if (response) {
      setBusinessInfo(prev => ({
        ...prev,
        logoImg: response.logoImg || null,
        signatureImg: response.signatureImg || null,
        qrCodeImg: response.qrCodeImg || null,
        businessName: response.businessName || prev.businessName,
        contactName: response.contactName || '',
        email: response.email || '',
        phone: response.phone || '',
        addressLine1: response.addressLine1 || '',
        addressLine2: response.addressLine2 || '',
        addressLine3: response.city || '',
        otherInfo: response.otherInfo || '',
        businessCategory: response.businessCategory || '',
        taxLabel: response.taxLabel || 'GSTIN',
        taxNumber: response.taxNumber || '',
        state: response.state || '',
        pincode: response.pinCode || '',
        bankAccountName: response.bankAccountName || '',
        bankAccountNumber: response.bankAccountNumber || '',
        bankName: response.bankName || '',
        ifscCode: response.ifscCode || '',
        upiId: response.upiId || '',
      }));
      try { localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(businessInfo)); } catch { /* ignore */ }
    }
  } catch (error) {
    console.error('Error loading business info:', error);
  } finally {
    setLoadingBusinessInfo(false);
  }
};


// ===== LOAD PRODUCTS =====
const [loadingProducts, setLoadingProducts] = useState(false);

const loadUserProducts = async (userId) => {
  try {
    setLoadingProducts(true);
    const response = await productsService.getProducts(userId);
    setProducts(response);
    try { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading products:', error);
    // Keep local cache on failure
  } finally {
    setLoadingProducts(false);
  }
};


// ===== LOAD INVOICES =====
const [loadingInvoices, setLoadingInvoices] = useState(false);

const loadUserInvoices = async (userId) => {
  try {
    setLoadingInvoices(true);
    const response = await invoicesService.getInvoices(userId);
    const parsedInvoices = response.map(inv => ({
      ...inv,
      docSnapshot: inv.docSnapshot ? JSON.parse(inv.docSnapshot) : null
    }));
    setInvoices(parsedInvoices);
    try { localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(parsedInvoices)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading invoices:', error);
  } finally {
    setLoadingInvoices(false);
  }
};


// Do the same for purchase orders, proforma invoices, delivery notes

// ===== LOAD PURCHASE ORDERS =====
const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false);

const loadUserPurchaseOrders = async (userId) => {
  try {
    setLoadingPurchaseOrders(true);
    const response = await purchaseOrdersService.getPurchaseOrders(userId);
    const parsedPurchaseOrders = response.map(po => ({
      ...po,
      docSnapshot: po.docSnapshot ? JSON.parse(po.docSnapshot) : null
    }));
    setPurchaseOrders(parsedPurchaseOrders);
    try { localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(parsedPurchaseOrders)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading purchase orders:', error);
  } finally {
    setLoadingPurchaseOrders(false);
  }
};

// ===== LOAD PROFORMA INVOICES =====
const [loadingProformaInvoices, setLoadingProformaInvoices] = useState(false);

const loadUserProformaInvoices = async (userId) => {
  try {
    setLoadingProformaInvoices(true);
    const response = await proformaInvoicesService.getProformaInvoices(userId);
    const parsedProformaInvoices = response.map(pi => ({
      ...pi,
      docSnapshot: pi.docSnapshot ? JSON.parse(pi.docSnapshot) : null
    }));
    setProformaInvoices(parsedProformaInvoices);
    try { localStorage.setItem(PROFORMA_INVOICES_STORAGE_KEY, JSON.stringify(parsedProformaInvoices)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading proforma invoices:', error);
  } finally {
    setLoadingProformaInvoices(false);
  }
};


// ===== LOAD DELIVERY NOTES =====
const [loadingDeliveryNotes, setLoadingDeliveryNotes] = useState(false);

const loadUserDeliveryNotes = async (userId) => {
  try {
    setLoadingDeliveryNotes(true);
    const response = await deliveryNotesService.getDeliveryNotes(userId);
    const parsedDeliveryNotes = response.map(dn => ({
      ...dn,
      docSnapshot: dn.docSnapshot ? JSON.parse(dn.docSnapshot) : null
    }));
    setDeliveryNotes(parsedDeliveryNotes);
    try { localStorage.setItem(DELIVERY_NOTES_STORAGE_KEY, JSON.stringify(parsedDeliveryNotes)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading delivery notes:', error);
  } finally {
    setLoadingDeliveryNotes(false);
  }
};


// ===== LOAD RECEIPTS =====
const [loadingReceipts, setLoadingReceipts] = useState(false);

const loadUserReceipts = async (userId) => {
  try {
    setLoadingReceipts(true);
    const response = await receiptsService.getReceipts(userId);
    const parsedReceipts = response.map(r => {
      // Per-row try/catch so one bad/corrupt docSnapshot value can't throw
      // inside .map() and abort parsing of every other receipt (mirrors the
      // fallback pattern buildQuotationDocModel already uses).
      let parsedSnapshot = null;
      if (r.docSnapshot) {
        try {
          parsedSnapshot = JSON.parse(r.docSnapshot);
        } catch (e) {
          console.error('Error parsing docSnapshot for receipt', r.id, e);
          parsedSnapshot = null;
        }
      }
      return { ...r, docSnapshot: parsedSnapshot };
    });
    setReceipts(parsedReceipts);
    try { localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(parsedReceipts)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading receipts:', error);
  } finally {
    setLoadingReceipts(false);
  }
};


// ===== LOAD SETTINGS =====
const [loadingSettings, setLoadingSettings] = useState(false);

const loadUserSettings = async (userId) => {
  try {
    setLoadingSettings(true);
    const response = await settingsService.getSettings(userId);
    
    if (response.quotation) {
      // Normalize any legacy/invalid GST Display value (e.g. old "No Tax") coming
      // from the server to the supported Yes/No options, defaulting to "Yes".
      const normalizedQuotation = { ...response.quotation, taxType: response.quotation.taxType === 'No' ? 'No' : 'Yes' };
      // Same schema-version safeguard as loadQuotationSettings() below: settings saved
      // under an older schema (or a build that used to pre-fill "Customize" with preset
      // text) can't be trusted to reflect a real user choice - migrate them back to
      // "Default" mode/text. Whenever a message field is in "Default" mode, always force
      // it to the CURRENT default copy rather than whatever text the server happens to
      // have stored, so switching Customize -> Default always lands on the same text the
      // screen showed on load (fixes the default message appearing to "change").
      const isCurrentQuotationSchema = normalizedQuotation.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const quotationTopMode = isCurrentQuotationSchema ? (normalizedQuotation.topMessageMode || 'Default') : 'Default';
      const quotationBottomMode = isCurrentQuotationSchema ? (normalizedQuotation.bottomMessageMode || 'Default') : 'Default';
      const finalQuotation = {
        ...normalizedQuotation,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: quotationTopMode,
        topMessage: quotationTopMode === 'Default' ? QUOTATION_DEFAULT_TOP_MESSAGE : normalizedQuotation.topMessage,
        bottomMessageMode: quotationBottomMode,
        bottomMessage: quotationBottomMode === 'Default' ? QUOTATION_DEFAULT_BOTTOM_MESSAGE : normalizedQuotation.bottomMessage,
      };
      setQuotationSettings(prev => ({ ...prev, ...finalQuotation }));
      localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(finalQuotation));
    }
    if (response.invoice) {
      const normalizedInvoice = { ...response.invoice, taxType: response.invoice.taxType === 'No' ? 'No' : 'Yes' };
      // Same schema-version safeguard as loadInvoiceSettings() below: whenever a message
      // field is in "Default" mode, force it to the CURRENT default copy rather than
      // whatever text the server happens to have stored, so switching Customize -> Default
      // always lands on the same text the screen showed on load.
      const isCurrentInvoiceSchema = normalizedInvoice.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const invoiceTopMode = isCurrentInvoiceSchema ? (normalizedInvoice.topMessageMode || 'Default') : 'Default';
      const invoiceBottomMode = isCurrentInvoiceSchema ? (normalizedInvoice.bottomMessageMode || 'Default') : 'Default';
      const finalInvoice = {
        ...normalizedInvoice,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: invoiceTopMode,
        topMessage: invoiceTopMode === 'Default' ? INVOICE_DEFAULT_TOP_MESSAGE : normalizedInvoice.topMessage,
        bottomMessageMode: invoiceBottomMode,
        bottomMessage: invoiceBottomMode === 'Default' ? INVOICE_DEFAULT_BOTTOM_MESSAGE : normalizedInvoice.bottomMessage,
      };
      setInvoiceSettings(prev => ({ ...prev, ...finalInvoice }));
      localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(finalInvoice));
    }
    if (response.purchaseOrder) {
      const normalizedPurchaseOrder = { ...response.purchaseOrder, taxType: response.purchaseOrder.taxType === 'No' ? 'No' : 'Yes' };
      // Same schema-version safeguard as loadPurchaseOrderSettings() below.
      const isCurrentPOSchema = normalizedPurchaseOrder.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const poTopMode = isCurrentPOSchema ? (normalizedPurchaseOrder.topMessageMode || 'Default') : 'Default';
      const poBottomMode = isCurrentPOSchema ? (normalizedPurchaseOrder.bottomMessageMode || 'Default') : 'Default';
      const finalPurchaseOrder = {
        ...normalizedPurchaseOrder,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: poTopMode,
        topMessage: poTopMode === 'Default' ? PURCHASE_ORDER_DEFAULT_TOP_MESSAGE : normalizedPurchaseOrder.topMessage,
        bottomMessageMode: poBottomMode,
        bottomMessage: poBottomMode === 'Default' ? PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE : normalizedPurchaseOrder.bottomMessage,
      };
      setPurchaseOrderSettings(prev => ({ ...prev, ...finalPurchaseOrder }));
      localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(finalPurchaseOrder));
    }
    if (response.proformaInvoice) {
      const normalizedProformaInvoice = { ...response.proformaInvoice, taxType: response.proformaInvoice.taxType === 'No' ? 'No' : 'Yes' };
      // Same schema-version safeguard as loadProformaInvoiceSettings() below.
      const isCurrentProformaSchema = normalizedProformaInvoice.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const proformaTopMode = isCurrentProformaSchema ? (normalizedProformaInvoice.topMessageMode || 'Default') : 'Default';
      const proformaBottomMode = isCurrentProformaSchema ? (normalizedProformaInvoice.bottomMessageMode || 'Default') : 'Default';
      const finalProformaInvoice = {
        ...normalizedProformaInvoice,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: proformaTopMode,
        topMessage: proformaTopMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE : normalizedProformaInvoice.topMessage,
        bottomMessageMode: proformaBottomMode,
        bottomMessage: proformaBottomMode === 'Default' ? PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE : normalizedProformaInvoice.bottomMessage,
      };
      setProformaInvoiceSettings(prev => ({ ...prev, ...finalProformaInvoice }));
      localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(finalProformaInvoice));
    }
    if (response.deliveryNote) {
      // Same schema-version safeguard as loadDeliveryNoteSettings() below.
      const isCurrentDNSchema = response.deliveryNote.messageModeSchemaVersion === MESSAGE_MODE_SCHEMA_VERSION;
      const dnTopMode = isCurrentDNSchema ? (response.deliveryNote.topMessageMode || 'Default') : 'Default';
      const dnBottomMode = isCurrentDNSchema ? (response.deliveryNote.bottomMessageMode || 'Default') : 'Default';
      const finalDeliveryNote = {
        ...response.deliveryNote,
        messageModeSchemaVersion: MESSAGE_MODE_SCHEMA_VERSION,
        topMessageMode: dnTopMode,
        topMessage: dnTopMode === 'Default' ? DELIVERY_NOTE_DEFAULT_TOP_MESSAGE : response.deliveryNote.topMessage,
        bottomMessageMode: dnBottomMode,
        bottomMessage: dnBottomMode === 'Default' ? DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE : response.deliveryNote.bottomMessage,
      };
      setDeliveryNoteSettings(prev => ({ ...prev, ...finalDeliveryNote }));
      localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(finalDeliveryNote));
    }
    if (response.receipt) {
      setReceiptSettings(prev => ({ ...prev, ...response.receipt }));
      localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(response.receipt));
    }
    if (response.columnHeading) {
      setColumnHeadingSettings(prev => ({ ...prev, ...response.columnHeading }));
      localStorage.setItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY, JSON.stringify(response.columnHeading));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    setLoadingSettings(false);
  }
};


// ===== LOAD TERMS =====
const loadUserTerms = async (userId) => {
  try {
    // Load terms for each document type
    // NOTE: these must match the exact documentType strings used when terms are created
    // (see openAddTermsModal's context values / handleAddTerm) - the server matches on
    // this string exactly, so a casing mismatch here silently returns zero terms for
    // every document type on reload (e.g. after a fresh install with no local cache).
    const types = ['quotation', 'invoice', 'purchaseOrder', 'proformaInvoice', 'deliveryNote'];
    const results = await Promise.all(
      types.map(type => termsService.getTerms(userId, type).catch(() => []))
    );
    
    if (results[0]) setQuotationTerms(results[0]);
    if (results[1]) setInvoiceTerms(results[1]);
    if (results[2]) setPurchaseOrderTerms(results[2]);
    if (results[3]) setProformaInvoiceTerms(results[3]);
    if (results[4]) setDeliveryNoteTerms(results[4]);
  } catch (error) {
    console.error('Error loading terms:', error);
  }
};

// Loads this user's quotations from the server and replaces local state +
// the localStorage cache with what the DB actually has, the same pattern
// used for loadUserProjects above.
const [loadingQuotations, setLoadingQuotations] = useState(false);

const loadUserQuotations = async (userId) => {
  try {
    setLoadingQuotations(true);
    const response = await documentService.getQuotations(userId);
    const parsedQuotations = response.map(q => {
      let parsedSnapshot = null;
      if (q.docSnapshot) {
        try {
          parsedSnapshot = JSON.parse(q.docSnapshot);
        } catch (e) {
          console.error('Error parsing docSnapshot for quotation', q.id, e);
          parsedSnapshot = null;
        }
      }
      return { ...q, docSnapshot: parsedSnapshot };
    });
    setQuotations(parsedQuotations);
    try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(parsedQuotations)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading quotations:', error);
  } finally {
    setLoadingQuotations(false);
  }
};


// Add this state near other state declarations
const [loadingCustomers, setLoadingCustomers] = useState(false);

// Loads this user's customers from the server and replaces local state +
// the localStorage cache with what the DB actually has - same pattern as
// loadUserQuotations above. This is what makes customer.id a real numeric
// DB id instead of the old client-generated string id.
const loadUserCustomers = async (userId) => {
  try {
    setLoadingCustomers(true);
    const response = await customerService.getCustomers(userId);
    setCustomers(response);
    try { localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(response)); } catch { /* ignore */ }
  } catch (error) {
    console.error('Error loading customers:', error);
    // Keep whatever was already loaded from the localStorage cache on failure.
  } finally {
    setLoadingCustomers(false);
  }
};

  // ===== Sub-screen inside the Quotations module (e.g. 'business' = Update Business Info) =====
  const [quotationSubView, setQuotationSubView] = useState(null);

  // Where a document's Settings detail screen (e.g. 'quotationSettingsDetail') should return to
  // on Back - captured at the moment Settings is opened, since it's now reachable both from the
  // per-document "Make X" page header and (still, internally) from the Settings menu list.
  const [settingsReturnView, setSettingsReturnView] = useState('settingsMenu');

  // Where the product-picker screen ("Select Product") should return to on Back - captured at
  // the moment it's opened, since it can be reached either directly from a document's PRODUCTS
  // row or from that document's Add Product line form (when changing an already-picked product).
  const [productPickerReturnView, setProductPickerReturnView] = useState(null);

  const [businessInfo, setBusinessInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return {
      logoImg: null, signatureImg: null, qrCodeImg: null,
      businessName: (loggedInUser?.industry || '').toLowerCase(),
      contactName: '', email: '',
      phone: loggedInUser?.mobileNumber ? `+91 ${loggedInUser.mobileNumber}` : '',
      addressLine1: '', addressLine2: '', addressLine3: '',
      otherInfo: '', businessCategory: '',
      taxLabel: 'GSTIN', taxNumber: '', state: '', pincode: '',
      bankAccountName: '', bankAccountNumber: '', bankName: '', ifscCode: '', upiId: '',
    };
  });

  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);

  const [businessInfoErrors, setBusinessInfoErrors] = useState({});

  const updateBusinessField = (key, value) => {
    setBusinessInfo(prev => ({ ...prev, [key]: value }));
    if (businessInfoErrors[key]) setBusinessInfoErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleUpdateBusinessInfo = async () => {
  const errors = {};
  if (businessInfo.email.trim() && !isValidEmailAddress(businessInfo.email)) errors.email = 'Enter a valid email address';
  if (businessInfo.phone.trim() && !isValidMobileNumber(businessInfo.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (businessInfo.taxNumber.trim()) {
    if (businessInfo.taxLabel === 'GSTIN' && !isValidGSTIN(businessInfo.taxNumber)) errors.taxNumber = 'Enter a valid GSTIN';
    if (businessInfo.taxLabel === 'PAN' && !isValidPAN(businessInfo.taxNumber)) errors.taxNumber = 'Enter a valid PAN';
  }
  if (businessInfo.upiId.trim() && !isValidUPI(businessInfo.upiId)) errors.upiId = 'Enter a valid UPI ID';
  if ((businessInfo.pincode || '').trim() && !isValidPincode(businessInfo.pincode)) errors.pincode = 'Enter a valid 6-digit PIN code';
  if (businessInfo.ifscCode.trim() && !isValidIFSC(businessInfo.ifscCode)) errors.ifscCode = 'Enter a valid 11-character IFSC code';
  
  if (Object.keys(errors).length > 0) {
    setBusinessInfoErrors(errors);
    showAlert('Please correct the highlighted fields.', 'error');
    return;
  }
  
  setBusinessInfoErrors({});
  
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save business info.');
    return;
  }

  try {
    const result = await businessInfoService.updateBusinessInfo(loggedInUser.userId, {
      logoImg: businessInfo.logoImg,
      signatureImg: businessInfo.signatureImg,
      qrCodeImg: businessInfo.qrCodeImg,
      businessName: businessInfo.businessName,
      contactName: businessInfo.contactName,
      email: businessInfo.email,
      phone: businessInfo.phone,
      addressLine1: businessInfo.addressLine1,
      addressLine2: businessInfo.addressLine2,
      city: businessInfo.addressLine3,
      otherInfo: businessInfo.otherInfo,
      businessCategory: businessInfo.businessCategory,
      taxLabel: businessInfo.taxLabel,
      taxNumber: businessInfo.taxNumber,
      state: businessInfo.state,
      pinCode: businessInfo.pincode,
      bankAccountName: businessInfo.bankAccountName,
      bankAccountNumber: businessInfo.bankAccountNumber,
      bankName: businessInfo.bankName,
      ifscCode: businessInfo.ifscCode,
      upiId: businessInfo.upiId,
    });
    
    // Update local state with server response
    setBusinessInfo(prev => ({
      ...prev,
      logoImg: result.logoImg || prev.logoImg,
      signatureImg: result.signatureImg || prev.signatureImg,
      qrCodeImg: result.qrCodeImg || prev.qrCodeImg,
      businessName: result.businessName || prev.businessName,
      contactName: result.contactName || prev.contactName,
      email: result.email || prev.email,
      phone: result.phone || prev.phone,
      addressLine1: result.addressLine1 || prev.addressLine1,
      addressLine2: result.addressLine2 || prev.addressLine2,
      addressLine3: result.city || prev.addressLine3,
      otherInfo: result.otherInfo || prev.otherInfo,
      businessCategory: result.businessCategory || prev.businessCategory,
      taxLabel: result.taxLabel || prev.taxLabel,
      taxNumber: result.taxNumber || prev.taxNumber,
      state: result.state || prev.state,
      pincode: result.pinCode || prev.pincode,
      bankAccountName: result.bankAccountName || prev.bankAccountName,
      bankAccountNumber: result.bankAccountNumber || prev.bankAccountNumber,
      bankName: result.bankName || prev.bankName,
      ifscCode: result.ifscCode || prev.ifscCode,
      upiId: result.upiId || prev.upiId,
    }));
    
    try { localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(businessInfo)); } catch { /* ignore */ }
    showSuccess('Business info updated.');
    setQuotationSubView(null);
  } catch (error) {
    console.error('Error updating business info:', error);
    showAlert('Could not save business info. Please try again.');
  }
};

  const handleCloseBankDetailsModal = () => {
    if (businessInfo.ifscCode.trim() && !isValidIFSC(businessInfo.ifscCode)) {
      setBusinessInfoErrors(prev => ({ ...prev, ifscCode: 'Enter a valid 11-character IFSC code' }));
      showAlert('Please enter a valid IFSC code.', 'error');
      return;
    }
    setIsBankDetailsModalOpen(false);
  };

  const handleBusinessImagePick = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openImageCropper(key, reader.result);
    reader.readAsDataURL(file);
  };


  // ===== Business Info: Logo / Signature image action sheet, viewer, and signature drawing pad =====
  const [imageActionSheet, setImageActionSheet] = useState(null);
 // 'logo' | 'signature' | null
  const [imageViewerSrc, setImageViewerSrc] = useState(null);

  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  const [signaturePadKey, setSignaturePadKey] = useState(0);

  const logoCameraInputRef = useRef(null);

  const logoPhotoInputRef = useRef(null);

  const signatureCameraInputRef = useRef(null);

  const signaturePhotoInputRef = useRef(null);

  const qrCodeCameraInputRef = useRef(null);

  const qrCodePhotoInputRef = useRef(null);

  const signatureCanvasRef = useRef(null);

  const signatureDrawingRef = useRef(false);

  const openImageActionSheet = (type) => setImageActionSheet(type);

  const closeImageActionSheet = () => setImageActionSheet(null);

  const handleRemoveBusinessImage = (key) => {
    updateBusinessField(key, null);
    closeImageActionSheet();
  };

  const openSignaturePad = () => {
    setSignaturePadKey((k) => k + 1);
    setIsSignaturePadOpen(true);
    closeImageActionSheet();
  };

  const getSignatureCanvasPoint = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleSignaturePointerDown = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    signatureDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getSignatureCanvasPoint(e);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSignaturePointerMove = (e) => {
    if (!signatureDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getSignatureCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleSignaturePointerUp = () => {
    signatureDrawingRef.current = false;
  };

  const handleClearSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    updateBusinessField('signatureImg', canvas.toDataURL('image/png'));
    setIsSignaturePadOpen(false);
  };

  const [quotationSettings, setQuotationSettings] = useState(loadQuotationSettings);

  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Quotation created, the same
  // way Update does. Any already-created Quotation documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetQuotationSettings = () => {
    showConfirm('Reset Quotation Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultQuotationSettings();
      setQuotationSettings(defaults);
      try { localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updateQuotationSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting quotation settings on server:', error);
        }
      }
      showSuccess('Quotation settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };

  const updateQuotationSettingField = (key, value) => setQuotationSettings(prev => ({ ...prev, [key]: value }));

  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Quotation
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyQuotationMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? QUOTATION_DEFAULT_TOP_MESSAGE : QUOTATION_DEFAULT_BOTTOM_MESSAGE;
    setQuotationSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };

  // ✅ CORRECT - Calls the API
const handleUpdateQuotationSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateQuotationSettings(loggedInUser.userId, quotationSettings);
    try { localStorage.setItem(QUOTATION_SETTINGS_STORAGE_KEY, JSON.stringify(quotationSettings)); } catch { /* ignore */ }
    showSuccess('Quotation settings updated.');
  } catch (error) {
    console.error('Error updating quotation settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  const [invoiceSettings, setInvoiceSettings] = useState(loadInvoiceSettings);

  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Invoice created, the same
  // way Update does. Any already-created Invoice documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetInvoiceSettings = () => {
    showConfirm('Reset Invoice Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultInvoiceSettings();
      setInvoiceSettings(defaults);
      try { localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updateInvoiceSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting invoice settings on server:', error);
        }
      }
      showSuccess('Invoice settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };

  const updateInvoiceSettingField = (key, value) => setInvoiceSettings(prev => ({ ...prev, [key]: value }));

  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Invoice
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyInvoiceMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? INVOICE_DEFAULT_TOP_MESSAGE : INVOICE_DEFAULT_BOTTOM_MESSAGE;
    setInvoiceSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };

  const handleUpdateInvoiceSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateInvoiceSettings(loggedInUser.userId, invoiceSettings);
    try { localStorage.setItem(INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(invoiceSettings)); } catch { /* ignore */ }
    showSuccess('Invoice settings updated.');
    setQuotationSubView(settingsReturnView);
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  const [purchaseOrderSettings, setPurchaseOrderSettings] = useState(loadPurchaseOrderSettings);

  // Reset always reverts to the original factory defaults - regardless of any previously
  // saved or modified settings - and persists that reset immediately (to local storage and,
  // if signed in, to the server) so it takes effect for the next Purchase Order created, the
  // same way Update does. Any already-created Purchase Order documents keep their own frozen
  // docSnapshot and are unaffected until the user opens and re-saves them.
  const handleResetPurchaseOrderSettings = () => {
    showConfirm('Reset Purchase Order Settings to the default values? This will discard any saved or unsaved changes.', async () => {
      const defaults = getDefaultPurchaseOrderSettings();
      setPurchaseOrderSettings(defaults);
      try { localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
      if (loggedInUser?.userId) {
        try {
          await settingsService.updatePurchaseOrderSettings(loggedInUser.userId, defaults);
        } catch (error) {
          console.error('Error resetting purchase order settings on server:', error);
        }
      }
      showSuccess('Purchase order settings reset to default.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };

  const updatePurchaseOrderSettingField = (key, value) => setPurchaseOrderSettings(prev => ({ ...prev, [key]: value }));

  // Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Purchase Order
  // Settings: switching to Customize always gives the user a blank draft to type into,
  // UNLESS they already have real custom text saved (i.e. they're re-entering Customize
  // mode with something they'd previously typed themselves) - it never pre-fills the
  // professional preset text. Switching to Default fills it with the professional preset
  // text (read-only). Hide simply stops the message from showing on the document (the
  // underlying text, if any, is left untouched).
  const applyPurchaseOrderMessageMode = (kind, mode) => {
    const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
    const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
    const defaultMsg = kind === 'top' ? PURCHASE_ORDER_DEFAULT_TOP_MESSAGE : PURCHASE_ORDER_DEFAULT_BOTTOM_MESSAGE;
    setPurchaseOrderSettings(prev => {
      const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
      return {
        ...prev,
        [modeField]: mode,
        [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
      };
    });
  };

  const handleUpdatePurchaseOrderSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updatePurchaseOrderSettings(loggedInUser.userId, purchaseOrderSettings);
    try { localStorage.setItem(PURCHASE_ORDER_SETTINGS_STORAGE_KEY, JSON.stringify(purchaseOrderSettings)); } catch { /* ignore */ }
    showSuccess('Purchase order settings updated.');
    setQuotationSubView(settingsReturnView);
  } catch (error) {
    console.error('Error updating purchase order settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

const [proformaInvoiceSettings, setProformaInvoiceSettings] = useState(loadProformaInvoiceSettings);

// Reset always reverts to the original factory defaults - regardless of any previously
// saved or modified settings - and persists that reset immediately (to local storage and,
// if signed in, to the server) so it takes effect for the next Proforma Invoice created, the
// same way Update does. Any already-created Proforma Invoice documents keep their own frozen
// docSnapshot and are unaffected until the user opens and re-saves them.
const handleResetProformaInvoiceSettings = () => {
  showConfirm('Reset Proforma Invoice Settings to the default values? This will discard any saved or unsaved changes.', async () => {
    const defaults = getDefaultProformaInvoiceSettings();
    setProformaInvoiceSettings(defaults);
    try { localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
    if (loggedInUser?.userId) {
      try {
        await settingsService.updateProformaInvoiceSettings(loggedInUser.userId, defaults);
      } catch (error) {
        console.error('Error resetting proforma invoice settings on server:', error);
      }
    }
    showSuccess('Proforma invoice settings reset to default.');
  }, { confirmLabel: 'Reset', tone: 'warning' });
};

  const updateProformaInvoiceSettingField = (key, value) => setProformaInvoiceSettings(prev => ({ ...prev, [key]: value }));


// Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Proforma Invoice
// Settings: switching to Customize seeds the field with the professional preset text as
// a starting point if it's currently empty (otherwise leaves any existing custom text
// as-is, instead of being wiped), switching to Default fills it with the professional
// preset text (read-only), and Hide simply stops the message from showing on the
// document (the underlying text is preserved so it's still there if the user switches back).
const applyProformaInvoiceMessageMode = (kind, mode) => {
  const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
  const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
  const defaultMsg = kind === 'top' ? PROFORMA_INVOICE_DEFAULT_TOP_MESSAGE : PROFORMA_INVOICE_DEFAULT_BOTTOM_MESSAGE;
  setProformaInvoiceSettings(prev => {
    const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
    return {
      ...prev,
      [modeField]: mode,
      [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
    };
  });
};

  const handleUpdateProformaInvoiceSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateProformaInvoiceSettings(loggedInUser.userId, proformaInvoiceSettings);
    try { localStorage.setItem(PROFORMA_INVOICE_SETTINGS_STORAGE_KEY, JSON.stringify(proformaInvoiceSettings)); } catch { /* ignore */ }
    showSuccess('Proforma invoice settings updated.');
    setQuotationSubView(settingsReturnView);
  } catch (error) {
    console.error('Error updating proforma invoice settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

const [deliveryNoteSettings, setDeliveryNoteSettings] = useState(loadDeliveryNoteSettings);

// Reset always reverts to the original factory defaults - regardless of any previously
// saved or modified settings - and persists that reset immediately (to local storage and,
// if signed in, to the server) so it takes effect for the next Delivery Note created, the
// same way Update does. Any already-created Delivery Note documents keep their own frozen
// docSnapshot and are unaffected until the user opens and re-saves them.
const handleResetDeliveryNoteSettings = () => {
  showConfirm('Reset Delivery Note Settings to the default values? This will discard any saved or unsaved changes.', async () => {
    const defaults = getDefaultDeliveryNoteSettings();
    setDeliveryNoteSettings(defaults);
    try { localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(defaults)); } catch { /* ignore */ }
    if (loggedInUser?.userId) {
      try {
        await settingsService.updateDeliveryNoteSettings(loggedInUser.userId, defaults);
      } catch (error) {
        console.error('Error resetting delivery note settings on server:', error);
      }
    }
    showSuccess('Delivery note settings reset to default.');
  }, { confirmLabel: 'Reset', tone: 'warning' });
};

  const updateDeliveryNoteSettingField = (key, value) => setDeliveryNoteSettings(prev => ({ ...prev, [key]: value }));


// Applies a Top/Bottom Message mode change (Customize / Default / Hide) for Delivery Note
// Settings: switching to Customize seeds the field with the professional preset text as
// a starting point if it's currently empty (otherwise leaves any existing custom text
// as-is, instead of being wiped), switching to Default fills it with the professional
// preset text (read-only), and Hide simply stops the message from showing on the
// document (the underlying text is preserved so it's still there if the user switches back).
const applyDeliveryNoteMessageMode = (kind, mode) => {
  const messageField = kind === 'top' ? 'topMessage' : 'bottomMessage';
  const modeField = kind === 'top' ? 'topMessageMode' : 'bottomMessageMode';
  const defaultMsg = kind === 'top' ? DELIVERY_NOTE_DEFAULT_TOP_MESSAGE : DELIVERY_NOTE_DEFAULT_BOTTOM_MESSAGE;
  setDeliveryNoteSettings(prev => {
    const hasRealCustomText = prev[modeField] === 'Customize' && prev[messageField] && prev[messageField] !== defaultMsg;
    return {
      ...prev,
      [modeField]: mode,
      [messageField]: mode === 'Customize' ? (hasRealCustomText ? prev[messageField] : '') : mode === 'Default' ? defaultMsg : prev[messageField],
    };
  });
};

  const handleUpdateDeliveryNoteSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateDeliveryNoteSettings(loggedInUser.userId, deliveryNoteSettings);
    try { localStorage.setItem(DELIVERY_NOTE_SETTINGS_STORAGE_KEY, JSON.stringify(deliveryNoteSettings)); } catch { /* ignore */ }
    showSuccess('Delivery note settings updated.');
    setQuotationSubView(settingsReturnView);
  } catch (error) {
    console.error('Error updating delivery note settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  const [receiptSettings, setReceiptSettings] = useState(loadReceiptSettings);

  const updateReceiptSettingField = (key, value) => setReceiptSettings(prev => ({ ...prev, [key]: value }));

  const handleUpdateReceiptSettings = async () => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save settings.');
    return;
  }
  try {
    await settingsService.updateReceiptSettings(loggedInUser.userId, receiptSettings);
    try { localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(receiptSettings)); } catch { /* ignore */ }
    showSuccess('Receipt settings updated.');
    setQuotationSubView(settingsReturnView);
  } catch (error) {
    console.error('Error updating receipt settings:', error);
    showAlert('Could not save settings. Please try again.');
  }
};

  const [columnHeadingSettings, setColumnHeadingSettings] = useState(loadColumnHeadingSettings);

  const handleResetColumnHeadingSettings = () => {
    showConfirm('Discard all unsaved changes to Column Heading Settings?', () => {
      setColumnHeadingSettings(loadColumnHeadingSettings());
      showSuccess('Column heading settings reset.');
    }, { confirmLabel: 'Reset', tone: 'warning' });
  };

  const updateColumnHeadingSettingField = (key, value) => setColumnHeadingSettings(prev => ({ ...prev, [key]: value }));

  const handleUpdateColumnHeadingSettings = () => {
    try {
      localStorage.setItem(COLUMN_HEADING_SETTINGS_STORAGE_KEY, JSON.stringify(columnHeadingSettings));
      showSuccess('Column heading settings updated.');
    } catch {
      showAlert('Could not save column heading settings on this device.');
    }
  };

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  });

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  const [editingCustomerId, setEditingCustomerId] = useState(null);

  // Guards against double-tap / double-click while a save is in flight, so
  // repeated clicks on "Add Customer" don't create duplicate customers.
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const updateCustomerField = (key, value) => setCustomerForm(prev => ({ ...prev, [key]: value }));

  const [customerGstinError, setCustomerGstinError] = useState(false);

  const [customerMobileError, setCustomerMobileError] = useState(false);

  const [customerEmailError, setCustomerEmailError] = useState(false);

  const [customerPincodeError, setCustomerPincodeError] = useState(false);

  const [customerShippingPincodeError, setCustomerShippingPincodeError] = useState(false);

  const [showStatePicker, setShowStatePicker] = useState(false);

  const [stateSearchQuery, setStateSearchQuery] = useState('');

  // Which form the shared State picker below should write its selection into -
  // 'customer' (Add/Edit Customer) or 'business' (Update Business Info).
  const [stateFieldTarget, setStateFieldTarget] = useState('customer');

  const filteredStateList = INDIAN_STATE_LIST.filter((s) =>
    s.toLowerCase().includes(stateSearchQuery.trim().toLowerCase())
  );

  const persistCustomers = (next) => {
    setCustomers(next);
    try { localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const openAddCustomer = (returnView = 'customerList') => {
    setCustomerForm(emptyCustomerForm);
    setEditingCustomerId(null);
    setCustomerFormReturnView(returnView);
    setCustomerGstinError(false);
    setCustomerMobileError(false);
    setCustomerEmailError(false);
    setCustomerPincodeError(false);
    setCustomerShippingPincodeError(false);
    setStateSearchQuery('');
    setQuotationSubView('addCustomer');
  };

  const openEditCustomer = (customer, returnView = 'customerList') => {
    setCustomerForm({ ...emptyCustomerForm, ...customer });
    setEditingCustomerId(customer.id);
    setCustomerFormReturnView(returnView);
    setCustomerGstinError(false);
    setCustomerMobileError(false);
    setCustomerEmailError(false);
    setCustomerPincodeError(false);
    setCustomerShippingPincodeError(false);
    setStateSearchQuery('');
    setQuotationSubView('addCustomer');
  };

  const handleSaveCustomer = async () => {
    if (isSavingCustomer) return; // guard against double-tap / double-click while a save is in flight
    if (!customerForm.name.trim()) {
      showAlert('Please enter the customer name.');
      return;
    }
    if (customerForm.mobile.trim() && !isValidMobileNumber(customerForm.mobile)) {
      setCustomerMobileError(true);
      showAlert('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    setCustomerMobileError(false);
    if (customerForm.email.trim() && !isValidEmailAddress(customerForm.email)) {
      setCustomerEmailError(true);
      showAlert('Please enter a valid email address.', 'error');
      return;
    }
    setCustomerEmailError(false);
    if (customerForm.pincode.trim() && !isValidPincode(customerForm.pincode)) {
      setCustomerPincodeError(true);
      showAlert('Please enter a valid 6-digit PIN code.', 'error');
      return;
    }
    setCustomerPincodeError(false);
    if (customerForm.gstin.trim() && !isValidGSTIN(customerForm.gstin)) {
      setCustomerGstinError(true);
      showAlert('Please enter correct GST number.', 'error');
      return;
    }
    setCustomerGstinError(false);
    if (
      !customerForm.shippingSameAsBilling &&
      customerForm.shippingPincode.trim() &&
      !isValidPincode(customerForm.shippingPincode)
    ) {
      setCustomerShippingPincodeError(true);
      showAlert('Please enter a valid 6-digit shipping PIN code.', 'error');
      return;
    }
    setCustomerShippingPincodeError(false);

    // Build the flat billing/shipping address strings that quotations, invoices,
    // and other documents read - kept in sync with the structured fields above,
    // and copied straight from billing when "Same as Billing Address" is checked.
    const billingAddress = [
      customerForm.addressLine1, customerForm.addressLine2, customerForm.addressLine3,
      customerForm.state ? toTitleCase(customerForm.state) : '', customerForm.pincode,
    ].filter(Boolean).join(', ');
    const shippingAddress = customerForm.shippingSameAsBilling
      ? billingAddress
      : [
          customerForm.shippingAddressLine1, customerForm.shippingAddressLine2, customerForm.shippingCity,
          customerForm.shippingState ? toTitleCase(customerForm.shippingState) : '', customerForm.shippingPincode,
        ].filter(Boolean).join(', ');
    const finalCustomerForm = { ...customerForm, billingAddress, shippingAddress };

    if (!loggedInUser?.userId) {
      showAlert('You need to be signed in to save a customer.');
      return;
    }

    setIsSavingCustomer(true);
    try {
      if (editingCustomerId) {
        const saved = await customerService.updateCustomer(editingCustomerId, finalCustomerForm);
        persistCustomers(customers.map((c) => (c.id === editingCustomerId ? saved : c)));
        showSuccess('Customer updated successfully.');
      } else {
        const saved = await customerService.createCustomer(loggedInUser.userId, finalCustomerForm);
        persistCustomers([...customers, saved]);
        showSuccess('Customer added successfully.');
      }
      setQuotationSubView(customerFormReturnView);
    } catch (error) {
      console.error('Error saving customer:', error);
      showAlert('Could not save the customer to the server. Please try again.');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = (customer) => {
    showConfirm(`Delete customer "${customer.name}"?`, async () => {
      try {
        await customerService.deleteCustomer(customer.id);
        persistCustomers(customers.filter((c) => c.id !== customer.id));
        if (quotationForm.customerId === customer.id) {
          setQuotationForm((prev) => ({ ...prev, customerId: null }));
        }
        if (invoiceForm.customerId === customer.id) {
          setInvoiceForm((prev) => ({ ...prev, customerId: null }));
        }
        showSuccess('Customer deleted.');
      } catch (error) {
        console.error('Error deleting customer:', error);
        showAlert('Could not delete the customer on the server. Please try again.');
      }
    });
  };

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (c.name || '').toLowerCase().includes(q) || (c.companyName || '').toLowerCase().includes(q);
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Corrupted/unreadable localStorage entry - fall back to defaults below.
    }
    return [];
  });

  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [productForm, setProductForm] = useState(emptyProductForm);

  const [editingProductId, setEditingProductId] = useState(null);

  const [productHsnError, setProductHsnError] = useState(false);

  const [productGstError, setProductGstError] = useState(false);

  const updateProductField = (key, value) => setProductForm(prev => ({ ...prev, [key]: value }));

  const persistProducts = (next) => {
    setProducts(next);
    try { localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const openAddProduct = (returnView = 'productList') => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setProductFormReturnView(returnView);
    setProductHsnError(false);
    setProductGstError(false);
    setQuotationSubView('addProduct');
  };

  const openEditProduct = (product, returnView = 'productList') => {
    setProductForm({ ...emptyProductForm, ...product });
    setEditingProductId(product.id);
    setProductFormReturnView(returnView);
    setProductHsnError(false);
    setProductGstError(false);
    setQuotationSubView('addProduct');
  };

  const handleSaveProduct = async () => {
  if (!productForm.name.trim()) {
    showAlert('Please enter the product name.');
    return;
  }
  if (String(productForm.gst).trim() !== '' && (isNaN(Number(productForm.gst)) || Number(productForm.gst) < 0 || Number(productForm.gst) > 100)) {
    setProductGstError(true);
    showAlert('Please enter a valid GST percentage (0-100).', 'error');
    return;
  }
  setProductGstError(false);
  if (productForm.hsn.trim() && !isValidHSN(productForm.hsn)) {
    setProductHsnError(true);
    showAlert('Please enter a valid HSN code (4, 6, or 8 digits).', 'error');
    return;
  }
  setProductHsnError(false);

  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a product.');
    return;
  }

  try {
    if (editingProductId) {
      const saved = await productsService.updateProduct(editingProductId, {
        name: productForm.name,
        price: Number(productForm.price) || 0,
        gst: Number(productForm.gst) || 0,
        description: productForm.description || '',
        unit: productForm.unit || '',
        hsn: productForm.hsn || '',
      });
      persistProducts(products.map((p) => (p.id === editingProductId ? saved : p)));
      showSuccess('Product updated successfully.');
    } else {
      const saved = await productsService.createProduct(loggedInUser.userId, {
        name: productForm.name,
        price: Number(productForm.price) || 0,
        gst: Number(productForm.gst) || 0,
        description: productForm.description || '',
        unit: productForm.unit || '',
        hsn: productForm.hsn || '',
      });
      persistProducts([...products, saved]);
      showSuccess('Product added successfully.');
    }
    setQuotationSubView(productFormReturnView);
  } catch (error) {
    console.error('Error saving product:', error);
    showAlert('Could not save the product. Please try again.');
  }
};


const handleDeleteProduct = (product) => {
  showConfirm(`Delete product "${product.name}"?`, async () => {
    try {
      await productsService.deleteProduct(product.id);
      persistProducts(products.filter((p) => p.id !== product.id));
      setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== product.id) }));
      setInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== product.id) }));
      showSuccess('Product deleted.');
    } catch (error) {
      console.error('Error deleting product:', error);
      showAlert('Could not delete the product. Please try again.');
    }
  });
};

  const filteredProducts = products.filter((p) => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q);
  });

  const [quotationForm, setQuotationForm] = useState(emptyQuotationForm);


  // ===== Quotations module: List & Detail Views =====
  const [quotations, setQuotations] = useState(() => {
    try {
      const saved = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const [showConvertSheet, setShowConvertSheet] = useState(false);

  const [showQuotationMoreSheet, setShowQuotationMoreSheet] = useState(false);

  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');


  // ===== Quotations module: shared list sorting (Quotation, Invoice, Purchase Order, =====
  // ===== Proforma Invoice, Delivery Note, Receipt) — sorts by actual createdAt time =====
  const [documentSortOrder, setDocumentSortOrder] = useState('newest');
 // 'newest' | 'oldest'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);


  const sortDocumentsByCreated = (list) => {
    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || a.date || 0).getTime();
      const tb = new Date(b.createdAt || b.date || 0).getTime();
      return documentSortOrder === 'newest' ? tb - ta : ta - tb;
    });
  };


  // Reusable Filter/Sort icon + dropdown menu, used in the header of every
  // document list screen (Quotation, Invoice, Purchase Order, Proforma Invoice,
  // Delivery Note, Receipt) so behaviour and appearance stay consistent.
  const renderSortMenu = () => (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setSortMenuOpen((prev) => !prev)}
        aria-label="Filter"
        style={{ ...customerModuleStyles.headerIconBtn, background: 'transparent' }}
      >
        <FiFilter size={19} color="#ffffff" />
      </button>
      {sortMenuOpen && (
        <>
          <div
            onClick={() => setSortMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={customerModuleStyles.sortMenu}>
            <button
              type="button"
              onClick={() => { setDocumentSortOrder('newest'); setSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={documentSortOrder === 'newest' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Newest to Oldest
              </span>
              {documentSortOrder === 'newest' && <FiCheck size={16} color="#0F766E" />}
            </button>
            <button
              type="button"
              onClick={() => { setDocumentSortOrder('oldest'); setSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={documentSortOrder === 'oldest' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Oldest to Newest
              </span>
              {documentSortOrder === 'oldest' && <FiCheck size={16} color="#0F766E" />}
            </button>
          </div>
        </>
      )}
    </div>
  );


  // ===== Quotations module: shared name sorting (Customer List, Product List) =====
  const [nameSortOrder, setNameSortOrder] = useState('az');
 // 'az' | 'za'
  const [nameSortMenuOpen, setNameSortMenuOpen] = useState(false);


  const sortByName = (list, getName) => {
    return [...list].sort((a, b) => {
      const na = (getName(a) || '').toLowerCase();
      const nb = (getName(b) || '').toLowerCase();
      if (na < nb) return nameSortOrder === 'az' ? -1 : 1;
      if (na > nb) return nameSortOrder === 'az' ? 1 : -1;
      return 0;
    });
  };


  // Reusable Filter/Sort icon + dropdown menu (A to Z / Z to A), used in the
  // header of Customer List and Product List so behaviour and appearance
  // stay consistent with the document list screens' filter menu.
  const renderNameSortMenu = () => (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setNameSortMenuOpen((prev) => !prev)}
        aria-label="Filter"
        style={{ ...customerModuleStyles.headerIconBtn, background: 'transparent' }}
      >
        <FiFilter size={19} color="#ffffff" />
      </button>
      {nameSortMenuOpen && (
        <>
          <div
            onClick={() => setNameSortMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={customerModuleStyles.sortMenu}>
            <button
              type="button"
              onClick={() => { setNameSortOrder('az'); setNameSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={nameSortOrder === 'az' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                A to Z
              </span>
              {nameSortOrder === 'az' && <FiCheck size={16} color="#0F766E" />}
            </button>
            <button
              type="button"
              onClick={() => { setNameSortOrder('za'); setNameSortMenuOpen(false); }}
              style={customerModuleStyles.sortMenuItem}
            >
              <span style={nameSortOrder === 'za' ? customerModuleStyles.sortMenuItemLabelActive : customerModuleStyles.sortMenuItemLabel}>
                Z to A
              </span>
              {nameSortOrder === 'za' && <FiCheck size={16} color="#0F766E" />}
            </button>
          </div>
        </>
      )}
    </div>
  );


  // Helper to persist quotations to LocalStorage
  const persistQuotations = (next) => {
    setQuotations(next);
    try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  // Which screen "Add/Edit Customer" and "Add/Edit Product" should return to once saved.
  const [customerFormReturnView, setCustomerFormReturnView] = useState('customerList');

  const [productFormReturnView, setProductFormReturnView] = useState('productList');


  // Next quotation number = 1 higher than the highest number already used,
  // so numbering stays sequential (1, 2, 3, ...) even if quotations are deleted.
  const getNextQuotationNumber = () => {
    const prefix = quotationSettings.numberPrefix || 'Quote-';
    const maxNum = quotations.reduce((max, q) => {
      const match = String(q.quotationNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakeQuotation = () => {
    setEditingQuotationId(null);
    setQuotationForm({ ...emptyQuotationForm(), quotationNo: getNextQuotationNumber() });
    setQuotationSubView('makeQuotation');
  };


  const openSelectCustomerForQuotation = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForQuotation');
    setQuotationSubView('selectCustomerForQuotation');
  };

  const handleSelectCustomerForQuotation = (customer) => {
    setQuotationForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeQuotation');
  };

  const selectedQuotationCustomer = customers.find((c) => c.id === quotationForm.customerId) || null;

  // Adds `qty` of `product` to the quotation in one go (instead of requiring one tap per unit).
  const handleSelectProductForQuotation = (product, qty = 1) => {
    const addQty = Number(qty) > 0 ? Number(qty) : 1;
    setQuotationForm((prev) => {
      const existing = prev.products.find((p) => p.productId === product.id);
      const products = existing
        ? prev.products.map((p) => (p.productId === product.id ? { ...p, qty: p.qty + addQty } : p))
        : [...prev.products, { productId: product.id, name: product.name, price: Number(product.price) || 0, gst: Number(product.gst) || 0, qty: addQty, unit: product.unit || '', hsn: product.hsn || '' }];
      return { ...prev, products };
    });
  };

  const removeQuotationProductLine = (productId) => {
    setQuotationForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [quotationProductLineForm, setQuotationProductLineForm] = useState(emptyQuotationProductLineForm);

  const [editingQuotationProductLineId, setEditingQuotationProductLineId] = useState(null);

  const openAddQuotationProductLine = () => {
    setQuotationProductLineForm(emptyQuotationProductLineForm);
    setEditingQuotationProductLineId(null);
    setQuotationSubView('addQuotationProductLine');
  };

  // Opens the same Add/Edit form pre-filled with an existing quotation line's data, so the
  // user can revise its quantity, price, or description and re-save it via "Add To Quotation".
  const openEditQuotationProductLine = (p) => {
    setQuotationProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingQuotationProductLineId(p.productId);
    setQuotationSubView('addQuotationProductLine');
  };

  const openPickProductForQuotationLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForQuotationLine');
  };

  const handlePickProductForQuotationLine = (product) => {
    setQuotationProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || '',
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked,
                // instead of carrying over whatever quantity was typed for the previous pick.
    }));
    setQuotationSubView('addQuotationProductLine');
  };

  const handleAddQuotationProductLine = () => {
    if (!quotationProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(quotationProductLineForm.qty) > 0 ? Number(quotationProductLineForm.qty) : 1;
    const price = Number(quotationProductLineForm.price) || 0;
    setQuotationForm((prev) => {
      // If we're editing an existing line, drop it first so the save below fully replaces
      // its quantity/price/description instead of adding on top of the old quantity.
      const baseProducts = editingQuotationProductLineId
        ? prev.products.filter((p) => p.productId !== editingQuotationProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === quotationProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === quotationProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(quotationProductLineForm.gst) || 0, description: quotationProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: quotationProductLineForm.productId,
            name: quotationProductLineForm.name,
            price,
            gst: Number(quotationProductLineForm.gst) || 0,
            qty,
            unit: quotationProductLineForm.unit || '',
            hsn: quotationProductLineForm.hsn || '',
            description: quotationProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingQuotationProductLineId(null);
    setQuotationSubView('makeQuotation');
  };


  const [isOtherChargeModalOpen, setIsOtherChargeModalOpen] = useState(false);

  const [otherChargeForm, setOtherChargeForm] = useState({ label: '', amount: '', taxable: false, gstPercent: '' });

  const [editingOtherChargeId, setEditingOtherChargeId] = useState(null);

  const openOtherChargeModal = () => {
    setOtherChargeForm({ label: '', amount: '', taxable: false, gstPercent: '' });
    setEditingOtherChargeId(null);
    setIsOtherChargeModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing other charge's data, so the user can
  // correct its amount/label/tax without deleting and re-adding it.
  const openEditOtherChargeModal = (charge) => {
    setOtherChargeForm({
      label: charge.label || 'Other Charges',
      amount: charge.amount !== undefined && charge.amount !== null ? String(charge.amount) : '',
      taxable: !!charge.taxable,
      gstPercent: charge.taxable && charge.gstPercent !== undefined && charge.gstPercent !== null ? String(charge.gstPercent) : '',
    });
    setEditingOtherChargeId(charge.id);
    setIsOtherChargeModalOpen(true);
  };

  const handleSaveOtherCharge = () => {
    if (!otherChargeForm.amount || Number(otherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    if (otherChargeForm.taxable && (( otherChargeForm.gstPercent === '' || otherChargeForm.gstPercent === null || otherChargeForm.gstPercent === undefined) || Number(otherChargeForm.gstPercent) < 0)) {
      showAlert('Please enter a valid tax percentage.');
      return;
    }
    const savedCharge = { ...otherChargeForm, label: otherChargeForm.label.trim() || 'Other Charges', gstPercent: otherChargeForm.taxable ? (Number(otherChargeForm.gstPercent) || 0) : 0 };
    setQuotationForm((prev) => ({
      ...prev,
      otherCharges: editingOtherChargeId
        ? prev.otherCharges.map((c) => (c.id === editingOtherChargeId ? { ...savedCharge, id: editingOtherChargeId } : c))
        : [...prev.otherCharges, { ...savedCharge, id: genId() }],
    }));
    setEditingOtherChargeId(null);
    setIsOtherChargeModalOpen(false);
  };

  const removeQuotationOtherCharge = (id) => {
    setQuotationForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };

  // Removes a term from THIS quotation's selection only (does not delete the term
  // from the quotation terms catalog - that is handled separately by handleDeleteTerm).
  const removeQuotationSelectedTerm = (termId) => {
    setQuotationForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };

  const [quotationTerms, setQuotationTerms] = useState(() => loadTermsCatalog(QUOTATION_TERMS_STORAGE_KEY));

  const persistQuotationTerms = (next) => {
    setQuotationTerms(next);
    try { localStorage.setItem(QUOTATION_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const [purchaseOrderTerms, setPurchaseOrderTerms] = useState(() => loadTermsCatalog(PURCHASE_ORDER_TERMS_STORAGE_KEY));

  const persistPurchaseOrderTerms = (next) => {
    setPurchaseOrderTerms(next);
    try { localStorage.setItem(PURCHASE_ORDER_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const [proformaInvoiceTerms, setProformaInvoiceTerms] = useState(() => loadTermsCatalog(PROFORMA_INVOICE_TERMS_STORAGE_KEY));

  const persistProformaInvoiceTerms = (next) => {
    setProformaInvoiceTerms(next);
    try { localStorage.setItem(PROFORMA_INVOICE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const [deliveryNoteTerms, setDeliveryNoteTerms] = useState(() => loadTermsCatalog(DELIVERY_NOTE_TERMS_STORAGE_KEY));

  const persistDeliveryNoteTerms = (next) => {
    setDeliveryNoteTerms(next);
    try { localStorage.setItem(DELIVERY_NOTE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  const [invoiceTerms, setInvoiceTerms] = useState(() => loadTermsCatalog(INVOICE_TERMS_STORAGE_KEY));

  const persistInvoiceTerms = (next) => {
    setInvoiceTerms(next);
    try { localStorage.setItem(INVOICE_TERMS_STORAGE_KEY, JSON.stringify(next)); } catch {
      // Ignore write failures (e.g. storage full/unavailable) - state still updates in memory.
    }
  };

  // Looks up the right catalog/persist-function for a given "termsModalContext" value
  // ('quotation' | 'invoice' | 'purchaseOrder' | 'proformaInvoice' | 'deliveryNote').
  const getTermsCatalogByContext = (context) => {
    if (context === 'invoice') return invoiceTerms;
    if (context === 'purchaseOrder') return purchaseOrderTerms;
    if (context === 'proformaInvoice') return proformaInvoiceTerms;
    if (context === 'deliveryNote') return deliveryNoteTerms;
    return quotationTerms;
  };

  const persistTermsByContext = (context, next) => {
    if (context === 'invoice') { persistInvoiceTerms(next); return; }
    if (context === 'purchaseOrder') { persistPurchaseOrderTerms(next); return; }
    if (context === 'proformaInvoice') { persistProformaInvoiceTerms(next); return; }
    if (context === 'deliveryNote') { persistDeliveryNoteTerms(next); return; }
    persistQuotationTerms(next);
  };

  const [termsDraftSelectedIds, setTermsDraftSelectedIds] = useState([]);

  const openSelectTermsForQuotation = () => {
    setTermsDraftSelectedIds(quotationForm.termsIds);
    setQuotationSubView('selectTermsForQuotation');
  };

  const toggleTermsDraftSelection = (id) => {
    setTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneSelectTerms = () => {
    setQuotationForm((prev) => ({ ...prev, termsIds: termsDraftSelectedIds }));
    setQuotationSubView('makeQuotation');
  };

  const [isAddTermsModalOpen, setIsAddTermsModalOpen] = useState(false);

  const [newTermText, setNewTermText] = useState('');

  const [termsModalContext, setTermsModalContext] = useState('quotation');
 // 'quotation' | 'invoice' | 'purchaseOrder' | 'proformaInvoice' | 'deliveryNote'
  // The id of the term currently being edited, or null when the modal is being used to add
  // a brand new term. Kept alongside termsModalContext (not per-document-type) since only
  // one Select Terms screen - and therefore only one instance of this modal - can be open
  // at a time.
  const [editingTermId, setEditingTermId] = useState(null);

  const openAddTermsModal = (context = 'quotation') => {
    setNewTermText('');
    setTermsModalContext(context);
    setEditingTermId(null);
    setIsAddTermsModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing term's text, so the user can correct
  // it in place instead of deleting it and adding a new one.
  const openEditTermsModal = (term, context = 'quotation') => {
    setNewTermText(term.text || '');
    setTermsModalContext(context);
    setEditingTermId(term.id);
    setIsAddTermsModalOpen(true);
  };

  // Find the openAddTermsModal function and update handleAddTerm:

const handleAddTerm = async () => {
  if (!newTermText.trim()) {
    showAlert('Please enter the terms and condition text.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save terms.');
    return;
  }

  try {
    if (editingTermId) {
      const updatedTerm = await termsService.updateTerm(editingTermId, { text: newTermText.trim() });
      const catalog = getTermsCatalogByContext(termsModalContext);
      persistTermsByContext(
        termsModalContext,
        catalog.map((t) => (t.id === editingTermId ? { ...t, ...updatedTerm, text: newTermText.trim() } : t))
      );
      setEditingTermId(null);
      setIsAddTermsModalOpen(false);
      return;
    }

    const newTerm = await termsService.createTerm(
      loggedInUser.userId, 
      termsModalContext, 
      { text: newTermText.trim() }
    );
    const catalog = getTermsCatalogByContext(termsModalContext);
    persistTermsByContext(termsModalContext, [...catalog, newTerm]);
    
    if (termsModalContext === 'invoice') {
      setInvoiceTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'purchaseOrder') {
      setPurchaseOrderTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'proformaInvoice') {
      setProformaInvoiceTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else if (termsModalContext === 'deliveryNote') {
      setDeliveryNoteTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    } else {
      setTermsDraftSelectedIds((prev) => [...prev, newTerm.id]);
    }
    setIsAddTermsModalOpen(false);
  } catch (error) {
    console.error(editingTermId ? 'Error updating term:' : 'Error adding term:', error);
    showAlert(editingTermId ? 'Could not update the term. Please try again.' : 'Could not save the term. Please try again.');
  }
};

  const selectedQuotationTerms = quotationTerms.filter((term) => quotationForm.termsIds.includes(term.id));

  // Deletes a term from exactly one document type's own catalog/selection - the other
  // 4 document types' catalogs and selected terms are left completely untouched.
  const handleDeleteTerm = async (term, context = 'quotation') => {
  showConfirm('Delete this term and condition?', async () => {
    try {
      await termsService.deleteTerm(term.id);
      const catalog = getTermsCatalogByContext(context);
      persistTermsByContext(context, catalog.filter((t) => t.id !== term.id));
      if (context === 'invoice') {
        setInvoiceTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'purchaseOrder') {
        setPurchaseOrderTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setPurchaseOrderForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'proformaInvoice') {
        setProformaInvoiceTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setProformaInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else if (context === 'deliveryNote') {
        setDeliveryNoteTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setDeliveryNoteForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      } else {
        setTermsDraftSelectedIds((prev) => prev.filter((id) => id !== term.id));
        setQuotationForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== term.id) }));
      }
      showSuccess('Term deleted.');
    } catch (error) {
      console.error('Error deleting term:', error);
      showAlert('Could not delete the term. Please try again.');
    }
  });
};



  const quotationProductsTotal = quotationForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);

  const quotationOtherChargesTotal = quotationForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0) * (1 + (c.taxable ? (Number(c.gstPercent) || 0) / 100 : 0)), 0);

  const quotationAmountDue = Math.round(quotationProductsTotal + quotationOtherChargesTotal);


  const handleGenerateQuotation = async () => {
  if (isSavingQuotation) return;
  if (!quotationForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (quotationForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a quotation.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedQuotationCustomer?.name || 'Unknown',
    customerCompany: selectedQuotationCustomer?.companyName || '',
    customerMobile: selectedQuotationCustomer?.mobile || '',
    customerEmail: selectedQuotationCustomer?.email || '',
    customerAddressLine1: selectedQuotationCustomer?.addressLine1 || '',
    customerAddressLine2: selectedQuotationCustomer?.addressLine2 || '',
    customerAddressLine3: selectedQuotationCustomer?.addressLine3 || '',
    customerBillingAddress: selectedQuotationCustomer?.billingAddress || '',
    customerShippingAddress: selectedQuotationCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(quotationSettings);

  const payload = { 
    ...quotationForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot)
  };

  setIsSavingQuotation(true);
  try {
    if (editingQuotationId) {
      const saved = await documentService.updateQuotation(editingQuotationId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistQuotations(quotations.map((q) => (q.id === editingQuotationId ? parsedSaved : q)));
      showSuccess('Quotation updated successfully.');
      setEditingQuotationId(null);
      setQuotationSubView('quotationDetail');
    } else {
      const created = await documentService.createQuotation(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistQuotations([...quotations, parsedCreated]);
      showSuccess('Quotation generated successfully.');
      setQuotationSubView('quotationList');
    }
  } catch (error) {
    console.error('Error saving quotation:', error);
    showAlert('Could not save the quotation. Please try again.');
  } finally {
    setIsSavingQuotation(false);
  }
};

  const [purchaseOrderForm, setPurchaseOrderForm] = useState(emptyPurchaseOrderForm);


  // ===== Purchase Order module: List & Detail Views =====
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(PURCHASE_ORDERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);

  const [purchaseOrderSearchQuery, setPurchaseOrderSearchQuery] = useState('');


  const persistPurchaseOrders = (next) => {
    setPurchaseOrders(next);
    try { localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  const getNextPurchaseOrderNumber = () => {
    const prefix = purchaseOrderSettings.numberPrefix || 'PO-';
    const maxNum = purchaseOrders.reduce((max, q) => {
      const match = String(q.purchaseOrderNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakePurchaseOrder = () => {
    setEditingPurchaseOrderId(null);
    setPurchaseOrderForm({ ...emptyPurchaseOrderForm(), purchaseOrderNo: getNextPurchaseOrderNumber() });
    setQuotationSubView('makePurchaseOrder');
  };


  const openSelectCustomerForPurchaseOrder = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForPurchaseOrder');
    setQuotationSubView('selectCustomerForPurchaseOrder');
  };

  const handleSelectCustomerForPurchaseOrder = (customer) => {
    setPurchaseOrderForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makePurchaseOrder');
  };

  const selectedPurchaseOrderCustomer = customers.find((c) => c.id === purchaseOrderForm.customerId) || null;


  const removePurchaseOrderProductLine = (productId) => {
    setPurchaseOrderForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [purchaseOrderProductLineForm, setPurchaseOrderProductLineForm] = useState(emptyPurchaseOrderProductLineForm);

  const [editingPurchaseOrderProductLineId, setEditingPurchaseOrderProductLineId] = useState(null);

  const openAddPurchaseOrderProductLine = () => {
    setPurchaseOrderProductLineForm(emptyPurchaseOrderProductLineForm);
    setEditingPurchaseOrderProductLineId(null);
    setQuotationSubView('addPurchaseOrderProductLine');
  };

  const openEditPurchaseOrderProductLine = (p) => {
    setPurchaseOrderProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingPurchaseOrderProductLineId(p.productId);
    setQuotationSubView('addPurchaseOrderProductLine');
  };

  const openPickProductForPurchaseOrderLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForPurchaseOrderLine');
  };

  const handlePickProductForPurchaseOrderLine = (product) => {
    setPurchaseOrderProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || '',
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addPurchaseOrderProductLine');
  };

  const handleAddPurchaseOrderProductLine = () => {
    if (!purchaseOrderProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(purchaseOrderProductLineForm.qty) > 0 ? Number(purchaseOrderProductLineForm.qty) : 1;
    const price = Number(purchaseOrderProductLineForm.price) || 0;
    setPurchaseOrderForm((prev) => {
      const baseProducts = editingPurchaseOrderProductLineId
        ? prev.products.filter((p) => p.productId !== editingPurchaseOrderProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === purchaseOrderProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === purchaseOrderProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(purchaseOrderProductLineForm.gst) || 0, description: purchaseOrderProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: purchaseOrderProductLineForm.productId,
            name: purchaseOrderProductLineForm.name,
            price,
            gst: Number(purchaseOrderProductLineForm.gst) || 0,
            qty,
            unit: purchaseOrderProductLineForm.unit || '',
            hsn: purchaseOrderProductLineForm.hsn || '',
            description: purchaseOrderProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingPurchaseOrderProductLineId(null);
    setQuotationSubView('makePurchaseOrder');
  };



  const [isPurchaseOrderOtherChargeModalOpen, setIsPurchaseOrderOtherChargeModalOpen] = useState(false);

  const [purchaseOrderOtherChargeForm, setPurchaseOrderOtherChargeForm] = useState({ label: '', amount: '', taxable: false, gstPercent: '' });

  const [editingPurchaseOrderOtherChargeId, setEditingPurchaseOrderOtherChargeId] = useState(null);

  const openPurchaseOrderOtherChargeModal = () => {
    setPurchaseOrderOtherChargeForm({ label: '', amount: '', taxable: false, gstPercent: '' });
    setEditingPurchaseOrderOtherChargeId(null);
    setIsPurchaseOrderOtherChargeModalOpen(true);
  };

  const openEditPurchaseOrderOtherChargeModal = (charge) => {
    setPurchaseOrderOtherChargeForm({
      label: charge.label || 'Other Charges',
      amount: charge.amount !== undefined && charge.amount !== null ? String(charge.amount) : '',
      taxable: !!charge.taxable,
      gstPercent: charge.taxable && charge.gstPercent !== undefined && charge.gstPercent !== null ? String(charge.gstPercent) : '',
    });
    setEditingPurchaseOrderOtherChargeId(charge.id);
    setIsPurchaseOrderOtherChargeModalOpen(true);
  };

  const handleSavePurchaseOrderOtherCharge = () => {
    if (!purchaseOrderOtherChargeForm.amount || Number(purchaseOrderOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    if (purchaseOrderOtherChargeForm.taxable && (( purchaseOrderOtherChargeForm.gstPercent === '' || purchaseOrderOtherChargeForm.gstPercent === null || purchaseOrderOtherChargeForm.gstPercent === undefined) || Number(purchaseOrderOtherChargeForm.gstPercent) < 0)) {
      showAlert('Please enter a valid tax percentage.');
      return;
    }
    const savedCharge = { ...purchaseOrderOtherChargeForm, label: purchaseOrderOtherChargeForm.label.trim() || 'Other Charges', gstPercent: purchaseOrderOtherChargeForm.taxable ? (Number(purchaseOrderOtherChargeForm.gstPercent) || 0) : 0 };
    setPurchaseOrderForm((prev) => ({
      ...prev,
      otherCharges: editingPurchaseOrderOtherChargeId
        ? prev.otherCharges.map((c) => (c.id === editingPurchaseOrderOtherChargeId ? { ...savedCharge, id: editingPurchaseOrderOtherChargeId } : c))
        : [...prev.otherCharges, { ...savedCharge, id: genId() }],
    }));
    setEditingPurchaseOrderOtherChargeId(null);
    setIsPurchaseOrderOtherChargeModalOpen(false);
  };

  const removePurchaseOrderOtherCharge = (id) => {
    setPurchaseOrderForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };

  // Removes a term from THIS purchase order's selection only (does not delete the term
  // from the purchase order terms catalog - that is handled separately by handleDeleteTerm).
  const removePurchaseOrderSelectedTerm = (termId) => {
    setPurchaseOrderForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };


  const [purchaseOrderTermsDraftSelectedIds, setPurchaseOrderTermsDraftSelectedIds] = useState([]);

  const openSelectTermsForPurchaseOrder = () => {
    setPurchaseOrderTermsDraftSelectedIds(purchaseOrderForm.termsIds);
    setQuotationSubView('selectTermsForPurchaseOrder');
  };

  const togglePurchaseOrderTermsDraftSelection = (id) => {
    setPurchaseOrderTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneSelectPurchaseOrderTerms = () => {
    setPurchaseOrderForm((prev) => ({ ...prev, termsIds: purchaseOrderTermsDraftSelectedIds }));
    setQuotationSubView('makePurchaseOrder');
  };

  const selectedPurchaseOrderTerms = purchaseOrderTerms.filter((term) => purchaseOrderForm.termsIds.includes(term.id));


  const purchaseOrderProductsTotal = purchaseOrderForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);

  const purchaseOrderOtherChargesTotal = purchaseOrderForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0) * (1 + (c.taxable ? (Number(c.gstPercent) || 0) / 100 : 0)), 0);

  const purchaseOrderAmountDue = Math.round(purchaseOrderProductsTotal + purchaseOrderOtherChargesTotal);


  const handleGeneratePurchaseOrder = async () => {
  if (isSavingPurchaseOrder) return;
  if (!purchaseOrderForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (purchaseOrderForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a purchase order.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedPurchaseOrderCustomer?.name || 'Unknown',
    customerCompany: selectedPurchaseOrderCustomer?.companyName || '',
    customerMobile: selectedPurchaseOrderCustomer?.mobile || '',
    customerEmail: selectedPurchaseOrderCustomer?.email || '',
    customerAddressLine1: selectedPurchaseOrderCustomer?.addressLine1 || '',
    customerAddressLine2: selectedPurchaseOrderCustomer?.addressLine2 || '',
    customerAddressLine3: selectedPurchaseOrderCustomer?.addressLine3 || '',
    customerBillingAddress: selectedPurchaseOrderCustomer?.billingAddress || '',
    customerShippingAddress: selectedPurchaseOrderCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(purchaseOrderSettings);
  const payload = { 
    ...purchaseOrderForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot)
  };

  setIsSavingPurchaseOrder(true);
  try {
    if (editingPurchaseOrderId) {
      const saved = await purchaseOrdersService.updatePurchaseOrder(editingPurchaseOrderId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistPurchaseOrders(purchaseOrders.map((o) => (o.id === editingPurchaseOrderId ? parsedSaved : o)));
      showSuccess('Purchase Order updated successfully.');
      setEditingPurchaseOrderId(null);
      setQuotationSubView('purchaseOrderDetail');
    } else {
      const created = await purchaseOrdersService.createPurchaseOrder(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistPurchaseOrders([...purchaseOrders, parsedCreated]);
      showSuccess('Purchase Order generated successfully.');
      setQuotationSubView('purchaseOrderList');
    }
  } catch (error) {
    console.error('Error saving purchase order:', error);
    showAlert('Could not save the purchase order. Please try again.');
  } finally {
    setIsSavingPurchaseOrder(false);
  }
};

  const [proformaInvoiceForm, setProformaInvoiceForm] = useState(emptyProformaInvoiceForm);


  // ===== Proforma Invoice module: List & Detail Views =====
  const [proformaInvoices, setProformaInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFORMA_INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedProformaInvoiceId, setSelectedProformaInvoiceId] = useState(null);

  const [proformaInvoiceSearchQuery, setProformaInvoiceSearchQuery] = useState('');


  const persistProformaInvoices = (next) => {
    setProformaInvoices(next);
    try { localStorage.setItem(PROFORMA_INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  const getNextProformaInvoiceNumber = () => {
    const prefix = proformaInvoiceSettings.numberPrefix || 'PI-';
    const maxNum = proformaInvoices.reduce((max, q) => {
      const match = String(q.proformaInvoiceNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakeProformaInvoice = () => {
    setEditingProformaInvoiceId(null);
    setProformaInvoiceForm({ ...emptyProformaInvoiceForm(), proformaInvoiceNo: getNextProformaInvoiceNumber() });
    setQuotationSubView('makeProformaInvoice');
  };


  const openSelectCustomerForProformaInvoice = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForProformaInvoice');
    setQuotationSubView('selectCustomerForProformaInvoice');
  };

  const handleSelectCustomerForProformaInvoice = (customer) => {
    setProformaInvoiceForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeProformaInvoice');
  };

  const selectedProformaInvoiceCustomer = customers.find((c) => c.id === proformaInvoiceForm.customerId) || null;


  const removeProformaInvoiceProductLine = (productId) => {
    setProformaInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [proformaInvoiceProductLineForm, setProformaInvoiceProductLineForm] = useState(emptyProformaInvoiceProductLineForm);

  const [editingProformaInvoiceProductLineId, setEditingProformaInvoiceProductLineId] = useState(null);

  const openAddProformaInvoiceProductLine = () => {
    setProformaInvoiceProductLineForm(emptyProformaInvoiceProductLineForm);
    setEditingProformaInvoiceProductLineId(null);
    setQuotationSubView('addProformaInvoiceProductLine');
  };

  const openEditProformaInvoiceProductLine = (p) => {
    setProformaInvoiceProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingProformaInvoiceProductLineId(p.productId);
    setQuotationSubView('addProformaInvoiceProductLine');
  };

  const openPickProductForProformaInvoiceLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForProformaInvoiceLine');
  };

  const handlePickProductForProformaInvoiceLine = (product) => {
    setProformaInvoiceProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || '',
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addProformaInvoiceProductLine');
  };

  const handleAddProformaInvoiceProductLine = () => {
    if (!proformaInvoiceProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(proformaInvoiceProductLineForm.qty) > 0 ? Number(proformaInvoiceProductLineForm.qty) : 1;
    const price = Number(proformaInvoiceProductLineForm.price) || 0;
    setProformaInvoiceForm((prev) => {
      const baseProducts = editingProformaInvoiceProductLineId
        ? prev.products.filter((p) => p.productId !== editingProformaInvoiceProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === proformaInvoiceProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === proformaInvoiceProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(proformaInvoiceProductLineForm.gst) || 0, description: proformaInvoiceProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: proformaInvoiceProductLineForm.productId,
            name: proformaInvoiceProductLineForm.name,
            price,
            gst: Number(proformaInvoiceProductLineForm.gst) || 0,
            qty,
            unit: proformaInvoiceProductLineForm.unit || '',
            hsn: proformaInvoiceProductLineForm.hsn || '',
            description: proformaInvoiceProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingProformaInvoiceProductLineId(null);
    setQuotationSubView('makeProformaInvoice');
  };


  const [isProformaInvoiceOtherChargeModalOpen, setIsProformaInvoiceOtherChargeModalOpen] = useState(false);

  const [proformaInvoiceOtherChargeForm, setProformaInvoiceOtherChargeForm] = useState({ label: '', amount: '', taxable: false, gstPercent: '' });

  const [editingProformaInvoiceOtherChargeId, setEditingProformaInvoiceOtherChargeId] = useState(null);

  const openProformaInvoiceOtherChargeModal = () => {
    setProformaInvoiceOtherChargeForm({ label: '', amount: '', taxable: false, gstPercent: '' });
    setEditingProformaInvoiceOtherChargeId(null);
    setIsProformaInvoiceOtherChargeModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing other charge's data, so the user can
  // correct its amount/label/tax without deleting and re-adding it.
  const openEditProformaInvoiceOtherChargeModal = (charge) => {
    setProformaInvoiceOtherChargeForm({
      label: charge.label || 'Other Charges',
      amount: charge.amount !== undefined && charge.amount !== null ? String(charge.amount) : '',
      taxable: !!charge.taxable,
      gstPercent: charge.taxable && charge.gstPercent !== undefined && charge.gstPercent !== null ? String(charge.gstPercent) : '',
    });
    setEditingProformaInvoiceOtherChargeId(charge.id);
    setIsProformaInvoiceOtherChargeModalOpen(true);
  };

  const handleSaveProformaInvoiceOtherCharge = () => {
    if (!proformaInvoiceOtherChargeForm.amount || Number(proformaInvoiceOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    if (proformaInvoiceOtherChargeForm.taxable && (( proformaInvoiceOtherChargeForm.gstPercent === '' || proformaInvoiceOtherChargeForm.gstPercent === null || proformaInvoiceOtherChargeForm.gstPercent === undefined) || Number(proformaInvoiceOtherChargeForm.gstPercent) < 0)) {
      showAlert('Please enter a valid tax percentage.');
      return;
    }
    const savedCharge = { ...proformaInvoiceOtherChargeForm, label: proformaInvoiceOtherChargeForm.label.trim() || 'Other Charges', gstPercent: proformaInvoiceOtherChargeForm.taxable ? (Number(proformaInvoiceOtherChargeForm.gstPercent) || 0) : 0 };
    setProformaInvoiceForm((prev) => ({
      ...prev,
      otherCharges: editingProformaInvoiceOtherChargeId
        ? prev.otherCharges.map((c) => (c.id === editingProformaInvoiceOtherChargeId ? { ...savedCharge, id: editingProformaInvoiceOtherChargeId } : c))
        : [...prev.otherCharges, { ...savedCharge, id: genId() }],
    }));
    setEditingProformaInvoiceOtherChargeId(null);
    setIsProformaInvoiceOtherChargeModalOpen(false);
  };

  const removeProformaInvoiceOtherCharge = (id) => {
    setProformaInvoiceForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };

  // Removes a term from THIS proforma invoice's selection only (does not delete the term
  // from the proforma invoice terms catalog - that is handled separately by handleDeleteTerm).
  const removeProformaInvoiceSelectedTerm = (termId) => {
    setProformaInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };


  const [proformaInvoiceTermsDraftSelectedIds, setProformaInvoiceTermsDraftSelectedIds] = useState([]);

  const openSelectTermsForProformaInvoice = () => {
    setProformaInvoiceTermsDraftSelectedIds(proformaInvoiceForm.termsIds);
    setQuotationSubView('selectTermsForProformaInvoice');
  };

  const toggleProformaInvoiceTermsDraftSelection = (id) => {
    setProformaInvoiceTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneSelectProformaInvoiceTerms = () => {
    setProformaInvoiceForm((prev) => ({ ...prev, termsIds: proformaInvoiceTermsDraftSelectedIds }));
    setQuotationSubView('makeProformaInvoice');
  };

  const selectedProformaInvoiceTerms = proformaInvoiceTerms.filter((term) => proformaInvoiceForm.termsIds.includes(term.id));

  const [isProformaPaidInfoModalOpen, setIsProformaPaidInfoModalOpen] = useState(false);

  const [proformaPaidInfoForm, setProformaPaidInfoForm] = useState(emptyProformaPaidInfoForm);

  const [editingProformaPaidInfoId, setEditingProformaPaidInfoId] = useState(null);

  const [isProformaPaidInfoDatePickerOpen, setIsProformaPaidInfoDatePickerOpen] = useState(false);

  const [proformaPaidInfoCalendarMonth, setProformaPaidInfoCalendarMonth] = useState(() => new Date());

  const openAddProformaPaidInfoModal = () => {
    setProformaPaidInfoForm(emptyProformaPaidInfoForm());
    setEditingProformaPaidInfoId(null);
    setProformaPaidInfoCalendarMonth(new Date());
    setIsProformaPaidInfoModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing paid info entry's data, so the user
  // can correct its amount/date/note without deleting and re-adding it (mirrors
  // openEditProformaInvoiceOtherChargeModal).
  const openEditProformaPaidInfoModal = (paidInfo) => {
    setProformaPaidInfoForm({
      date: paidInfo.date || '',
      amount: paidInfo.amount !== undefined && paidInfo.amount !== null ? String(paidInfo.amount) : '',
      note: paidInfo.note || '',
    });
    setEditingProformaPaidInfoId(paidInfo.id);
    setProformaPaidInfoCalendarMonth(parseQuotationDate(paidInfo.date) || new Date());
    setIsProformaPaidInfoModalOpen(true);
  };

  const handleSaveProformaPaidInfo = () => {
    if (!proformaPaidInfoForm.amount || Number(proformaPaidInfoForm.amount) <= 0) {
      showAlert('Please enter a valid paid amount.');
      return;
    }
    if (!proformaPaidInfoForm.date) {
      showAlert(t('selectDateForAdvanceError') || 'Please select the paid date.');
      return;
    }
    setProformaInvoiceForm((prev) => ({
      ...prev,
      paidInfo: editingProformaPaidInfoId
        ? prev.paidInfo.map((p) => (p.id === editingProformaPaidInfoId
            ? { ...p, date: proformaPaidInfoForm.date, amount: Number(proformaPaidInfoForm.amount), note: proformaPaidInfoForm.note }
            : p))
        : [...prev.paidInfo, { id: genId(), date: proformaPaidInfoForm.date, amount: Number(proformaPaidInfoForm.amount), note: proformaPaidInfoForm.note }],
    }));
    setEditingProformaPaidInfoId(null);
    setIsProformaPaidInfoModalOpen(false);
  };

  const removeProformaPaidInfoLine = (id) => {
    setProformaInvoiceForm((prev) => ({ ...prev, paidInfo: prev.paidInfo.filter((p) => p.id !== id) }));
  };

  // Tap-to-select on Paid Info List entries - mirrors the Select Terms and Conditions
  // screen's draft-selection pattern (single or multi-select, highlighted card, Done
  // just closes the screen without any further data change).
  const [selectedProformaPaidInfoIds, setSelectedProformaPaidInfoIds] = useState([]);

  const openProformaPaidInfoList = () => {
    setSelectedProformaPaidInfoIds([]);
    setQuotationSubView('proformaPaidInfoList');
  };

  const toggleProformaPaidInfoSelection = (id) => {
    setSelectedProformaPaidInfoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneProformaPaidInfoList = () => {
    setSelectedProformaPaidInfoIds([]);
    setQuotationSubView('makeProformaInvoice');
  };


  const proformaInvoiceProductsTotal = proformaInvoiceForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);

  const proformaInvoiceOtherChargesTotal = proformaInvoiceForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0) * (1 + (c.taxable ? (Number(c.gstPercent) || 0) / 100 : 0)), 0);

  const proformaInvoiceGrandTotal = Math.round(proformaInvoiceProductsTotal + proformaInvoiceOtherChargesTotal);

  const proformaInvoicePaidTotal = proformaInvoiceForm.paidInfo.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const proformaInvoiceAmountDue = Math.max(0, proformaInvoiceGrandTotal - proformaInvoicePaidTotal);


  const handleGenerateProformaInvoice = async () => {
  if (isSavingProformaInvoice) return;
  if (!proformaInvoiceForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (proformaInvoiceForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a proforma invoice.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedProformaInvoiceCustomer?.name || 'Unknown',
    customerCompany: selectedProformaInvoiceCustomer?.companyName || '',
    customerMobile: selectedProformaInvoiceCustomer?.mobile || '',
    customerEmail: selectedProformaInvoiceCustomer?.email || '',
    customerAddressLine1: selectedProformaInvoiceCustomer?.addressLine1 || '',
    customerAddressLine2: selectedProformaInvoiceCustomer?.addressLine2 || '',
    customerAddressLine3: selectedProformaInvoiceCustomer?.addressLine3 || '',
    customerBillingAddress: selectedProformaInvoiceCustomer?.billingAddress || '',
    customerShippingAddress: selectedProformaInvoiceCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(proformaInvoiceSettings);
  const payload = { 
    ...proformaInvoiceForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot)
  };

  setIsSavingProformaInvoice(true);
  try {
    if (editingProformaInvoiceId) {
      const saved = await proformaInvoicesService.updateProformaInvoice(editingProformaInvoiceId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistProformaInvoices(proformaInvoices.map((inv) => (inv.id === editingProformaInvoiceId ? parsedSaved : inv)));
      showSuccess('Proforma Invoice updated successfully.');
      setEditingProformaInvoiceId(null);
      setQuotationSubView('proformaInvoiceDetail');
    } else {
      const created = await proformaInvoicesService.createProformaInvoice(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistProformaInvoices([...proformaInvoices, parsedCreated]);
      showSuccess('Proforma Invoice generated successfully.');
      setQuotationSubView('proformaInvoiceList');
    }
  } catch (error) {
    console.error('Error saving proforma invoice:', error);
    showAlert('Could not save the proforma invoice. Please try again.');
  } finally {
    setIsSavingProformaInvoice(false);
  }
};

  const [deliveryNoteForm, setDeliveryNoteForm] = useState(emptyDeliveryNoteForm);


  // ===== Delivery Note module: List & Detail Views =====
  const [deliveryNotes, setDeliveryNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(DELIVERY_NOTES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedDeliveryNoteId, setSelectedDeliveryNoteId] = useState(null);

  const [deliveryNoteSearchQuery, setDeliveryNoteSearchQuery] = useState('');


  const persistDeliveryNotes = (next) => {
    setDeliveryNotes(next);
    try { localStorage.setItem(DELIVERY_NOTES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  const getNextDeliveryNoteNumber = () => {
    const prefix = deliveryNoteSettings.numberPrefix || 'DN-';
    const maxNum = deliveryNotes.reduce((max, q) => {
      const match = String(q.deliveryNoteNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakeDeliveryNote = () => {
    setEditingDeliveryNoteId(null);
    setDeliveryNoteForm({ ...emptyDeliveryNoteForm(), deliveryNoteNo: getNextDeliveryNoteNumber() });
    setQuotationSubView('makeDeliveryNote');
  };


  const openSelectCustomerForDeliveryNote = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForDeliveryNote');
    setQuotationSubView('selectCustomerForDeliveryNote');
  };

  const handleSelectCustomerForDeliveryNote = (customer) => {
    setDeliveryNoteForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeDeliveryNote');
  };

  const selectedDeliveryNoteCustomer = customers.find((c) => c.id === deliveryNoteForm.customerId) || null;


  const removeDeliveryNoteProductLine = (productId) => {
    setDeliveryNoteForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [deliveryNoteProductLineForm, setDeliveryNoteProductLineForm] = useState(emptyDeliveryNoteProductLineForm);

  const [editingDeliveryNoteProductLineId, setEditingDeliveryNoteProductLineId] = useState(null);

  const openAddDeliveryNoteProductLine = () => {
    setDeliveryNoteProductLineForm(emptyDeliveryNoteProductLineForm);
    setEditingDeliveryNoteProductLineId(null);
    setQuotationSubView('addDeliveryNoteProductLine');
  };

  const openEditDeliveryNoteProductLine = (p) => {
    setDeliveryNoteProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingDeliveryNoteProductLineId(p.productId);
    setQuotationSubView('addDeliveryNoteProductLine');
  };

  const openPickProductForDeliveryNoteLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForDeliveryNoteLine');
  };

  const handlePickProductForDeliveryNoteLine = (product) => {
    setDeliveryNoteProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || '',
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addDeliveryNoteProductLine');
  };

  const handleAddDeliveryNoteProductLine = () => {
    if (!deliveryNoteProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(deliveryNoteProductLineForm.qty) > 0 ? Number(deliveryNoteProductLineForm.qty) : 1;
    const price = Number(deliveryNoteProductLineForm.price) || 0;
    setDeliveryNoteForm((prev) => {
      const baseProducts = editingDeliveryNoteProductLineId
        ? prev.products.filter((p) => p.productId !== editingDeliveryNoteProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === deliveryNoteProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === deliveryNoteProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(deliveryNoteProductLineForm.gst) || 0, description: deliveryNoteProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: deliveryNoteProductLineForm.productId,
            name: deliveryNoteProductLineForm.name,
            price,
            gst: Number(deliveryNoteProductLineForm.gst) || 0,
            qty,
            unit: deliveryNoteProductLineForm.unit || '',
            hsn: deliveryNoteProductLineForm.hsn || '',
            description: deliveryNoteProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingDeliveryNoteProductLineId(null);
    setQuotationSubView('makeDeliveryNote');
  };


  // Removes a term from THIS delivery note's selection only (does not delete the term
  // from the delivery note terms catalog - that is handled separately by handleDeleteTerm).
  const removeDeliveryNoteSelectedTerm = (termId) => {
    setDeliveryNoteForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };


  const [deliveryNoteTermsDraftSelectedIds, setDeliveryNoteTermsDraftSelectedIds] = useState([]);

  const openSelectTermsForDeliveryNote = () => {
    setDeliveryNoteTermsDraftSelectedIds(deliveryNoteForm.termsIds);
    setQuotationSubView('selectTermsForDeliveryNote');
  };

  const toggleDeliveryNoteTermsDraftSelection = (id) => {
    setDeliveryNoteTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneSelectDeliveryNoteTerms = () => {
    setDeliveryNoteForm((prev) => ({ ...prev, termsIds: deliveryNoteTermsDraftSelectedIds }));
    setQuotationSubView('makeDeliveryNote');
  };

  const selectedDeliveryNoteTerms = deliveryNoteTerms.filter((term) => deliveryNoteForm.termsIds.includes(term.id));


  const handleGenerateDeliveryNote = async () => {
  if (isSavingDeliveryNote) return;
  if (!deliveryNoteForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (deliveryNoteForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a delivery note.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedDeliveryNoteCustomer?.name || 'Unknown',
    customerCompany: selectedDeliveryNoteCustomer?.companyName || '',
    customerMobile: selectedDeliveryNoteCustomer?.mobile || '',
    customerEmail: selectedDeliveryNoteCustomer?.email || '',
    customerAddressLine1: selectedDeliveryNoteCustomer?.addressLine1 || '',
    customerAddressLine2: selectedDeliveryNoteCustomer?.addressLine2 || '',
    customerAddressLine3: selectedDeliveryNoteCustomer?.addressLine3 || '',
    customerBillingAddress: selectedDeliveryNoteCustomer?.billingAddress || '',
    customerShippingAddress: selectedDeliveryNoteCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(deliveryNoteSettings);
  const payload = { 
    ...deliveryNoteForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot)
  };

  setIsSavingDeliveryNote(true);
  try {
    if (editingDeliveryNoteId) {
      const saved = await deliveryNotesService.updateDeliveryNote(editingDeliveryNoteId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistDeliveryNotes(deliveryNotes.map((dn) => (dn.id === editingDeliveryNoteId ? parsedSaved : dn)));
      showSuccess('Delivery Note updated successfully.');
      setEditingDeliveryNoteId(null);
      setQuotationSubView('deliveryNoteDetail');
    } else {
      const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistDeliveryNotes([...deliveryNotes, parsedCreated]);
      showSuccess('Delivery Note generated successfully.');
      setQuotationSubView('deliveryNoteList');
    }
  } catch (error) {
    console.error('Error saving delivery note:', error);
    showAlert('Could not save the delivery note. Please try again.');
  } finally {
    setIsSavingDeliveryNote(false);
  }
};

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);


  // ===== Invoices module: List & Detail Views =====
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');


  const persistInvoices = (next) => {
    setInvoices(next);
    try { localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  // Next invoice number = 1 higher than the highest number already used (formatted as INV-n),
  // so numbering stays sequential even if invoices are deleted.
  const getNextInvoiceNumber = () => {
    const prefix = invoiceSettings.numberPrefix || 'INV-';
    const maxNum = invoices.reduce((max, inv) => {
      const match = String(inv.invoiceNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakeInvoice = () => {
    setEditingInvoiceId(null);
    setInvoiceForm({ ...emptyInvoiceForm(), invoiceNo: getNextInvoiceNumber() });
    setQuotationSubView('makeInvoice');
  };


  const openSelectCustomerForInvoice = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForInvoice');
    setQuotationSubView('selectCustomerForInvoice');
  };

  const handleSelectCustomerForInvoice = (customer) => {
    setInvoiceForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeInvoice');
  };

  const selectedInvoiceCustomer = customers.find((c) => c.id === invoiceForm.customerId) || null;


  const removeInvoiceProductLine = (productId) => {
    setInvoiceForm((prev) => ({ ...prev, products: prev.products.filter((p) => p.productId !== productId) }));
  };

  const [invoiceProductLineForm, setInvoiceProductLineForm] = useState(emptyInvoiceProductLineForm);

  const [editingInvoiceProductLineId, setEditingInvoiceProductLineId] = useState(null);

  const openAddInvoiceProductLine = () => {
    setInvoiceProductLineForm(emptyInvoiceProductLineForm);
    setEditingInvoiceProductLineId(null);
    setQuotationSubView('addInvoiceProductLine');
  };

  const openEditInvoiceProductLine = (p) => {
    setInvoiceProductLineForm({
      productId: p.productId,
      name: p.name,
      price: p.price !== undefined && p.price !== null ? String(p.price) : '',
      gst: Number(p.gst) || 0,
      unit: p.unit || '',
      hsn: p.hsn || '',
      qty: p.qty !== undefined && p.qty !== null ? String(p.qty) : '1',
      description: p.description || '',
    });
    setEditingInvoiceProductLineId(p.productId);
    setQuotationSubView('addInvoiceProductLine');
  };

  const openPickProductForInvoiceLine = () => {
    setProductSearchQuery('');
    setProductPickerReturnView(quotationSubView);
    setQuotationSubView('pickProductForInvoiceLine');
  };

  const handlePickProductForInvoiceLine = (product) => {
    setInvoiceProductLineForm((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price !== undefined && product.price !== null && product.price !== '' ? String(product.price) : prev.price,
      gst: Number(product.gst) || 0,
      unit: product.unit || '',
      hsn: product.hsn || '',
      description: product.description || '',
      qty: '1', // Reset quantity to 1 whenever a (possibly different) product is picked.
    }));
    setQuotationSubView('addInvoiceProductLine');
  };

  const handleAddInvoiceProductLine = () => {
    if (!invoiceProductLineForm.productId) {
      showAlert('Please select a product.');
      return;
    }
    const qty = Number(invoiceProductLineForm.qty) > 0 ? Number(invoiceProductLineForm.qty) : 1;
    const price = Number(invoiceProductLineForm.price) || 0;
    setInvoiceForm((prev) => {
      const baseProducts = editingInvoiceProductLineId
        ? prev.products.filter((p) => p.productId !== editingInvoiceProductLineId)
        : prev.products;
      const existing = baseProducts.find((p) => p.productId === invoiceProductLineForm.productId);
      const products = existing
        ? baseProducts.map((p) => (p.productId === invoiceProductLineForm.productId
            ? { ...p, qty: p.qty + qty, price, gst: Number(invoiceProductLineForm.gst) || 0, description: invoiceProductLineForm.description }
            : p))
        : [...baseProducts, {
            productId: invoiceProductLineForm.productId,
            name: invoiceProductLineForm.name,
            price,
            gst: Number(invoiceProductLineForm.gst) || 0,
            qty,
            unit: invoiceProductLineForm.unit || '',
            hsn: invoiceProductLineForm.hsn || '',
            description: invoiceProductLineForm.description || '',
          }];
      return { ...prev, products };
    });
    setEditingInvoiceProductLineId(null);
    setQuotationSubView('makeInvoice');
  };


  const [isInvoiceOtherChargeModalOpen, setIsInvoiceOtherChargeModalOpen] = useState(false);

  const [invoiceOtherChargeForm, setInvoiceOtherChargeForm] = useState({ label: '', amount: '', taxable: false, gstPercent: '' });

  const [editingInvoiceOtherChargeId, setEditingInvoiceOtherChargeId] = useState(null);

  const openInvoiceOtherChargeModal = () => {
    setInvoiceOtherChargeForm({ label: '', amount: '', taxable: false, gstPercent: '' });
    setEditingInvoiceOtherChargeId(null);
    setIsInvoiceOtherChargeModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing other charge's data, so the user can
  // correct its amount/label/tax without deleting and re-adding it.
  const openEditInvoiceOtherChargeModal = (charge) => {
    setInvoiceOtherChargeForm({
      label: charge.label || 'Other Charges',
      amount: charge.amount !== undefined && charge.amount !== null ? String(charge.amount) : '',
      taxable: !!charge.taxable,
      gstPercent: charge.taxable && charge.gstPercent !== undefined && charge.gstPercent !== null ? String(charge.gstPercent) : '',
    });
    setEditingInvoiceOtherChargeId(charge.id);
    setIsInvoiceOtherChargeModalOpen(true);
  };

  const handleSaveInvoiceOtherCharge = () => {
    if (!invoiceOtherChargeForm.amount || Number(invoiceOtherChargeForm.amount) <= 0) {
      showAlert('Please enter a valid other charge amount.');
      return;
    }
    if (invoiceOtherChargeForm.taxable && (( invoiceOtherChargeForm.gstPercent === '' || invoiceOtherChargeForm.gstPercent === null || invoiceOtherChargeForm.gstPercent === undefined) || Number(invoiceOtherChargeForm.gstPercent) < 0)) {
      showAlert('Please enter a valid tax percentage.');
      return;
    }
    const savedCharge = { ...invoiceOtherChargeForm, label: invoiceOtherChargeForm.label.trim() || 'Other Charges', gstPercent: invoiceOtherChargeForm.taxable ? (Number(invoiceOtherChargeForm.gstPercent) || 0) : 0 };
    setInvoiceForm((prev) => ({
      ...prev,
      otherCharges: editingInvoiceOtherChargeId
        ? prev.otherCharges.map((c) => (c.id === editingInvoiceOtherChargeId ? { ...savedCharge, id: editingInvoiceOtherChargeId } : c))
        : [...prev.otherCharges, { ...savedCharge, id: genId() }],
    }));
    setEditingInvoiceOtherChargeId(null);
    setIsInvoiceOtherChargeModalOpen(false);
  };

  const removeInvoiceOtherCharge = (id) => {
    setInvoiceForm((prev) => ({ ...prev, otherCharges: prev.otherCharges.filter((c) => c.id !== id) }));
  };

  // Removes a term from THIS invoice's selection only (does not delete the term
  // from the invoice terms catalog - that is handled separately by handleDeleteTerm).
  const removeInvoiceSelectedTerm = (termId) => {
    setInvoiceForm((prev) => ({ ...prev, termsIds: prev.termsIds.filter((id) => id !== termId) }));
  };


  const [invoiceTermsDraftSelectedIds, setInvoiceTermsDraftSelectedIds] = useState([]);

  const openSelectTermsForInvoice = () => {
    setInvoiceTermsDraftSelectedIds(invoiceForm.termsIds);
    setQuotationSubView('selectTermsForInvoice');
  };

  const toggleInvoiceTermsDraftSelection = (id) => {
    setInvoiceTermsDraftSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDoneSelectTermsInvoice = () => {
    setInvoiceForm((prev) => ({ ...prev, termsIds: invoiceTermsDraftSelectedIds }));
    setQuotationSubView('makeInvoice');
  };

  const selectedInvoiceTerms = invoiceTerms.filter((term) => invoiceForm.termsIds.includes(term.id));

  const [isPaidInfoModalOpen, setIsPaidInfoModalOpen] = useState(false);

  const [paidInfoForm, setPaidInfoForm] = useState(emptyPaidInfoForm);

  const [editingPaidInfoId, setEditingPaidInfoId] = useState(null);

  const [isPaidInfoDatePickerOpen, setIsPaidInfoDatePickerOpen] = useState(false);

  const [paidInfoCalendarMonth, setPaidInfoCalendarMonth] = useState(() => new Date());

  const openAddPaidInfoModal = () => {
    setPaidInfoForm(emptyPaidInfoForm());
    setEditingPaidInfoId(null);
    setPaidInfoCalendarMonth(new Date());
    setIsPaidInfoModalOpen(true);
  };

  // Opens the same modal pre-filled with an existing paid info entry's data, so the user
  // can correct its amount/date/note without deleting and re-adding it (mirrors
  // openEditProformaPaidInfoModal).
  const openEditPaidInfoModal = (paidInfo) => {
    setPaidInfoForm({
      date: paidInfo.date || '',
      amount: paidInfo.amount !== undefined && paidInfo.amount !== null ? String(paidInfo.amount) : '',
      note: paidInfo.note || '',
    });
    setEditingPaidInfoId(paidInfo.id);
    setPaidInfoCalendarMonth(parseQuotationDate(paidInfo.date) || new Date());
    setIsPaidInfoModalOpen(true);
  };

  const handleSavePaidInfo = () => {
    if (!paidInfoForm.amount || Number(paidInfoForm.amount) <= 0) {
      showAlert('Please enter a valid paid amount.');
      return;
    }
    if (!paidInfoForm.date) {
      showAlert(t('selectDateForAdvanceError') || 'Please select the paid date.');
      return;
    }
    setInvoiceForm((prev) => ({
      ...prev,
      paidInfo: editingPaidInfoId
        ? prev.paidInfo.map((p) => (p.id === editingPaidInfoId
            ? { ...p, date: paidInfoForm.date, amount: Number(paidInfoForm.amount), note: paidInfoForm.note }
            : p))
        : [...prev.paidInfo, { id: genId(), date: paidInfoForm.date, amount: Number(paidInfoForm.amount), note: paidInfoForm.note }],
    }));
    setEditingPaidInfoId(null);
    setIsPaidInfoModalOpen(false);
  };

  const removePaidInfoLine = (id) => {
    setInvoiceForm((prev) => ({ ...prev, paidInfo: prev.paidInfo.filter((p) => p.id !== id) }));
  };

  // Tap-to-select on Paid Info List entries - mirrors the Select Terms and Conditions
  // screen's draft-selection pattern (single or multi-select, highlighted card, Done
  // just closes the screen without any further data change).
  const [selectedPaidInfoIds, setSelectedPaidInfoIds] = useState([]);

  const openPaidInfoList = () => {
    setSelectedPaidInfoIds([]);
    setQuotationSubView('paidInfoList');
  };

  const togglePaidInfoSelection = (id) => {
    setSelectedPaidInfoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDonePaidInfoList = () => {
    setSelectedPaidInfoIds([]);
    setQuotationSubView('makeInvoice');
  };


  const invoiceProductsTotal = invoiceForm.products.reduce((sum, p) => sum + p.price * p.qty * (1 + p.gst / 100), 0);

  const invoiceOtherChargesTotal = invoiceForm.otherCharges.reduce((sum, c) => sum + (Number(c.amount) || 0) * (1 + (c.taxable ? (Number(c.gstPercent) || 0) / 100 : 0)), 0);

  const invoiceGrandTotal = Math.round(invoiceProductsTotal + invoiceOtherChargesTotal);

  const invoicePaidTotal = invoiceForm.paidInfo.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const invoiceAmountDue = Math.max(0, invoiceGrandTotal - invoicePaidTotal);


  const handleGenerateInvoice = async () => {
  if (isSavingInvoice) return;
  if (!invoiceForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (invoiceForm.products.length === 0) {
    showAlert('Please add at least one product.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save an invoice.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedInvoiceCustomer?.name || 'Unknown',
    customerCompany: selectedInvoiceCustomer?.companyName || '',
    customerMobile: selectedInvoiceCustomer?.mobile || '',
    customerEmail: selectedInvoiceCustomer?.email || '',
    customerAddressLine1: selectedInvoiceCustomer?.addressLine1 || '',
    customerAddressLine2: selectedInvoiceCustomer?.addressLine2 || '',
    customerAddressLine3: selectedInvoiceCustomer?.addressLine3 || '',
    customerBillingAddress: selectedInvoiceCustomer?.billingAddress || '',
    customerShippingAddress: selectedInvoiceCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(invoiceSettings);
  const payload = { 
    ...invoiceForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot),
    status: 'Unpaid'
  };

  setIsSavingInvoice(true);
  try {
    if (editingInvoiceId) {
      const saved = await invoicesService.updateInvoice(editingInvoiceId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistInvoices(invoices.map((inv) => (inv.id === editingInvoiceId ? parsedSaved : inv)));
      showSuccess('Invoice updated successfully.');
      setEditingInvoiceId(null);
      setQuotationSubView('invoiceDetail');
    } else {
      const created = await invoicesService.createInvoice(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistInvoices([...invoices, parsedCreated]);
      showSuccess('Invoice generated successfully.');
      setQuotationSubView('invoiceList');
    }
  } catch (error) {
    console.error('Error saving invoice:', error);
    showAlert('Could not save the invoice. Please try again.');
  } finally {
    setIsSavingInvoice(false);
  }
};

  const [receiptForm, setReceiptForm] = useState(emptyReceiptForm);


  // ===== Receipts module: List & Detail Views =====
  const [receipts, setReceipts] = useState(() => {
    try {
      const saved = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  const [receiptSearchQuery, setReceiptSearchQuery] = useState('');


  const persistReceipts = (next) => {
    setReceipts(next);
    try { localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };


  // Next receipt number = 1 higher than the highest number already used (formatted with the
  // receipt settings prefix), so numbering stays sequential even if receipts are deleted.
  const getNextReceiptNumber = () => {
    const prefix = receiptSettings.numberPrefix || 'RECEIPT-';
    const maxNum = receipts.reduce((max, r) => {
      const match = String(r.receiptNo || '').match(/(\d+)\s*$/);
      const n = match ? parseInt(match[1], 10) : 0;
      return n > max ? n : max;
    }, 0);
    return `${prefix}${maxNum + 1}`;
  };


  const openMakeReceipt = () => {
    setEditingReceiptId(null);
    setReceiptForm({ ...emptyReceiptForm(), receiptNo: getNextReceiptNumber() });
    setQuotationSubView('makeReceipt');
  };


  const openSelectCustomerForReceipt = () => {
    setCustomerSearchQuery('');
    setCustomerFormReturnView('selectCustomerForReceipt');
    setQuotationSubView('selectCustomerForReceipt');
  };

  const handleSelectCustomerForReceipt = (customer) => {
    setReceiptForm((prev) => ({ ...prev, customerId: customer.id }));
    setQuotationSubView('makeReceipt');
  };

  const selectedReceiptCustomer = customers.find((c) => c.id === receiptForm.customerId) || null;

  const [receiptPaymentDraft, setReceiptPaymentDraft] = useState(emptyReceiptPaymentDraft);

  const openReceiptPaymentInfo = () => {
    setReceiptPaymentDraft({
      paymentMode: receiptForm.paymentMode,
      referenceNo: receiptForm.referenceNo,
      paidAmount: receiptForm.paidAmount,
      paymentFor: receiptForm.paymentFor,
    });
    setQuotationSubView('receiptPaymentInfo');
  };

  const handleSaveReceiptPaymentInfo = () => {
    if (!receiptPaymentDraft.paidAmount || Number(receiptPaymentDraft.paidAmount) <= 0) {
      showAlert('Please enter a valid total amount paid.');
      return;
    }
    setReceiptForm((prev) => ({
      ...prev,
      paymentMode: receiptPaymentDraft.paymentMode,
      referenceNo: receiptPaymentDraft.referenceNo,
      paidAmount: receiptPaymentDraft.paidAmount,
      paymentFor: receiptPaymentDraft.paymentFor,
    }));
    setQuotationSubView('makeReceipt');
  };


  const receiptPaidAmount = Number(receiptForm.paidAmount) || 0;


  const handleGenerateReceipt = async () => {
  if (isSavingReceipt) return;
  if (!receiptForm.customerId) {
    showAlert('Please select a customer.');
    return;
  }
  if (!receiptForm.paidAmount || Number(receiptForm.paidAmount) <= 0) {
    showAlert('Please add payment info.');
    return;
  }
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to save a receipt.');
    return;
  }

  const customerSnapshot = {
    customerName: selectedReceiptCustomer?.name || 'Unknown',
    customerCompany: selectedReceiptCustomer?.companyName || '',
    customerMobile: selectedReceiptCustomer?.mobile || '',
    customerEmail: selectedReceiptCustomer?.email || '',
    customerAddressLine1: selectedReceiptCustomer?.addressLine1 || '',
    customerAddressLine2: selectedReceiptCustomer?.addressLine2 || '',
    customerAddressLine3: selectedReceiptCustomer?.addressLine3 || '',
    customerBillingAddress: selectedReceiptCustomer?.billingAddress || '',
    customerShippingAddress: selectedReceiptCustomer?.shippingAddress || '',
  };

  const docSnapshot = buildDocSettingsSnapshot(receiptSettings);
  const payload = { 
    ...receiptForm, 
    ...customerSnapshot, 
    docSnapshot: JSON.stringify(docSnapshot)
  };

  setIsSavingReceipt(true);
  try {
    if (editingReceiptId) {
      const saved = await receiptsService.updateReceipt(editingReceiptId, payload);
      const parsedSaved = { ...saved, docSnapshot: saved.docSnapshot ? JSON.parse(saved.docSnapshot) : null };
      persistReceipts(receipts.map((r) => (r.id === editingReceiptId ? parsedSaved : r)));
      showSuccess('Receipt updated successfully.');
      setEditingReceiptId(null);
      setQuotationSubView('receiptDetail');
    } else {
      const created = await receiptsService.createReceipt(loggedInUser.userId, payload);
      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
      persistReceipts([...receipts, parsedCreated]);
      showSuccess('Receipt generated successfully.');
      setQuotationSubView('receiptList');
    }
  } catch (error) {
    console.error('Error saving receipt:', error);
    showAlert('Could not save the receipt. Please try again.');
  } finally {
    setIsSavingReceipt(false);
  }
};


  // ===== Shared: Duplicate / Edit / Status / Share for all document modules =====
  const [editingQuotationId, setEditingQuotationId] = useState(null);

  const [editingPurchaseOrderId, setEditingPurchaseOrderId] = useState(null);

  const [editingProformaInvoiceId, setEditingProformaInvoiceId] = useState(null);

  const [editingDeliveryNoteId, setEditingDeliveryNoteId] = useState(null);

  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const [editingReceiptId, setEditingReceiptId] = useState(null);

  // Guards against double-tap / double-click while a Generate/Update/Save is in
  // flight, so repeated clicks don't create duplicate quotations, purchase
  // orders, proforma invoices, delivery notes, invoices, or receipts (same
  // fix pattern as isSavingWorker for Save Employee).
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);

  const [isSavingPurchaseOrder, setIsSavingPurchaseOrder] = useState(false);

  const [isSavingProformaInvoice, setIsSavingProformaInvoice] = useState(false);

  const [isSavingDeliveryNote, setIsSavingDeliveryNote] = useState(false);

  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  const [isSavingReceipt, setIsSavingReceipt] = useState(false);


  const [showQuotationStatusSheet, setShowQuotationStatusSheet] = useState(false);

  const [showProformaInvoiceConvertSheet, setShowProformaInvoiceConvertSheet] = useState(false);

  const [showInvoiceMoreSheet, setShowInvoiceMoreSheet] = useState(false);

  const [showInvoiceStatusSheet, setShowInvoiceStatusSheet] = useState(false);

  const [showInvoiceConvertSheet, setShowInvoiceConvertSheet] = useState(false);

  // Captures every Business Info + Settings-driven field a document's preview/PDF depends
  // on (business name/contact/logo/signature, bank & UPI/QR details, HSN column label, and
  // that document type's Top/Bottom Message + display-toggle settings), at the exact moment
  // a document is generated or edited-and-updated. Stored as `docSnapshot` on the document
  // itself so later changes to Business Info, that document type's Settings, or Column
  // Heading Settings never alter an already-created document - it only picks up new values
  // the next time the user opens that specific document in Edit and taps Update/Generate.
  // This function returns an object (not a string)
const buildDocSettingsSnapshot = (settings = {}) => ({
  topMessageMode: settings.topMessageMode,
  topMessage: settings.topMessage,
  bottomMessageMode: settings.bottomMessageMode,
  bottomMessage: settings.bottomMessage,
  showBankInfo: settings.showBankInfo,
  showUpiInfo: settings.showUpiInfo,
  showSignature: settings.showSignature,
  showProductHSN: settings.showProductHSN,
  showShippingAddress: settings.showShippingAddress,
  taxType: settings.taxType,
  hsnLabel: columnHeadingSettings.hsnLabel || 'HSN',
  businessName: businessInfo?.businessName || '',
  businessPhone: businessInfo?.phone || '',
  businessEmail: businessInfo?.email || '',
  logoImg: businessInfo?.logoImg || null,
  signatureImg: businessInfo?.signatureImg || null,
  bankAccountName: businessInfo?.bankAccountName || '',
  bankAccountNumber: businessInfo?.bankAccountNumber || '',
  bankName: businessInfo?.bankName || '',
  ifscCode: businessInfo?.ifscCode || '',
  upiId: businessInfo?.upiId || '',
  qrCodeImg: businessInfo?.qrCodeImg || null,
});

const buildQuotationDocModel = (q) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = q.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(quotationSettings);
  }
  
  const rows = (q.products || []).map((p, idx) => {
    const taxableAmt = (p.price || 0) * (p.qty || 0);
    const gstAmt = taxableAmt * (p.gst || 0) / 100;
    return {
      index: idx + 1, name: p.name, hsn: p.hsn || '-', qty: p.qty, unit: p.unit || '',
      price: p.price || 0, gstPct: p.gst || 0, gstAmt, total: taxableAmt + gstAmt,
    };
  });
  const subTotal = (q.products || []).reduce((sum, p) => sum + (p.price || 0) * (p.qty || 0), 0);
  const gstTotal = (q.products || []).reduce((sum, p) => sum + ((p.price || 0) * (p.qty || 0) * (p.gst || 0) / 100), 0);
  const otherChargesRows = (q.otherCharges || []).map((c) => {
    const amount = Number(c.amount) || 0;
    const gstPercent = c.taxable ? (Number(c.gstPercent) || 0) : 0;
    const gstAmt = amount * gstPercent / 100;
    return { label: c.label || 'Other Charges', amount, taxable: !!c.taxable, gstPercent, gstAmt, total: amount + gstAmt };
  });
  const extraChargesTotal = otherChargesRows.reduce((sum, c) => sum + c.total, 0);
  const customerLines = buildCustomerLines(q);
  const termsLines = quotationTerms.filter((t) => (q.termsIds || []).includes(t.id)).map((t) => t.text);
  return {
    quotationTitle: 'Quotation',
    docTitle: 'Quotation',
    toLabel: 'To,',
    pricing: true,
    businessName: snap.businessName || 'Manufacturer',
    businessPhone: snap.businessPhone || '',
    businessEmail: snap.businessEmail || '',
    hsnLabel: snap.hsnLabel || 'HSN',
    date: q.date,
    customerLines,
    shippingAddress: q.customerShippingAddress || '',
    rows,
    subTotal,
    gstTotal,
    otherChargesTotal: extraChargesTotal,
    otherChargesRows,
    grandTotal: q.grandTotal || 0,
    termsLines,
    greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
    closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
    signatureName: snap.businessName || 'Manufacturer',
    logoImg: snap.logoImg || null,
    signatureImg: snap.signatureImg || null,
    showGst: snap.taxType !== 'No',
    showHsn: snap.showProductHSN === 'Yes',
    showShippingAddress: snap.showShippingAddress === 'Yes',
    showBankInfo: snap.showBankInfo === 'Yes',
    showUpi: snap.showUpiInfo === 'Yes',
    showSignature: snap.showSignature !== 'No',
    bankAccountName: snap.bankAccountName || '',
    bankAccountNumber: snap.bankAccountNumber || '',
    bankName: snap.bankName || '',
    ifscCode: snap.ifscCode || '',
    upiId: snap.upiId || '',
    qrCodeImg: snap.qrCodeImg || null,
  };
};

const buildReceiptDocModel = (r) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = r.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(receiptSettings);
  }
  
  const customerLines = buildCustomerLines(r);
  
  return {
    docTitle: 'Receipt',
    businessName: snap.businessName || 'Manufacturer',
    businessPhone: snap.businessPhone || '',
    businessEmail: snap.businessEmail || '',
    date: r.date,
    toLabel: 'To,',
    customerLines,
    paymentMode: r.paymentMode || '-',
    referenceNo: r.referenceNo || '-',
    paidAmount: r.paidAmount || 0,
    paymentFor: r.paymentFor || '-',
    signatureName: snap.businessName || 'Manufacturer',
    logoImg: snap.logoImg || null,
    signatureImg: snap.signatureImg || null,
    showSignature: snap.showSignature !== 'No',
  };
};


  // Type-specific wrappers around buildDocModel — each just supplies the doc-type label,
  // number field, terms catalog, and greeting/closing copy appropriate to that document,
  // while the shape (header + logo, To/Date, table, totals, terms, signature + signature
  // image) stays identical to Quotation Detail's design across every document type.
const buildPurchaseOrderDocModel = (o) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = o.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(purchaseOrderSettings);
  }
  
  return buildDocModel(o, {
    docTypeLabel: 'Purchase Order',
    docNo: o.purchaseOrderNo,
    terms: purchaseOrderTerms,
    toLabel: 'To,',
    greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
    closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
    pricing: true,
    hasPayment: false,
    showHsn: snap.showProductHSN === 'Yes',
    showGst: snap.taxType !== 'No',
    showShippingAddress: snap.showShippingAddress === 'Yes',
    showBankInfo: snap.showBankInfo === 'Yes',
    showUpi: snap.showUpiInfo === 'Yes',
    showSignature: snap.showSignature !== 'No',
    snapshot: snap,
  });
};

const buildProformaInvoiceDocModel = (inv) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = inv.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(proformaInvoiceSettings);
  }
  
  return buildDocModel(inv, {
    docTypeLabel: 'Proforma Invoice',
    docNo: inv.proformaInvoiceNo,
    terms: proformaInvoiceTerms,
    toLabel: 'Bill To,',
    greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
    closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
    pricing: true,
    hasPayment: true,
    showHsn: snap.showProductHSN === 'Yes',
    showGst: snap.taxType !== 'No',
    showShippingAddress: snap.showShippingAddress === 'Yes',
    showBankInfo: snap.showBankInfo === 'Yes',
    showUpi: snap.showUpiInfo === 'Yes',
    showSignature: snap.showSignature !== 'No',
    snapshot: snap,
  });
};

const buildInvoiceDocModel = (inv) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = inv.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(invoiceSettings);
  }
  
  return buildDocModel(inv, {
    docTypeLabel: 'Invoice',
    docNo: inv.invoiceNo,
    terms: invoiceTerms,
    toLabel: 'Bill To,',
    greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
    closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
    pricing: true,
    hasPayment: true,
    showHsn: snap.showProductHSN === 'Yes',
    showGst: snap.taxType !== 'No',
    showShippingAddress: snap.showShippingAddress === 'Yes',
    showBankInfo: snap.showBankInfo === 'Yes',
    showUpi: snap.showUpiInfo === 'Yes',
    showSignature: snap.showSignature !== 'No',
    snapshot: snap,
  });
};

const buildDeliveryNoteDocModel = (dn) => {
  // If docSnapshot is a string, parse it; if it's already an object, use it
  let snap = dn.docSnapshot;
  if (typeof snap === 'string') {
    try {
      snap = JSON.parse(snap);
    } catch (e) {
      snap = null;
    }
  }
  // Fallback to current settings if no valid snapshot
  if (!snap) {
    snap = buildDocSettingsSnapshot(deliveryNoteSettings);
  }
  
  return buildDocModel(dn, {
    docTypeLabel: 'Delivery Note',
    docNo: dn.deliveryNoteNo,
    terms: deliveryNoteTerms,
    toLabel: 'To,',
    greetingLines: snap.topMessageMode === 'Hide' ? [] : splitTopMessageLines(snap.topMessage),
    closingText: snap.bottomMessageMode === 'Hide' ? '' : (snap.bottomMessage || ''),
    pricing: false,
    hasPayment: false,
    showHsn: snap.showProductHSN === 'Yes',
    showSignature: snap.showSignature !== 'No',
    showShippingAddress: snap.showShippingAddress === 'Yes',
    showBankInfo: snap.showBankInfo === 'Yes',
    showUpi: snap.showUpiInfo === 'Yes',
    showReceivedBy: true,
    snapshot: snap,
  });
};


  // Safety net for logo/signature/QR images that were saved BEFORE the crop tool started
  // downscaling photos (see handleConfirmImageCrop) - a business logo captured with a
  // phone camera can be several megapixels/several MB even as-is. Embedding that straight
  // into a PDF (even displayed at a tiny 34x34pt box) produced multi-MB PDFs, and pushing
  // a payload that large across the native bridge to Capacitor's Filesystem/Share plugins
  // is what made "Share" intermittently fail with "Could not prepare the document for
  // sharing" - whether it failed depended on device memory at that moment, so it wasn't
  // reproducible every time. Downscaling right here, at the moment an image goes into a
  // PDF, fixes every already-saved oversized logo/signature/QR without requiring the user
  // to re-upload anything. Results are cached per data-URL so repeat shares of the same
  // business logo don't redo the work.
  const pdfSafeImageCacheRef = useRef(new Map());

  const getPdfSafeImage = (dataUrl, { maxDim = 320, keepPng = false } = {}) => new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const cacheKey = `${maxDim}:${keepPng}:${dataUrl.length}:${dataUrl.slice(0, 48)}`;
    const cached = pdfSafeImageCacheRef.current.get(cacheKey);
    if (cached) { resolve(cached); return; }
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || maxDim, img.naturalHeight || maxDim));
          if (scale >= 1) { pdfSafeImageCacheRef.current.set(cacheKey, dataUrl); resolve(dataUrl); return; }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // QR codes (keepPng) need crisp lossless edges to stay scannable; logos and
          // signatures compress far smaller as JPEG with no visible loss at PDF size.
          const out = keepPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
          pdfSafeImageCacheRef.current.set(cacheKey, out);
          resolve(out);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      resolve(dataUrl);
    }
  });


  const shareGeneratedDocumentPdf = async ({ fileNameBase, title, docNo, date, lines }) => {
    const sanitizedFileName = `${(fileNameBase || title || 'Document').toString().trim().replace(/\s+/g, '_')}.pdf`;
    try {
      await ensureJsPDF();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomLimit = pageHeight - 60;
      let y = 56;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 56; }
      };

      // Business name (left) + document type (right), same visual weight, no single
      // element allowed to dominate the page.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor('#0F172A');
      doc.text(businessInfo?.businessName || 'Manufacturer', marginX, y);
      doc.setFontSize(12);
      doc.text((title || 'Document').toUpperCase(), pageWidth - marginX, y, { align: 'right' });
      y += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      if (businessInfo?.phone) { doc.text(businessInfo.phone, marginX, y); }
      if (docNo) { doc.text(`${title} #: ${docNo}`, pageWidth - marginX, y, { align: 'right' }); }
      y += 11;
      if (businessInfo?.email) { doc.text(businessInfo.email, marginX, y); }
      if (date) { doc.text(`Date: ${date}`, pageWidth - marginX, y, { align: 'right' }); }
      y += 16;

      doc.setDrawColor('#CBD5E1');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // Body lines. A line beginning with "Grand Total" or "Balance Due" is treated as a
      // totals row: right-aligned, bold, set off with its own rule so it reads as
      // important without the oversized type the old layout used.
      (lines || []).forEach((raw) => {
        const line = String(raw);
        const isTotalRow = /^(grand total|balance due)/i.test(line.trim());
        if (line.trim() === '') { ensureSpace(8); y += 8; return; }
        if (isTotalRow) {
          ensureSpace(24);
          const [label, ...rest] = line.split(':');
          const value = rest.join(':').trim();
          doc.setDrawColor('#0F172A');
          doc.setLineWidth(0.75);
          doc.line(pageWidth - marginX - 190, y - 9, pageWidth - marginX, y - 9);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor('#0F172A');
          doc.text(label.trim().toUpperCase(), pageWidth - marginX - 190, y + 4);
          doc.setFontSize(12.5);
          doc.text(value, pageWidth - marginX, y + 4, { align: 'right' });
          y += 22;
        } else {
          ensureSpace(15);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor('#334155');
          doc.text(line, marginX, y, { maxWidth: pageWidth - marginX * 2 });
          y += 15;
        }
      });

      drawBrandFooter();

      await deliverGeneratedPdf(doc, sanitizedFileName);
    } catch (err) {
      console.error('PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };


  // Bank Info: shares the business's saved bank/payment details as a .pdf through the
  // OS share sheet, using the exact same generic PDF renderer + share pattern as every
  // other document in the app (shareGeneratedDocumentPdf).
  const handleShareBankInfo = () => {
    const lines = [
      `Account Holder Name: ${businessInfo?.bankAccountName || '-'}`,
      `Account Number: ${businessInfo?.bankAccountNumber || '-'}`,
      `Bank Name: ${businessInfo?.bankName || '-'}`,
      `IFSC Code: ${businessInfo?.ifscCode || '-'}`,
    ];
    if (businessInfo?.upiId) lines.push(`UPI ID: ${businessInfo.upiId}`);
    shareGeneratedDocumentPdf({
      fileNameBase: `${businessInfo?.businessName || 'Bank'}_Bank_Info`,
      title: 'Bank Info',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      lines,
    });
  };


  // Builds the PDF filename "<LoggedInUserName>_<DocType>_<n>" (without extension) for
  // a shared document, where <n> comes from getDocTypeSequence.
  const buildUserDocFileName = (list, doc, docTypeLabel) => {
    const seq = getDocTypeSequence(list, doc);
    const namePart = (loggedInUser?.fullName || 'User').toString().trim().replace(/\s+/g, '_');
    return `${namePart}_${docTypeLabel}_${seq}`;
  };


  // Dedicated Quotation PDF renderer - draws the SAME header/To-Date/table/totals/
  // terms/signature layout as the in-app "Quotation Detail" preview, built from the
  // exact same buildQuotationDocModel() data, so Share always matches what's on screen.
  const shareQuotationPdf = async (q) => {
    const sanitizedFileName = buildUserDocFileName(quotations, q, 'Quotation').replace(/\s+/g, '_') + '.pdf';
    try {
      await ensureJsPDF();
      const model = buildQuotationDocModel(q);
      model.logoImg = await getPdfSafeImage(model.logoImg, { maxDim: 200 });
      model.signatureImg = await getPdfSafeImage(model.signatureImg, { maxDim: 300, keepPng: true });
      model.qrCodeImg = await getPdfSafeImage(model.qrCodeImg, { maxDim: 300, keepPng: true });
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      registerRupeeFont(doc);
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 50;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
      };

      // ---- Header: Quotation N (top, centered), then Manufacturer info below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#0F172A');
      doc.text(model.quotationTitle, pageWidth / 2, y, { align: 'center' });
      y += 22;

      if (model.logoImg) {
        try { doc.addImage(model.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
      }

      // Business name uses the same size/weight as the customer name below (10.5pt bold)
      // so the two read as visually uniform, matching the in-app document preview.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor('#0F172A');
      doc.text(model.businessName, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      let by = y + 14;
      if (model.businessPhone) { doc.text(model.businessPhone, marginX, by); by += 11; }
      if (model.businessEmail) { doc.text(model.businessEmail, marginX, by); by += 11; }

      y = Math.max(by + 10, model.logoImg ? y + 34 : 0);
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // ---- To, (left) | Date (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text('To,', marginX, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#0F172A');
      doc.text(`Date: ${model.date || ''}`, pageWidth - marginX, y, { align: 'right' });
      y += 13;

      model.customerLines.forEach((line, idx) => {
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10.5 : 8.5);
        doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
        doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
        y += idx === 0 ? 13 : 11;
      });
      y += 10;

      // ---- Shipping Address (only when enabled in Quotation Settings)
      if (model.showShippingAddress && model.shippingAddress) {
        ensureSpace(24);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor('#64748B');
        doc.text('Shipping Address', marginX, y);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#64748B');
        const shipLines = doc.splitTextToSize(model.shippingAddress, contentWidth);
        doc.text(shipLines, marginX, y);
        y += shipLines.length * 11 + 8;
      }

      // ---- Greeting / intro line (skipped when empty)
      if (model.greetingLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#475569');
        model.greetingLines.forEach((line) => {
          doc.text(line, marginX, y);
          y += 13;
        });
        y += 7;
      }

      // ---- Item table
      // Columns are built dynamically so the HSN and GST columns can be omitted entirely
      // (rather than just left blank) when Quotation Settings has them turned off, with the
      // remaining columns proportionally widened to fill the page.
      const showHsn = model.showHsn !== false;
      const showGst = model.showGst !== false;
      const colDefs = [
        { key: 'idx', label: '#', pct: 0.06, align: 'left' },
        { key: 'item', label: 'Item', pct: 0.15, align: 'left' },
        ...(showHsn ? [{ key: 'hsn', label: model.hsnLabel, pct: 0.11, align: 'left' }] : []),
        { key: 'qty', label: 'Qty', pct: 0.13, align: 'center' },
        { key: 'price', label: 'Price', pct: 0.18, align: 'right' },
        ...(showGst ? [{ key: 'gst', label: 'GST', pct: 0.16, align: 'right' }] : []),
        { key: 'total', label: 'Total', pct: 0.21, align: 'right' },
      ];
      const pctSum = colDefs.reduce((s, c) => s + c.pct, 0);
      const colWidths = colDefs.map((c) => (c.pct / pctSum) * contentWidth);
      const colX = [marginX];
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);
      const headers = colDefs.map((c) => c.label);
      const aligns = colDefs.map((c) => c.align);
      const colIndex = {};
      colDefs.forEach((c, i) => { colIndex[c.key] = i; });

      ensureSpace(24);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(1);
      doc.line(marginX, y - 9, pageWidth - marginX, y - 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#475569');
      headers.forEach((h, i) => {
        const align = aligns[i];
        const tx = align === 'right' ? colX[i] + colWidths[i] : align === 'center' ? colX[i] + colWidths[i] / 2 : colX[i];
        doc.text(h.toUpperCase(), tx, y, { align });
      });
      y += 4;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 13;

      model.rows.forEach((r) => {
        const nameLines = doc.splitTextToSize(String(r.name || ''), colWidths[colIndex.item] - 4);
        // When the GST column is shown, each row draws a small sub-line (the GST amount,
        // e.g. "₹33,600") 9pt below the main row baseline. rowH must account for that
        // sub-line's full height, or the divider line below gets drawn too early and
        // overlaps/"cuts" into the row's own text instead of sitting cleanly beneath it.
        const mainRowH = Math.max(13, nameLines.length * 10 + 3);
        const rowH = showGst ? Math.max(mainRowH, 9 + 10) : mainRowH;
        ensureSpace(rowH + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#334155');
        doc.text(String(r.index), colX[colIndex.idx], y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(nameLines, colX[colIndex.item], y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#334155');
        if (showHsn) doc.text(String(r.hsn), colX[colIndex.hsn], y);
        doc.text(`${r.qty}${r.unit ? ' ' + r.unit : ''}`, colX[colIndex.qty] + colWidths[colIndex.qty] / 2, y, { align: 'center' });
        drawAmountText(doc, `₹${Number(r.price).toFixed(2)}`, colX[colIndex.price] + colWidths[colIndex.price], y, { align: 'right' });
        if (showGst) {
          doc.text(`${r.gstPct}%`, colX[colIndex.gst] + colWidths[colIndex.gst], y, { align: 'right' });
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          drawAmountText(doc, `₹${r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[colIndex.gst] + colWidths[colIndex.gst], y + 9, { align: 'right' });
          doc.setFontSize(9);
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        drawAmountText(doc, `₹${r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[colIndex.total] + colWidths[colIndex.total], y, { align: 'right' });
        y += rowH + 6;
      });
      doc.setDrawColor('#EEF1F5');
      doc.setLineWidth(0.5);
      doc.line(marginX, y - 4, pageWidth - marginX, y - 4);
      y += 8;

      // ---- Sub Total / Other Charges / Grand Total
      const totalLabelX = pageWidth - marginX - 190;
      ensureSpace(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#64748B');
      doc.text('Sub Total', totalLabelX, y, { align: 'left' });
      doc.setTextColor('#334155');
      drawAmountText(doc, `₹${(model.subTotal + model.gstTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 15;
      if (model.gstTotal > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        const subTaxLabel = 'GST: ';
        doc.text(subTaxLabel, totalLabelX, y, { align: 'left' });
        const subTaxLabelWidth = doc.getTextWidth(subTaxLabel);
        drawAmountText(doc, `₹${model.gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, totalLabelX + subTaxLabelWidth, y, { align: 'left' });
        doc.setFontSize(9.5);
        y += 12;
      }

      // Updated Other Charges with tax breakdown - the charge label (e.g. "Handling and
      // Transport (Tax 5%)") can wrap onto multiple lines when it's long, so its wrapped
      // line count is measured up front and the "₹..." amount is placed below
      // the LAST wrapped line, not a fixed offset - otherwise a wrapped label's second
      // line collides with the amount drawn right underneath the first line.
      (model.otherChargesRows || []).forEach((c) => {
        const taxAmount = c.taxable ? (c.amount * c.gstPercent / 100) : 0;
        const totalWithTax = c.amount + taxAmount;
        const chargeLabel = c.taxable && c.gstPercent > 0 ? `${c.label} (Tax ${c.gstPercent}%)` : c.label;
        const labelMaxWidth = pageWidth - marginX - totalLabelX - 100;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const chargeLabelLines = doc.splitTextToSize(chargeLabel, labelMaxWidth);
        const labelLineHeight = 11;
        const labelBlockHeight = chargeLabelLines.length * labelLineHeight;
        const hasTaxLine = c.taxable && c.gstPercent > 0;
        ensureSpace(labelBlockHeight + (hasTaxLine ? 15 : 6));
        doc.setTextColor('#64748B');
        doc.text(chargeLabelLines, totalLabelX, y, { align: 'left' });
        doc.setTextColor('#334155');
        drawAmountText(doc, `₹${totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
        if (hasTaxLine) {
          const taxY = y + labelBlockHeight - labelLineHeight + 9;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          // The "(Tax X%)" annotation is already in the label above, so this amount is
          // shown on its own without a redundant "Tax: " prefix.
          drawAmountText(doc, `₹${taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, totalLabelX, taxY, { align: 'left' });
          doc.setFontSize(9.5);
          y = taxY + 13;
        } else {
          y += labelBlockHeight + 4;
        }
      });
      y -= 3;

      ensureSpace(28);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(0.75);
      doc.line(totalLabelX, y, pageWidth - marginX, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#0F172A');
      doc.text('Grand Total', totalLabelX, y, { align: 'left' });
      doc.setFontSize(12.5);
      drawAmountText(doc, `₹${model.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 26;

      // ---- Closing text - full width, above the Terms + Payment row
      if (model.closingText) {
        ensureSpace(15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        const closingLines = doc.splitTextToSize(model.closingText, contentWidth);
        doc.text(closingLines, marginX, y);
        y += closingLines.length * 13 + 8;
      }

      // ---- Terms & Conditions - full width, own row: label (no colon) followed by every
      // term inline, bullet-separated, on the same line (wrapping naturally). Payment
      // Instructions (left) + QR Code (right) are drawn below as their own full-width row,
      // with Signature afterwards in its own row, so nothing ever gets squeezed.
      const hasBankFields = model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode;
      const hasUpiFields = model.upiId || model.qrCodeImg;
      const showTerms = model.termsLines.length > 0;
      const hasBank = !!(model.showBankInfo && hasBankFields);
      const hasQr = !!(model.showUpi && hasUpiFields);

      if (showTerms) {
        // Header sits on its own row, with every term listed below it (one bullet per
        // line) - matching the on-screen document preview layout, instead of running
        // the first term inline next to the header.
        const termsLabel = 'TERMS & CONDITIONS';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const bodyLines = [];
        model.termsLines.forEach((term) => {
          bodyLines.push(...doc.splitTextToSize(`\u2022 ${term}`, contentWidth));
        });
        ensureSpace(14 + bodyLines.length * 12 + 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text(termsLabel, marginX, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#475569');
        doc.text(bodyLines, marginX, y);
        y += bodyLines.length * 12 + 16;
      }

      if (hasBank || hasQr) {
        const estPayHeight = Math.max(hasBank ? 13 + 44 : 0, hasQr ? 90 : 0);
        ensureSpace(estPayHeight);

        const rowStartY = y;
        const qrSize = 70;
        const qrGap = 18;
        // Payment Instructions wraps within a capped column width (so a long bank/account
        // line can't run into the QR) but the QR itself is placed directly after the
        // ACTUAL rendered width of the Payment Instructions text (measured below), not
        // centered inside a large fixed-proportion column - this mirrors the on-screen
        // "auto auto 1fr" grid, where the QR column sits snug against the Payment
        // Instructions column instead of drifting toward the page's right margin.
        const bankTextWidth = hasQr ? Math.min(contentWidth * 0.42, contentWidth - qrSize - qrGap) : contentWidth;

        // Payment Instructions (bank info) - left side of the row. Its actual rendered
        // content width is tracked as it's drawn, so the QR column can be placed snug
        // against it afterwards.
        let bankY = rowStartY;
        let bankContentWidth = 0;
        if (hasBank) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor('#0F172A');
          doc.text('PAYMENT INSTRUCTIONS', marginX, bankY);
          bankContentWidth = Math.max(bankContentWidth, doc.getTextWidth('PAYMENT INSTRUCTIONS'));
          bankY += 13;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor('#475569');
          const bankLines = [
            model.bankAccountName && `Account Holder Name: ${model.bankAccountName}`,
            model.bankAccountNumber && `Account Number: ${model.bankAccountNumber}`,
            model.bankName && `Bank Name: ${model.bankName}`,
            model.ifscCode && `IFSC Code: ${model.ifscCode}`,
          ].filter(Boolean);
          bankLines.forEach((line) => {
            const wrapped = doc.splitTextToSize(line, bankTextWidth);
            wrapped.forEach((wl) => { bankContentWidth = Math.max(bankContentWidth, doc.getTextWidth(wl)); });
            doc.text(wrapped, marginX, bankY);
            bankY += wrapped.length * 11;
          });
        }

        // QR Code - placed directly after the Payment Instructions content (auto-width
        // column + gap), capped so it never runs past the page's right margin, and
        // pinned to the left margin when there's no Payment Instructions block at all.
        // Shifted up slightly (qrTopAdjust) because doc.text()'s y is the text BASELINE
        // while doc.addImage()'s y is the image's TOP edge - without the adjustment the
        // QR's top edge lines up with the bottom of the "PAYMENT INSTRUCTIONS" header
        // text instead of its top, making the QR look like it starts lower than the label.
        const qrTopAdjust = hasBank ? 7 : 0;
        const qrX = hasQr
          ? Math.min(marginX + bankContentWidth + (hasBank ? qrGap : 0), pageWidth - marginX - qrSize)
          : marginX;
        let qrY = rowStartY - qrTopAdjust;
        if (hasQr) {
          if (model.qrCodeImg) {
            try {
              doc.addImage(model.qrCodeImg, qrX, qrY, qrSize, qrSize);
            } catch (e) { /* ignore */ }
          }
          let qrBottomY = qrY + qrSize;
          if (model.upiId) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor('#475569');
            doc.text(model.upiId, qrX + qrSize / 2, qrBottomY + 9, { align: 'center' });
            qrBottomY += 12;
          }
          qrY = qrBottomY;
        }

        y = Math.max(bankY, qrY) + 18;
      }

      // ---- Signature block - standalone row, aligned to the bottom right. A clear gap is
      // left between the signature image and the "AUTHORIZED SIGNATURE" caption below it so
      // the two never overlap in the exported PDF, even for tall/busy signature images.
      if (model.showSignature) {
        ensureSpace(54);
        let sigY = y;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${model.signatureName}`, pageWidth - marginX, sigY, { align: 'right' });
        if (model.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(model.signatureImg, pageWidth - marginX - sigW, sigY + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        sigY += 44;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, sigY, { align: 'right' });
        sigY += 8;
        y = sigY + 8;
      }

      drawBrandFooter();

      await deliverGeneratedPdf(doc, sanitizedFileName);
    } catch (err) {
      console.error('Quotation PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };


  // Generic PDF renderer shared by Invoice / Purchase Order / Proforma Invoice / Delivery
  // Note — draws the exact same header/logo, To-Date, greeting, table, totals, other info,
  // closing text, terms, and signature/signature-image layout as shareQuotationPdf, driven
  // entirely by a model built from buildDocModel, so every document's Share PDF always
  // matches its in-app preview.
  // Generic PDF renderer shared by Invoice / Purchase Order / Proforma Invoice / Delivery
// Note — draws the exact same header/logo, To-Date, greeting, table, totals, other info,
// closing text, terms, and signature/signature-image layout as shareQuotationPdf, driven
// entirely by a model built from buildDocModel, so every document's Share PDF always
// matches its in-app preview.
const shareStandardDocumentPdf = async (model, fileNameBase) => {
  const sanitizedFileName = `${(fileNameBase || model.docTitle || 'Document').toString().trim().replace(/\s+/g, '_')}.pdf`;
  try {
    await ensureJsPDF();
    model.logoImg = await getPdfSafeImage(model.logoImg, { maxDim: 200 });
    model.signatureImg = await getPdfSafeImage(model.signatureImg, { maxDim: 300, keepPng: true });
    model.qrCodeImg = await getPdfSafeImage(model.qrCodeImg, { maxDim: 300, keepPng: true });
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    registerRupeeFont(doc);
    const marginX = 44;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginX * 2;
    const bottomLimit = pageHeight - 60;
    let y = 50;
    const logoDataUrl = await getAppLogoDataUrl();

    const drawBrandFooter = () => {
      const fy = pageHeight - 34;
      doc.setDrawColor('#EDF0F4');
      doc.setLineWidth(0.6);
      doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
      let tx = marginX;
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor('#9CA3AF');
      doc.text('Generated with SmartManage', tx, fy + 0.5);
    };
    const ensureSpace = (needed) => {
      if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
    };

    // ---- Header: Doc title (top, centered), then Business info + logo below
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor('#0F172A');
    doc.text(model.docTitle, pageWidth / 2, y, { align: 'center' });
    y += 22;

    if (model.logoImg) {
      try { doc.addImage(model.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
    }

    // Business name uses the same size/weight as the customer name below (10.5pt bold)
    // so the two read as visually uniform, matching the in-app document preview.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor('#0F172A');
    doc.text(model.businessName, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor('#64748B');
    let by = y + 14;
    if (model.businessPhone) { doc.text(model.businessPhone, marginX, by); by += 11; }
    if (model.businessEmail) { doc.text(model.businessEmail, marginX, by); by += 11; }

    y = Math.max(by + 10, model.logoImg ? y + 34 : 0);
    doc.setDrawColor('#E2E8F0');
    doc.setLineWidth(0.75);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;

    // ---- To, (left) | Date (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#64748B');
    doc.text(model.toLabel || 'To,', marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor('#0F172A');
    doc.text(`Date: ${model.date || ''}`, pageWidth - marginX, y, { align: 'right' });
    y += 13;

    model.customerLines.forEach((line, idx) => {
      doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
      doc.setFontSize(idx === 0 ? 10.5 : 8.5);
      doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
      doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
      y += idx === 0 ? 13 : 11;
    });
    y += 10;

    // ---- Shipping Address (only when enabled in the document type's Settings) - the
    // on-screen document preview shows it for every doc type via the same
    // GeneratedDocumentPreview component, so it's drawn here too to keep the exported
    // PDF in sync with what's on screen.
    if (model.showShippingAddress && model.shippingAddress) {
      ensureSpace(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text('Shipping Address', marginX, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      const shipLines = doc.splitTextToSize(model.shippingAddress, contentWidth);
      doc.text(shipLines, marginX, y);
      y += shipLines.length * 11 + 8;
    }

    // ---- Greeting / intro lines (type-specific, skipped when empty)
    if (model.greetingLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#475569');
      model.greetingLines.forEach((line) => {
        doc.text(line, marginX, y);
        y += 13;
      });
      y += 7;
    }

    // ---- Item table (pricing/HSN/GST columns only when this doc type/its Settings enable them).
    // Column set is built dynamically so hidden columns (e.g. HSN or GST when a document's
    // Settings screen has them off) free up their space rather than leaving a gap.
    const showHsnCol = model.showHsn !== false;
    const showGstCol = model.pricing && model.showGst !== false;
    const cols = [
      { key: 'index', label: '#', pct: model.pricing ? 0.06 : 0.10, align: 'left' },
      { key: 'item', label: 'Item', pct: model.pricing ? 0.15 : 0.30, align: 'left' },
      ...(showHsnCol ? [{ key: 'hsn', label: model.hsnLabel, pct: model.pricing ? 0.11 : 0.23, align: 'left' }] : []),
      { key: 'qty', label: 'Qty', pct: model.pricing ? 0.13 : 0.25, align: 'center' },
      ...(model.pricing ? [{ key: 'price', label: 'Price', pct: 0.18, align: 'right' }] : []),
      ...(showGstCol ? [{ key: 'gst', label: 'GST', pct: 0.16, align: 'right' }] : []),
      ...(model.pricing ? [{ key: 'total', label: 'Total', pct: 0.21, align: 'right' }] : []),
    ];
    const pctSum = cols.reduce((sum, c) => sum + c.pct, 0) || 1;
    const colWidths = cols.map((c) => (c.pct / pctSum) * contentWidth);
    const colX = [marginX];
    for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);
    const colIndex = (key) => cols.findIndex((c) => c.key === key);
    const itemColIdx = colIndex('item');

    ensureSpace(24);
    doc.setDrawColor('#0F172A');
    doc.setLineWidth(1);
    doc.line(marginX, y - 9, pageWidth - marginX, y - 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#475569');
    cols.forEach((c, i) => {
      const tx = c.align === 'right' ? colX[i] + colWidths[i] : c.align === 'center' ? colX[i] + colWidths[i] / 2 : colX[i];
      doc.text(String(c.label).toUpperCase(), tx, y, { align: c.align });
    });
    y += 4;
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 13;

    model.rows.forEach((r) => {
      const nameLines = doc.splitTextToSize(String(r.name || ''), colWidths[itemColIdx] - 4);
      // When the GST column is shown, each row draws a small sub-line (the GST amount,
      // e.g. "₹33,600") 9pt below the main row baseline. rowH must account for that
      // sub-line's full height, or the divider line below gets drawn too early and
      // overlaps/"cuts" into the row's own text instead of sitting cleanly beneath it.
      const mainRowH = Math.max(13, nameLines.length * 10 + 3);
      const rowH = showGstCol ? Math.max(mainRowH, 9 + 10) : mainRowH;
      ensureSpace(rowH + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#334155');
      doc.text(String(r.index), colX[colIndex('index')], y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#0F172A');
      doc.text(nameLines, colX[itemColIdx], y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#334155');
      if (showHsnCol) doc.text(String(r.hsn), colX[colIndex('hsn')], y);
      const qtyIdx = colIndex('qty');
      doc.text(`${r.qty}${r.unit ? ' ' + r.unit : ''}`, colX[qtyIdx] + colWidths[qtyIdx] / 2, y, { align: 'center' });
      if (model.pricing) {
        const priceIdx = colIndex('price');
        drawAmountText(doc, `₹${Number(r.price).toFixed(2)}`, colX[priceIdx] + colWidths[priceIdx], y, { align: 'right' });
        if (showGstCol) {
          const gstIdx = colIndex('gst');
          doc.text(`${r.gstPct}%`, colX[gstIdx] + colWidths[gstIdx], y, { align: 'right' });
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          drawAmountText(doc, `₹${r.gstAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[gstIdx] + colWidths[gstIdx], y + 9, { align: 'right' });
          doc.setFontSize(9);
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        const totalIdx = colIndex('total');
        drawAmountText(doc, `₹${r.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, colX[totalIdx] + colWidths[totalIdx], y, { align: 'right' });
      }
      y += rowH + 6;
    });
    doc.setDrawColor('#EEF1F5');
    doc.setLineWidth(0.5);
    doc.line(marginX, y - 4, pageWidth - marginX, y - 4);
    y += 8;

    // ---- Sub Total / Other Charges / Grand Total (+ Paid / Balance Due when applicable)
    if (model.pricing) {
      const totalLabelX = pageWidth - marginX - 190;
      ensureSpace(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#64748B');
      doc.text('Sub Total', totalLabelX, y, { align: 'left' });
      doc.setTextColor('#334155');
      drawAmountText(doc, `₹${(model.subTotal + model.gstTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 15;
      if (model.gstTotal > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        const subTaxLabel = 'GST: ';
        doc.text(subTaxLabel, totalLabelX, y, { align: 'left' });
        const subTaxLabelWidth = doc.getTextWidth(subTaxLabel);
        drawAmountText(doc, `₹${model.gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, totalLabelX + subTaxLabelWidth, y, { align: 'left' });
        doc.setFontSize(9.5);
        y += 12;
      }

      // Updated Other Charges with tax breakdown - the charge label (e.g. "Handling and
      // Transport (Tax 5%)") can wrap onto multiple lines when it's long, so its wrapped
      // line count is measured up front and the "₹..." amount is placed below
      // the LAST wrapped line, not a fixed offset - otherwise a wrapped label's second
      // line collides with the amount drawn right underneath the first line.
      (model.otherChargesRows || []).forEach((c) => {
        const taxAmount = c.taxable ? (c.amount * c.gstPercent / 100) : 0;
        const totalWithTax = c.amount + taxAmount;
        const chargeLabel = c.taxable && c.gstPercent > 0 ? `${c.label} (Tax ${c.gstPercent}%)` : c.label;
        const labelMaxWidth = pageWidth - marginX - totalLabelX - 100;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const chargeLabelLines = doc.splitTextToSize(chargeLabel, labelMaxWidth);
        const labelLineHeight = 11;
        const labelBlockHeight = chargeLabelLines.length * labelLineHeight;
        const hasTaxLine = c.taxable && c.gstPercent > 0;
        ensureSpace(labelBlockHeight + (hasTaxLine ? 15 : 6));
        doc.setTextColor('#64748B');
        doc.text(chargeLabelLines, totalLabelX, y, { align: 'left' });
        doc.setTextColor('#334155');
        drawAmountText(doc, `₹${totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
        if (hasTaxLine) {
          const taxY = y + labelBlockHeight - labelLineHeight + 9;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor('#94A3B8');
          // The "(Tax X%)" annotation is already in the label above, so this amount is
          // shown on its own without a redundant "Tax: " prefix.
          drawAmountText(doc, `₹${taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, totalLabelX, taxY, { align: 'left' });
          doc.setFontSize(9.5);
          y = taxY + 13;
        } else {
          y += labelBlockHeight + 4;
        }
      });
      y -= 3;

      ensureSpace(28);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(0.75);
      doc.line(totalLabelX, y, pageWidth - marginX, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#0F172A');
      doc.text('Grand Total', totalLabelX, y, { align: 'left' });
      doc.setFontSize(12.5);
      drawAmountText(doc, `₹${model.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, pageWidth - marginX, y, { align: 'right' });
      y += 26;

      if (model.hasPayment && model.paidTotal > 0) {
        ensureSpace(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#16A34A');
        doc.text('Paid', totalLabelX, y, { align: 'left' });
        drawAmountText(doc, `₹${model.paidTotal.toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
        y += 15;
        doc.setTextColor('#0F172A');
        doc.text('Balance Due', totalLabelX, y, { align: 'left' });
        doc.setFontSize(11);
        drawAmountText(doc, `₹${model.balanceDue.toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
        y += 22;
      }
    }

    // ---- Other Info / Closing Text - full width, above the Terms + Payment row
    if (model.otherInfo) {
      ensureSpace(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#64748B');
      const lines = doc.splitTextToSize(model.otherInfo, contentWidth);
      doc.text(lines, marginX, y);
      y += lines.length * 13 + 8;
    }

    if (model.closingText) {
      ensureSpace(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor('#64748B');
      const closingLines = doc.splitTextToSize(model.closingText, contentWidth);
      doc.text(closingLines, marginX, y);
      y += closingLines.length * 13 + 8;
    }

    // ---- Terms & Conditions - full width, own row: label on its own line, followed by
    // every term below it as its own bullet line. Payment Instructions (left) + QR Code
    // (right) are drawn below as their own full-width row, with Signature afterwards (or
    // alongside "Received By" for Delivery Note), so nothing ever gets squeezed.
    const hasBankFields = model.bankAccountName || model.bankAccountNumber || model.bankName || model.ifscCode;
    const hasUpiFields = model.upiId || model.qrCodeImg;
    const showTerms = model.termsLines.length > 0;
    const hasBank = !!(model.showBankInfo && hasBankFields);
    const hasQr = !!(model.showUpi && hasUpiFields);

    if (showTerms) {
      // Header sits on its own row, with every term listed below it (one bullet per
      // line) - matching the on-screen Purchase Order Detail layout, instead of running
      // the first term inline next to the header.
      const termsLabel = 'TERMS & CONDITIONS';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const bodyLines = [];
      model.termsLines.forEach((term) => {
        bodyLines.push(...doc.splitTextToSize(`\u2022 ${term}`, contentWidth));
      });
      ensureSpace(14 + bodyLines.length * 12 + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#0F172A');
      doc.text(termsLabel, marginX, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#475569');
      doc.text(bodyLines, marginX, y);
      y += bodyLines.length * 12 + 16;
    }

    if (hasBank || hasQr) {
      const estPayHeight = Math.max(hasBank ? 13 + 44 : 0, hasQr ? 90 : 0);
      ensureSpace(estPayHeight);

      const rowStartY = y;
      const qrSize = 70;
      const qrGap = 18;
      // Payment Instructions wraps within a capped column width (so a long bank/account
      // line can't run into the QR) but the QR itself is placed directly after the
      // ACTUAL rendered width of the Payment Instructions text (measured below), not
      // centered inside a large fixed-proportion column - this mirrors the on-screen
      // "auto auto 1fr" grid, where the QR column sits snug against the Payment
      // Instructions column instead of drifting toward the page's right margin.
      const bankTextWidth = hasQr ? Math.min(contentWidth * 0.42, contentWidth - qrSize - qrGap) : contentWidth;

      // Payment Instructions (bank info) - left side of the row. Its actual rendered
      // content width is tracked as it's drawn, so the QR column can be placed snug
      // against it afterwards.
      let bankY = rowStartY;
      let bankContentWidth = 0;
      if (hasBank) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor('#0F172A');
        doc.text('PAYMENT INSTRUCTIONS', marginX, bankY);
        bankContentWidth = Math.max(bankContentWidth, doc.getTextWidth('PAYMENT INSTRUCTIONS'));
        bankY += 13;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor('#475569');
        const bankLines = [
          model.bankAccountName && `Account Holder Name: ${model.bankAccountName}`,
          model.bankAccountNumber && `Account Number: ${model.bankAccountNumber}`,
          model.bankName && `Bank Name: ${model.bankName}`,
          model.ifscCode && `IFSC Code: ${model.ifscCode}`,
        ].filter(Boolean);
        bankLines.forEach((line) => {
          const wrapped = doc.splitTextToSize(line, bankTextWidth);
          wrapped.forEach((wl) => { bankContentWidth = Math.max(bankContentWidth, doc.getTextWidth(wl)); });
          doc.text(wrapped, marginX, bankY);
          bankY += wrapped.length * 11;
        });
      }

      // QR Code - placed directly after the Payment Instructions content (auto-width
      // column + gap), capped so it never runs past the page's right margin, and
      // pinned to the left margin when there's no Payment Instructions block at all.
      // Shifted up slightly (qrTopAdjust) because doc.text()'s y is the text BASELINE
      // while doc.addImage()'s y is the image's TOP edge - without the adjustment the
      // QR's top edge lines up with the bottom of the "PAYMENT INSTRUCTIONS" header
      // text instead of its top, making the QR look like it starts lower than the label.
      const qrTopAdjust = hasBank ? 7 : 0;
      const qrX = hasQr
        ? Math.min(marginX + bankContentWidth + (hasBank ? qrGap : 0), pageWidth - marginX - qrSize)
        : marginX;
      let qrY = rowStartY - qrTopAdjust;
      if (hasQr) {
        if (model.qrCodeImg) {
          try {
            doc.addImage(model.qrCodeImg, qrX, qrY, qrSize, qrSize);
          } catch (e) { /* ignore */ }
        }
        let qrBottomY = qrY + qrSize;
        if (model.upiId) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor('#475569');
          doc.text(model.upiId, qrX + qrSize / 2, qrBottomY + 9, { align: 'center' });
          qrBottomY += 12;
        }
        qrY = qrBottomY;
      }

      y = Math.max(bankY, qrY) + 18;
    }

    // ---- Payment History - full width, below the Payment Instructions/QR row and above
    // the Signature block, matching the on-screen document preview order.
    if (model.hasPayment && model.paidInfo.length > 0) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#0F172A');
      doc.text('PAYMENT HISTORY:', marginX, y);
      y += 13;
      model.paidInfo.forEach((p) => {
        ensureSpace(13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#475569');
        doc.text(`${p.date}${p.note ? ' — ' + p.note : ''}`, marginX, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        drawAmountText(doc, `₹${p.amount}`, pageWidth - marginX, y, { align: 'right' });
        y += 13;
      });
      y += 8;
    }

    // ---- Signature block - standalone row, aligned to the bottom right. Skipped here for
    // Delivery Note (showReceivedBy) - drawn instead alongside the "Received By"
    // acknowledgement block after Payment History, below. A clear gap is left between the
    // signature image and the "AUTHORIZED SIGNATURE" caption below it so the two never
    // overlap in the exported PDF, even for tall/busy signature images.
    if (model.showSignature && !model.showReceivedBy) {
      ensureSpace(54);
      let sigY = y;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#0F172A');
      doc.text(`For, ${model.signatureName}`, pageWidth - marginX, sigY, { align: 'right' });
      if (model.signatureImg) {
        try {
          const sigW = 90, sigH = 30;
          doc.addImage(model.signatureImg, pageWidth - marginX - sigW, sigY + 4, sigW, sigH);
        } catch (e) { /* ignore */ }
      }
      sigY += 44;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor('#94A3B8');
      doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, sigY, { align: 'right' });
      sigY += 8;
      y = sigY + 8;
    }

    // ---- Received By (Delivery Note only) - Name/Date/Signature acknowledgement on the
    // left, business's own Authorized Signature on the right, both at the very bottom,
    // below Terms & Conditions / Payment Instructions / QR above.
    if (model.showReceivedBy) {
      ensureSpace(90);
      const rbStartY = y;
      let rbY = rbStartY;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#0F172A');
      doc.text('Received By:', marginX, rbY);
      rbY += 22;
      const rbFieldWidth = contentWidth * 0.55;
      const rbLabelGap = 10;
      const drawBlankField = (label) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor('#475569');
        doc.text(label, marginX, rbY);
        const labelWidth = doc.getTextWidth(label);
        doc.setDrawColor('#94A3B8');
        doc.setLineWidth(0.6);
        doc.line(marginX + labelWidth + rbLabelGap, rbY, marginX + rbFieldWidth, rbY);
        rbY += 26;
      };
      drawBlankField('Name:');
      drawBlankField('Date:');
      drawBlankField('Signature:');

      let rbSigY = rbStartY;
      if (model.showSignature) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${model.signatureName}`, pageWidth - marginX, rbSigY, { align: 'right' });
        if (model.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(model.signatureImg, pageWidth - marginX - sigW, rbSigY + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        rbSigY += 44;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, rbSigY, { align: 'right' });
        rbSigY += 8;
      }
      y = Math.max(rbY, rbSigY) + 8;
    }

    drawBrandFooter();

    await deliverGeneratedPdf(doc, sanitizedFileName);
  } catch (err) {
    console.error('Document PDF share failed:', err);
    showAlert('Could not prepare the document for sharing. Please try again.');
  }
};


  // ----- Quotation: Duplicate / Edit / Status / Share -----
  const openEditQuotation = (q) => {
    setEditingQuotationId(q.id);
    setQuotationForm({
      date: q.date, quotationNo: q.quotationNo, otherInfo: q.otherInfo || '',
      customerId: q.customerId, products: q.products || [], otherCharges: q.otherCharges || [], termsIds: q.termsIds || [],
    });
    setQuotationSubView('makeQuotation');
  };

  const handleDuplicateQuotation = async (q) => {
    if (!loggedInUser?.userId) {
      showAlert('You need to be signed in to duplicate a quotation.');
      return;
    }
    const { id, createdAt, updatedAt, status, ...rest } = q;
    // A duplicate is a brand-new document created right now, so it picks up current
    // Business Info / Quotation Settings at the moment of duplication (like any other new
    // document) rather than inheriting the original's frozen docSnapshot.
    const payload = { ...rest, quotationNo: getNextQuotationNumber(), date: formatQuotationDate(new Date()), docSnapshot: JSON.stringify(buildDocSettingsSnapshot(quotationSettings)) };
    try {
      const created = await documentService.createQuotation(loggedInUser.userId, payload);
      persistQuotations([...quotations, created]);
      showSuccess('Quotation duplicated successfully.');
      setQuotationSubView('quotationList');
    } catch (error) {
      console.error('Error duplicating quotation:', error);
      showAlert('Could not duplicate the quotation on the server. Please try again.');
    }
  };

 const handleSetQuotationStatus = async (status) => {
  const previous = quotations;
  persistQuotations(quotations.map((q) => (q.id === selectedQuotationId ? { ...q, status } : q)));
  setShowQuotationStatusSheet(false);
  setShowQuotationMoreSheet(false);
  try {
    await documentService.updateQuotationStatus(selectedQuotationId, status);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    persistQuotations(previous);
    showAlert('Could not update the quotation status. Please try again.');
  }
};

  const handleShareQuotation = (q) => {
    shareQuotationPdf(q);
  };


  // ----- Purchase Order: Duplicate / Edit / Status / Share -----
 const openEditPurchaseOrder = (o) => {
  setEditingPurchaseOrderId(o.id);
  setPurchaseOrderForm({
    date: o.date, 
    purchaseOrderNo: o.purchaseOrderNo, 
    otherInfo: o.otherInfo || '',
    customerId: o.customerId, 
    products: o.products || [], 
    otherCharges: o.otherCharges || [], 
    termsIds: o.termsIds || [],
  });
  setQuotationSubView('makePurchaseOrder');
};

  const handleDuplicatePurchaseOrder = async (o) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a purchase order.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = o;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Purchase Order Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    purchaseOrderNo: getNextPurchaseOrderNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: JSON.stringify(buildDocSettingsSnapshot(purchaseOrderSettings)),
  };
  try {
    const created = await purchaseOrdersService.createPurchaseOrder(loggedInUser.userId, payload);
    // Parse docSnapshot into an object here too (matches handleGeneratePurchaseOrder above) -
    // otherwise it's left as a raw JSON string in local state, which is inconsistent with
    // every other purchase order in `purchaseOrders` and can cause double-encoding issues
    // the next time this record is persisted to localStorage.
    const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
    persistPurchaseOrders([...purchaseOrders, parsedCreated]);
    showSuccess('Purchase Order duplicated successfully.');
    setQuotationSubView('purchaseOrderList');
  } catch (error) {
    console.error('Error duplicating purchase order:', error);
    showAlert('Could not duplicate the purchase order. Please try again.');
  }
};

  const handleSharePurchaseOrder = (o) => {
    shareStandardDocumentPdf(buildPurchaseOrderDocModel(o), buildUserDocFileName(purchaseOrders, o, 'PurchaseOrder'));
  };


  // ----- Proforma Invoice: Duplicate / Edit / Status / Share -----
  const openEditProformaInvoice = (inv) => {
  setEditingProformaInvoiceId(inv.id);
  setProformaInvoiceForm({
    date: inv.date, 
    proformaInvoiceNo: inv.proformaInvoiceNo, 
    dueDate: inv.dueDate || '', 
    poNo: inv.poNo || '', 
    otherInfo: inv.otherInfo || '',
    customerId: inv.customerId, 
    products: inv.products || [], 
    otherCharges: inv.otherCharges || [], 
    termsIds: inv.termsIds || [], 
    paidInfo: inv.paidInfo || [],
  });
  setQuotationSubView('makeProformaInvoice');
};

  const handleDuplicateProformaInvoice = async (inv) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a proforma invoice.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = inv;
  const payload = { 
    ...rest, 
    proformaInvoiceNo: getNextProformaInvoiceNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: JSON.stringify(buildDocSettingsSnapshot(proformaInvoiceSettings)),
  };
  try {
    const created = await proformaInvoicesService.createProformaInvoice(loggedInUser.userId, payload);
    // ✅ PARSE the docSnapshot before storing in localStorage
    const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
    persistProformaInvoices([...proformaInvoices, parsedCreated]);
    showSuccess('Proforma Invoice duplicated successfully.');
    setQuotationSubView('proformaInvoiceList');
  } catch (error) {
    console.error('Error duplicating proforma invoice:', error);
    showAlert('Could not duplicate the proforma invoice. Please try again.');
  }
};

  const handleSetProformaInvoiceStatus = async (status) => {
  const previous = proformaInvoices;
  persistProformaInvoices(proformaInvoices.map((inv) => (inv.id === selectedProformaInvoiceId ? { ...inv, status } : inv)));
  setShowProformaInvoiceStatusSheet(false);
  setShowProformaInvoiceMoreSheet(false);
  try {
    await proformaInvoicesService.updateProformaInvoiceStatus(selectedProformaInvoiceId, status);
  } catch (error) {
    console.error('Error updating proforma invoice status:', error);
    persistProformaInvoices(previous);
    showAlert('Could not update the proforma invoice status. Please try again.');
  }
};

  const handleShareProformaInvoice = (inv) => {
    shareStandardDocumentPdf(buildProformaInvoiceDocModel(inv), buildUserDocFileName(proformaInvoices, inv, 'ProformaInvoice'));
  };


  // ----- Delivery Note: Duplicate / Edit / Status / Share -----
  const openEditDeliveryNote = (dn) => {
  setEditingDeliveryNoteId(dn.id);
  setDeliveryNoteForm({
    date: dn.date, 
    deliveryNoteNo: dn.deliveryNoteNo, 
    refNo: dn.refNo || '', 
    otherInfo: dn.otherInfo || '',
    customerId: dn.customerId, 
    products: dn.products || [], 
    termsIds: dn.termsIds || [],
  });
  setQuotationSubView('makeDeliveryNote');
};

  const handleDuplicateDeliveryNote = async (dn) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a delivery note.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = dn;
  const payload = { 
    ...rest, 
    deliveryNoteNo: getNextDeliveryNoteNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: JSON.stringify(buildDocSettingsSnapshot(deliveryNoteSettings)),
  };
  try {
    const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
    // ✅ PARSE the docSnapshot before storing in localStorage
    const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
    persistDeliveryNotes([...deliveryNotes, parsedCreated]);
    showSuccess('Delivery Note duplicated successfully.');
    setQuotationSubView('deliveryNoteList');
  } catch (error) {
    console.error('Error duplicating delivery note:', error);
    showAlert('Could not duplicate the delivery note. Please try again.');
  }
};

  const handleShareDeliveryNote = (dn) => {
    shareStandardDocumentPdf(buildDeliveryNoteDocModel(dn), buildUserDocFileName(deliveryNotes, dn, 'DeliveryNote'));
  };


  // ----- Invoice: Duplicate / Edit / Status / Share -----
  const openEditInvoice = (inv) => {
    setEditingInvoiceId(inv.id);
    setInvoiceForm({
      date: inv.date, invoiceNo: inv.invoiceNo, dueDate: inv.dueDate || '', poNo: inv.poNo || '', otherInfo: inv.otherInfo || '',
      customerId: inv.customerId, products: inv.products || [], otherCharges: inv.otherCharges || [], termsIds: inv.termsIds || [], paidInfo: inv.paidInfo || [],
    });
    setQuotationSubView('makeInvoice');
  };

  const handleDuplicateInvoice = async (inv) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate an invoice.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = inv;
  const payload = { 
    ...rest, 
    invoiceNo: getNextInvoiceNumber(), 
    date: formatQuotationDate(new Date()),
    status: 'Unpaid',
    docSnapshot: JSON.stringify(buildDocSettingsSnapshot(invoiceSettings)),
  };
  try {
    const created = await invoicesService.createInvoice(loggedInUser.userId, payload);
    // ✅ PARSE the docSnapshot before storing in localStorage
    const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
    persistInvoices([...invoices, parsedCreated]);
    showSuccess('Invoice duplicated successfully.');
    setQuotationSubView('invoiceList');
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    showAlert('Could not duplicate the invoice. Please try again.');
  }
};

  const handleSetInvoiceStatus = async (status) => {
  const previous = invoices;
  persistInvoices(invoices.map((inv) => (inv.id === selectedInvoiceId ? { ...inv, status } : inv)));
  setShowInvoiceStatusSheet(false);
  setShowInvoiceMoreSheet(false);
  try {
    await invoicesService.updateInvoiceStatus(selectedInvoiceId, status);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    persistInvoices(previous);
    showAlert('Could not update the invoice status. Please try again.');
  }
};

  const handleShareInvoice = (inv) => {
    shareStandardDocumentPdf(buildInvoiceDocModel(inv), buildUserDocFileName(invoices, inv, 'Invoice'));
  };


  // ----- Receipt: Duplicate / Edit / Status / Share -----
  const openEditReceipt = (r) => {
  setEditingReceiptId(r.id);
  setReceiptForm({
    date: r.date, 
    receiptNo: r.receiptNo, 
    customerId: r.customerId,
    paymentMode: r.paymentMode || '', 
    referenceNo: r.referenceNo || '', 
    paidAmount: r.paidAmount != null ? String(r.paidAmount) : '', 
    paymentFor: r.paymentFor || '',
  });
  setQuotationSubView('makeReceipt');
};

  const handleDuplicateReceipt = async (r) => {
  if (!loggedInUser?.userId) {
    showAlert('You need to be signed in to duplicate a receipt.');
    return;
  }
  const { id, createdAt, updatedAt, status, ...rest } = r;
  // A duplicate is a brand-new document created right now, so it picks up current
  // Business Info / Receipt Settings rather than inheriting the original's frozen docSnapshot.
  const payload = { 
    ...rest, 
    receiptNo: getNextReceiptNumber(), 
    date: formatQuotationDate(new Date()),
    docSnapshot: JSON.stringify(buildDocSettingsSnapshot(receiptSettings)),
  };
  try {
    const created = await receiptsService.createReceipt(loggedInUser.userId, payload);
    persistReceipts([...receipts, created]);
    showSuccess('Receipt duplicated successfully.');
    setQuotationSubView('receiptList');
  } catch (error) {
    console.error('Error duplicating receipt:', error);
    showAlert('Could not duplicate the receipt. Please try again.');
  }
};

  // Receipt PDF — draws the exact same header/logo, To-Date, and signature layout as
  // shareStandardDocumentPdf (Quotation/Invoice/etc.) so the Receipt PDF matches every
  // other document type instead of using its own one-off layout. The item table is
  // replaced with a Payment Details block, and the signature is always the business
  // (not the customer), matching the in-app Receipt Detail preview.
  const shareReceiptPdf = async (r) => {
    const sanitizedFileName = `${buildUserDocFileName(receipts, r, 'Receipt')}.pdf`;
    // Frozen Business Info / Receipt Settings from when this receipt was created or
    // last edited-and-updated; falls back to live values only for receipts saved
    // before this snapshot existed.
    // Shallow-copied so the downscaled images below never mutate the receipt's own stored
    // docSnapshot (or the live Business Info) - only this share's local copy is resized.
    const snap = { ...(r.docSnapshot || buildDocSettingsSnapshot(receiptSettings)) };
    try {
      await ensureJsPDF();
      snap.logoImg = await getPdfSafeImage(snap.logoImg, { maxDim: 200 });
      snap.signatureImg = await getPdfSafeImage(snap.signatureImg, { maxDim: 300, keepPng: true });
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      registerRupeeFont(doc);
      const marginX = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - 60;
      let y = 50;
      const logoDataUrl = await getAppLogoDataUrl();

      const drawBrandFooter = () => {
        const fy = pageHeight - 34;
        doc.setDrawColor('#EDF0F4');
        doc.setLineWidth(0.6);
        doc.line(marginX, fy - 12, pageWidth - marginX, fy - 12);
        let tx = marginX;
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', marginX, fy - 8, 11, 11); tx = marginX + 15; } catch (e) { /* ignore */ }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#9CA3AF');
        doc.text('Generated with SmartManage', tx, fy + 0.5);
      };
      const ensureSpace = (needed) => {
        if (y + needed > bottomLimit) { drawBrandFooter(); doc.addPage(); y = 50; }
      };

      // ---- Header: Receipt # (top, centered), then Business info + logo below
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#0F172A');
      doc.text('Receipt', pageWidth / 2, y, { align: 'center' });
      y += 22;

      if (snap.logoImg) {
        try { doc.addImage(snap.logoImg, pageWidth - marginX - 34, y - 12, 34, 34); } catch (e) { /* ignore */ }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor('#0F172A');
      doc.text(snap.businessName || 'Manufacturer', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#64748B');
      let by = y + 14;
      if (snap.businessPhone) { doc.text(snap.businessPhone, marginX, by); by += 11; }
      if (snap.businessEmail) { doc.text(snap.businessEmail, marginX, by); by += 11; }

      y = Math.max(by + 10, snap.logoImg ? y + 34 : 0);
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;

      // ---- To, (left) | Date (right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#64748B');
      doc.text('To,', marginX, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor('#0F172A');
      doc.text(`Date: ${r.date || ''}`, pageWidth - marginX, y, { align: 'right' });
      y += 13;

      const customerLines = buildCustomerLines(r);
      customerLines.forEach((line, idx) => {
        doc.setFont('helvetica', idx === 0 ? 'bold' : 'normal');
        doc.setFontSize(idx === 0 ? 10.5 : 8.5);
        doc.setTextColor(idx === 0 ? '#0F172A' : '#64748B');
        doc.text(String(line), marginX, y, { maxWidth: contentWidth - 160 });
        y += idx === 0 ? 13 : 11;
      });
      y += 14;

      // ---- Payment Details
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#0F172A');
      doc.text('PAYMENT DETAILS', marginX, y);
      y += 6;
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(1);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 17;

      const paymentRows = [
        ['Payment Mode', r.paymentMode || '-'],
        ['Reference No', r.referenceNo || '-'],
        ['Payment For', r.paymentFor || '-'],
      ];
      paymentRows.forEach(([label, value]) => {
        ensureSpace(17);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor('#64748B');
        doc.text(label, marginX, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0F172A');
        doc.text(String(value), pageWidth - marginX, y, { align: 'right' });
        y += 13;
        doc.setDrawColor('#EEF1F5');
        doc.setLineWidth(0.5);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 12;
      });
      y += 4;

      // ---- Total Paid
      const totalLabelX = pageWidth - marginX - 190;
      ensureSpace(28);
      doc.setDrawColor('#0F172A');
      doc.setLineWidth(0.75);
      doc.line(totalLabelX, y, pageWidth - marginX, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor('#0F172A');
      doc.text('Total Paid', totalLabelX, y, { align: 'left' });
      doc.setFontSize(12.5);
      drawAmountText(doc, `₹${Number(r.paidAmount || 0).toLocaleString('en-IN')}`, pageWidth - marginX, y, { align: 'right' });
      y += 34;

      // ---- Signature block (only when Receipt Settings has "Signature Display" set to Yes)
      if (snap.showSignature !== 'No') {
        ensureSpace(46);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor('#0F172A');
        doc.text(`For, ${snap.businessName || 'Manufacturer'}`, pageWidth - marginX, y, { align: 'right' });
        if (snap.signatureImg) {
          try {
            const sigW = 90, sigH = 30;
            doc.addImage(snap.signatureImg, pageWidth - marginX - sigW, y + 4, sigW, sigH);
          } catch (e) { /* ignore */ }
        }
        // A clear gap (44 rather than the image's own 34pt footprint) keeps the caption
        // below from overlapping the bottom of the signature image in the exported PDF.
        y += 44;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#94A3B8');
        doc.text('AUTHORIZED SIGNATURE', pageWidth - marginX, y, { align: 'right' });
      }

      drawBrandFooter();

      await deliverGeneratedPdf(doc, sanitizedFileName);
    } catch (err) {
      console.error('Receipt PDF share failed:', err);
      showAlert('Could not prepare the document for sharing. Please try again.');
    }
  };

  const handleShareReceipt = (r) => {
    shareReceiptPdf(r);
  };


  // ===== Quotation module: "Do you want to cancel the process?" guard =====
  // Returns the leave action + dirty flag for the form screen currently open (or null when the
  // current sub-screen is not a form). Used by BOTH the on-screen back arrow and the Android
  // hardware back button, so both behave identically.
  const getQuotationLeaveAction = () => {
    const isBlank = (f) => !(
      f.customerId || (f.products || []).length || (f.otherCharges || []).length ||
      (f.termsIds || []).length || (f.paidInfo || []).length ||
      String(f.otherInfo || '').trim() || String(f.dueDate || '').trim() ||
      String(f.poNo || '').trim() || String(f.refNo || '').trim() || String(f.paidAmount || '').trim()
    );
    const make = (form, editingId, setEditing, detailView, newView) => ({
      // Editing an existing document always asks (edits are not diffed); a new one only asks once something was entered.
      dirty: !!editingId || !isBlank(form),
      leave: () => {
        if (editingId) { setEditing(null); setQuotationSubView(detailView); }
        else setQuotationSubView(newView);
      },
    });
    switch (quotationSubView) {
      case 'makeQuotation': return make(quotationForm, editingQuotationId, setEditingQuotationId, 'quotationDetail', null);
      case 'makePurchaseOrder': return make(purchaseOrderForm, editingPurchaseOrderId, setEditingPurchaseOrderId, 'purchaseOrderDetail', null);
      case 'makeProformaInvoice': return make(proformaInvoiceForm, editingProformaInvoiceId, setEditingProformaInvoiceId, 'proformaInvoiceDetail', null);
      case 'makeDeliveryNote': return make(deliveryNoteForm, editingDeliveryNoteId, setEditingDeliveryNoteId, 'deliveryNoteDetail', null);
      case 'makeInvoice': return make(invoiceForm, editingInvoiceId, setEditingInvoiceId, 'invoiceDetail', null);
      case 'makeReceipt': return make(receiptForm, editingReceiptId, setEditingReceiptId, 'receiptDetail', 'receiptList');
      case 'addCustomer': {
        const original = editingCustomerId
          ? { ...emptyCustomerForm, ...(customers.find((c) => c.id === editingCustomerId) || {}) }
          : emptyCustomerForm;
        return {
          dirty: JSON.stringify(customerForm) !== JSON.stringify(original),
          leave: () => setQuotationSubView(customerFormReturnView),
        };
      }
      case 'addProduct': {
        const original = editingProductId
          ? { ...emptyProductForm, ...(products.find((p) => p.id === editingProductId) || {}) }
          : emptyProductForm;
        return {
          dirty: JSON.stringify(productForm) !== JSON.stringify(original),
          leave: () => setQuotationSubView(productFormReturnView),
        };
      }
      default: return null;
    }
  };

  // Runs the back action for the open Quotation form screen, asking for confirmation first when
  // there is unsaved work. Returns true if the back press was handled.
  const requestQuotationLeave = () => {
    const action = getQuotationLeaveAction();
    if (!action) return false;
    if (action.dirty) return confirmDiscardThen(action.leave);
    action.leave();
    return true;
  };


  const closeDocumentsTopmostScreen = () => {
    if (closeProfileModalIfOpen()) return true;
    if (closeSubscribeOrHelpIfOpen()) return true;
    // Quotations module: hardware back closes an open sheet/picker before stepping out of a sub-screen.
    if (showStatePicker) { setShowStatePicker(false); return true; }
    // Quotations module: form screens ask "cancel the process?" before closing.
    if (activeModule === 'quotations' && getQuotationLeaveAction()) return requestQuotationLeave();
    // Quotations module: hardware back steps out of a sub-screen before leaving the module.
    if (activeModule === 'quotations' && quotationSubView !== null) {
      setQuotationSubView(null);
      return true;
    }
    return false;
  };


useEffect(() => {
  if (isUserAuthenticated && loggedInUser?.userId) {
    const userId = loggedInUser.userId;
    loadUserQuotations(userId);
    loadUserCustomers(userId);
    loadUserProducts(userId);
    loadUserInvoices(userId);
    loadUserPurchaseOrders(userId);
    loadUserProformaInvoices(userId);
    loadUserDeliveryNotes(userId);
    loadUserReceipts(userId);
    loadUserBusinessInfo(userId);
    loadUserSettings(userId);
    loadUserTerms(userId);
  }
}, [isUserAuthenticated, loggedInUser?.userId]);


  useEffect(() => {
    if (!isReconnecting) return;
    if (isUserAuthenticated && loggedInUser?.userId) {
      const userId = loggedInUser.userId;
      Promise.allSettled([
        loadUserQuotations(userId),
        loadUserCustomers(userId),
      ]);
    }
  }, [isReconnecting]);


  // GetQuotations (the list load in loadUserQuotations) intentionally omits docSnapshot
  // for payload-size reasons - see backend DocumentsController.GetQuotations - so a
  // quotation loaded from the list only has docSnapshot: null until this hydrates it.
  // buildQuotationDocModel silently falls back to *current* business settings when
  // docSnapshot is missing, which would be wrong for an old quotation whose logo/
  // signature/bank info has since changed, so the detail/preview/share/PDF/edit screen
  // fetches the single quotation (which still returns the real snapshot) on open.
  // hydratedQuotationSnapshotIdsRef avoids re-fetching on every re-render for
  // legacy quotations that genuinely have no stored snapshot.
  const hydratedQuotationSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'quotationDetail' || !selectedQuotationId) return;
    const current = quotations.find(q => q.id === selectedQuotationId);
    if (!current || current.docSnapshot || hydratedQuotationSnapshotIdsRef.current.has(selectedQuotationId)) return;
    hydratedQuotationSnapshotIdsRef.current.add(selectedQuotationId);
    let cancelled = false;
    (async () => {
      try {
        const full = await documentService.getQuotation(selectedQuotationId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for quotation', selectedQuotationId, e);
          return;
        }
        setQuotations(prev => {
          const next = prev.map(q => (q.id === selectedQuotationId ? { ...q, docSnapshot: parsedSnapshot } : q));
          try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating quotation snapshot', selectedQuotationId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedQuotationId, quotations]);


  // Same docSnapshot-hydration-on-open fix as Quotation above, applied to the other 5
  // document types (Invoice, Purchase Order, Proforma Invoice, Delivery Note, Receipt) so
  // that changing a document type's Settings after a document was created never alters
  // that already-created document's preview/PDF - only documents created after the change
  // pick up the new settings, exactly like Quotation.
  const hydratedInvoiceSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'invoiceDetail' || !selectedInvoiceId) return;
    const current = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!current || current.docSnapshot || hydratedInvoiceSnapshotIdsRef.current.has(selectedInvoiceId)) return;
    hydratedInvoiceSnapshotIdsRef.current.add(selectedInvoiceId);
    let cancelled = false;
    (async () => {
      try {
        const full = await invoicesService.getInvoice(selectedInvoiceId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for invoice', selectedInvoiceId, e);
          return;
        }
        setInvoices(prev => {
          const next = prev.map(inv => (inv.id === selectedInvoiceId ? { ...inv, docSnapshot: parsedSnapshot } : inv));
          try { localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating invoice snapshot', selectedInvoiceId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedInvoiceId, invoices]);


  const hydratedPurchaseOrderSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'purchaseOrderDetail' || !selectedPurchaseOrderId) return;
    const current = purchaseOrders.find(o => o.id === selectedPurchaseOrderId);
    if (!current || current.docSnapshot || hydratedPurchaseOrderSnapshotIdsRef.current.has(selectedPurchaseOrderId)) return;
    hydratedPurchaseOrderSnapshotIdsRef.current.add(selectedPurchaseOrderId);
    let cancelled = false;
    (async () => {
      try {
        const full = await purchaseOrdersService.getPurchaseOrder(selectedPurchaseOrderId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for purchase order', selectedPurchaseOrderId, e);
          return;
        }
        setPurchaseOrders(prev => {
          const next = prev.map(o => (o.id === selectedPurchaseOrderId ? { ...o, docSnapshot: parsedSnapshot } : o));
          try { localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating purchase order snapshot', selectedPurchaseOrderId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedPurchaseOrderId, purchaseOrders]);


  const hydratedProformaInvoiceSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'proformaInvoiceDetail' || !selectedProformaInvoiceId) return;
    const current = proformaInvoices.find(pi => pi.id === selectedProformaInvoiceId);
    if (!current || current.docSnapshot || hydratedProformaInvoiceSnapshotIdsRef.current.has(selectedProformaInvoiceId)) return;
    hydratedProformaInvoiceSnapshotIdsRef.current.add(selectedProformaInvoiceId);
    let cancelled = false;
    (async () => {
      try {
        const full = await proformaInvoicesService.getProformaInvoice(selectedProformaInvoiceId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for proforma invoice', selectedProformaInvoiceId, e);
          return;
        }
        setProformaInvoices(prev => {
          const next = prev.map(pi => (pi.id === selectedProformaInvoiceId ? { ...pi, docSnapshot: parsedSnapshot } : pi));
          try { localStorage.setItem(PROFORMA_INVOICES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating proforma invoice snapshot', selectedProformaInvoiceId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedProformaInvoiceId, proformaInvoices]);


  const hydratedDeliveryNoteSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'deliveryNoteDetail' || !selectedDeliveryNoteId) return;
    const current = deliveryNotes.find(dn => dn.id === selectedDeliveryNoteId);
    if (!current || current.docSnapshot || hydratedDeliveryNoteSnapshotIdsRef.current.has(selectedDeliveryNoteId)) return;
    hydratedDeliveryNoteSnapshotIdsRef.current.add(selectedDeliveryNoteId);
    let cancelled = false;
    (async () => {
      try {
        const full = await deliveryNotesService.getDeliveryNote(selectedDeliveryNoteId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for delivery note', selectedDeliveryNoteId, e);
          return;
        }
        setDeliveryNotes(prev => {
          const next = prev.map(dn => (dn.id === selectedDeliveryNoteId ? { ...dn, docSnapshot: parsedSnapshot } : dn));
          try { localStorage.setItem(DELIVERY_NOTES_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating delivery note snapshot', selectedDeliveryNoteId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedDeliveryNoteId, deliveryNotes]);


  const hydratedReceiptSnapshotIdsRef = useRef(new Set());

  useEffect(() => {
    if (quotationSubView !== 'receiptDetail' || !selectedReceiptId) return;
    const current = receipts.find(r => r.id === selectedReceiptId);
    if (!current || current.docSnapshot || hydratedReceiptSnapshotIdsRef.current.has(selectedReceiptId)) return;
    hydratedReceiptSnapshotIdsRef.current.add(selectedReceiptId);
    let cancelled = false;
    (async () => {
      try {
        const full = await receiptsService.getReceipt(selectedReceiptId);
        if (cancelled || !full?.docSnapshot) return;
        let parsedSnapshot = null;
        try {
          parsedSnapshot = JSON.parse(full.docSnapshot);
        } catch (e) {
          console.error('Error parsing hydrated docSnapshot for receipt', selectedReceiptId, e);
          return;
        }
        setReceipts(prev => {
          const next = prev.map(r => (r.id === selectedReceiptId ? { ...r, docSnapshot: parsedSnapshot } : r));
          try { localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      } catch (error) {
        console.error('Error hydrating receipt snapshot', selectedReceiptId, error);
      }
    })();
    return () => { cancelled = true; };
  }, [quotationSubView, selectedReceiptId, receipts]);

  moduleRegistryRef.current.quotations = {
    closeTopmostScreen: closeDocumentsTopmostScreen,
    refreshData: (userId) => Promise.all([
      loadUserQuotations(userId),
      loadUserCustomers(userId),
      loadUserProducts(userId),
      loadUserInvoices(userId),
      loadUserPurchaseOrders(userId),
      loadUserProformaInvoices(userId),
      loadUserDeliveryNotes(userId),
      loadUserReceipts(userId),
      loadUserBusinessInfo(userId),
      loadUserSettings(userId),
      loadUserTerms(userId),
    ]),
    // The shared image cropper hands finished logo / signature / QR crops to whichever module owns them.
    onImageCropped: (key, dataUrl) => updateBusinessField(key, dataUrl),
  };

  // Draw only while this module is the open one. (Hooks above keep running either way.)
  if (activeModule !== 'quotations') return null;

    // ----- Update Business Info sub-screen -----
    if (quotationSubView === 'business') {
      const maskIfSet = (val) => (val && val.trim() ? '########' : '—');
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Update Business Info</h1>
            <span style={businessInfoStyles.headerIconBtn} />
          </div>

          <div style={businessInfoStyles.body}>
            <div style={businessInfoStyles.brandRow}>
              <div style={businessInfoStyles.brandTile}>
                {businessInfo.logoImg ? (
                  <img src={businessInfo.logoImg} alt="Logo" style={businessInfoStyles.brandTileImg} />
                ) : (
                  <span style={businessInfoStyles.brandTileText}>ADD<br />LOGO</span>
                )}
                <button type="button" onClick={() => openImageActionSheet('logo')} aria-label="Edit logo" style={businessInfoStyles.brandEditBadge}>
                  <HiOutlinePencil size={13} color="#0F172A" />
                </button>
              </div>
              <div style={businessInfoStyles.brandTile}>
                {businessInfo.signatureImg ? (
                  <img src={businessInfo.signatureImg} alt="Signature" style={businessInfoStyles.brandTileImg} />
                ) : (
                  <span style={businessInfoStyles.brandTileText}>ADD<br />SIGNATURE</span>
                )}
                <button type="button" onClick={() => openImageActionSheet('signature')} aria-label="Edit signature" style={businessInfoStyles.brandEditBadge}>
                  <HiOutlinePencil size={13} color="#0F172A" />
                </button>
              </div>
            </div>

            {/* Hidden file inputs - triggered programmatically from the image action sheet below */}
            <input ref={logoCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('logoImg', e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={logoPhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('logoImg', e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={signatureCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('signatureImg', e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={signaturePhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('signatureImg', e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={qrCodeCameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleBusinessImagePick('qrCodeImg', e.target.files?.[0]); e.target.value = ''; }} />
            <input ref={qrCodePhotoInputRef} type="file" accept="image/*" hidden onChange={(e) => { handleBusinessImagePick('qrCodeImg', e.target.files?.[0]); e.target.value = ''; }} />

            <FieldInput label="Business Name" value={businessInfo.businessName} onChange={(v) => updateBusinessField('businessName', v)} />
            <FieldInput label="Contact Name" value={businessInfo.contactName} onChange={(v) => updateBusinessField('contactName', v)} />
            <FieldInput label="Email" value={businessInfo.email} onChange={(v) => updateBusinessField('email', v)} type="email" error={businessInfoErrors.email} />
            <FieldInput label="Phone Number" value={businessInfo.phone} onChange={(v) => updateBusinessField('phone', v.replace(/\D/g, '').slice(0, 10))} type="tel" error={businessInfoErrors.phone} />
            <FieldInput label="Address Line 1" value={businessInfo.addressLine1} onChange={(v) => updateBusinessField('addressLine1', v)} />
            <FieldInput label="Address Line 2" value={businessInfo.addressLine2} onChange={(v) => updateBusinessField('addressLine2', v)} />
            <FieldInput label="City" value={businessInfo.addressLine3} onChange={(v) => updateBusinessField('addressLine3', v)} />
            <button
              type="button"
              onClick={() => { setStateFieldTarget('business'); setStateSearchQuery(''); setShowStatePicker(true); }}
              style={{ ...businessInfoStyles.fieldBox, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}
            >
              <span style={businessInfoStyles.fieldLabel}>State</span>
              <span style={{ ...businessInfoStyles.fieldInputEl, color: businessInfo.state ? '#0F172A' : '#94A3B8' }}>
                {businessInfo.state ? toTitleCase(businessInfo.state) : 'Select State'}
              </span>
            </button>
            <FieldInput
              label="PIN Code"
              value={businessInfo.pincode || ''}
              onChange={(v) => updateBusinessField('pincode', v.replace(/\D/g, '').slice(0, 6))}
              type="tel"
              error={businessInfoErrors.pincode}
            />
            <FieldInput label="Business Category" value={businessInfo.businessCategory} onChange={(v) => updateBusinessField('businessCategory', v)} />

            <div style={businessInfoStyles.sectionBar}>Tax Details</div>
            <div style={businessInfoStyles.fieldBox}>
              <span style={businessInfoStyles.fieldLabel}>GSTIN/PAN/VAT/Business Label</span>
              <div style={businessInfoStyles.selectRow}>
                <select
                  value={businessInfo.taxLabel}
                  onChange={(e) => updateBusinessField('taxLabel', e.target.value)}
                  style={businessInfoStyles.selectInput}
                >
                  <option value="GSTIN">GSTIN</option>
                  <option value="PAN">PAN</option>
                  <option value="VAT">VAT</option>
                  <option value="Business Label">Business Label</option>
                </select>
                <FiChevronDown size={15} color="#94A3B8" />
              </div>
            </div>
            <FieldInput label="GSTIN/PAN/VAT/Business Number" value={businessInfo.taxNumber} onChange={(v) => updateBusinessField('taxNumber', v)} error={businessInfoErrors.taxNumber} autoCapitalize="characters" />

            <div style={businessInfoStyles.sectionBar}>Payment Instructions - Bank Details</div>
            <div style={businessInfoStyles.bankCard}>
              <div style={businessInfoStyles.bankCardHeaderRow}>
                <button type="button" onClick={() => setIsBankDetailsModalOpen(true)} style={businessInfoStyles.bankCardLabelBtn}>
                  <span style={businessInfoStyles.fieldLabel}>Bank Info</span>
                </button>
                <button type="button" onClick={handleShareBankInfo} aria-label="Share bank info" style={businessInfoStyles.bankShareIconBtn}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
              </div>
              <button type="button" onClick={() => setIsBankDetailsModalOpen(true)} style={businessInfoStyles.bankCardBodyBtn}>
                <span style={businessInfoStyles.bankLine}>Account Holder Name : {maskIfSet(businessInfo.bankAccountName)}</span>
                <span style={businessInfoStyles.bankLine}>Account Number : {maskIfSet(businessInfo.bankAccountNumber)}</span>
                <span style={businessInfoStyles.bankLine}>Bank Name : {maskIfSet(businessInfo.bankName)}</span>
                <span style={businessInfoStyles.bankLine}>IFSC Code : {maskIfSet(businessInfo.ifscCode)}</span>
              </button>
            </div>

            <div style={businessInfoStyles.fieldBox}>
              <span style={businessInfoStyles.fieldLabel}>QR Code</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                {businessInfo.qrCodeImg && (
                  <img src={businessInfo.qrCodeImg} alt="QR Code" style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                )}
                <button
                  type="button"
                  onClick={() => openImageActionSheet('qrCode')}
                  style={{
                    flex: businessInfo.qrCodeImg ? '0 0 auto' : '1 1 auto',
                    padding: businessInfo.qrCodeImg ? '9px 18px' : '11px 18px',
                    borderRadius: '12px', border: '1.5px solid #0F766E', background: businessInfo.qrCodeImg ? '#ffffff' : '#F0FDFA',
                    color: '#0F766E', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {businessInfo.qrCodeImg ? 'Change' : 'Upload'}
                </button>
              </div>
            </div>

            <button type="button" onClick={handleUpdateBusinessInfo} style={businessInfoStyles.updateBtn}>Update</button>
          </div>

          {isBankDetailsModalOpen && (
            <div style={businessInfoStyles.modalOverlay} onClick={handleCloseBankDetailsModal}>
              <div style={businessInfoStyles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={businessInfoStyles.modalHeaderRow}>
                  <h3 style={businessInfoStyles.modalTitle}>Bank Details</h3>
                  <button type="button" onClick={handleCloseBankDetailsModal} style={businessInfoStyles.modalCloseBtn} aria-label="Close">&times;</button>
                </div>
                <FieldInput label="Account Holder Name" value={businessInfo.bankAccountName} onChange={(v) => updateBusinessField('bankAccountName', v)} />
                <FieldInput label="Account Number" value={businessInfo.bankAccountNumber} onChange={(v) => updateBusinessField('bankAccountNumber', v)} type="tel" />
                <FieldInput label="Bank Name" value={businessInfo.bankName} onChange={(v) => updateBusinessField('bankName', v)} />
                <FieldInput
                  label="IFSC Code"
                  value={businessInfo.ifscCode}
                  onChange={(v) => updateBusinessField('ifscCode', v.toUpperCase().slice(0, 11))}
                  error={businessInfoErrors.ifscCode}
                />
                <button type="button" onClick={handleCloseBankDetailsModal} style={businessInfoStyles.modalSaveBtn}>Save</button>
              </div>
            </div>
          )}

          {imageActionSheet && (
            <div style={customerModuleStyles.modalOverlay} onClick={closeImageActionSheet}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                {(() => {
                  const isLogo = imageActionSheet === 'logo';
                  const isQrCode = imageActionSheet === 'qrCode';
                  const isSignature = !isLogo && !isQrCode;
                  const hasImage = isLogo ? !!businessInfo.logoImg : (isQrCode ? !!businessInfo.qrCodeImg : !!businessInfo.signatureImg);
                  const cameraRef = isLogo ? logoCameraInputRef : (isQrCode ? qrCodeCameraInputRef : signatureCameraInputRef);
                  const photoRef = isLogo ? logoPhotoInputRef : (isQrCode ? qrCodePhotoInputRef : signaturePhotoInputRef);
                  const imgSrc = isLogo ? businessInfo.logoImg : (isQrCode ? businessInfo.qrCodeImg : businessInfo.signatureImg);
                  const removeKey = isLogo ? 'logoImg' : (isQrCode ? 'qrCodeImg' : 'signatureImg');
                  return (
                    <>
                      <button type="button" onClick={() => { cameraRef.current?.click(); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                        <FiCamera size={19} color="#334155" />
                        <span>Camera</span>
                      </button>
                      <button type="button" onClick={() => { photoRef.current?.click(); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                        <FiImage size={19} color="#334155" />
                        <span>Photos</span>
                      </button>
                      {isSignature && (
                        <button type="button" onClick={openSignaturePad} style={businessInfoStyles.sheetActionRow}>
                          <FiEdit3 size={19} color="#334155" />
                          <span>Signature Pad</span>
                        </button>
                      )}
                      {hasImage && (
                        <button type="button" onClick={() => { setImageViewerSrc(imgSrc); closeImageActionSheet(); }} style={businessInfoStyles.sheetActionRow}>
                          <FiEye size={19} color="#334155" />
                          <span>View Image</span>
                        </button>
                      )}
                      {hasImage && (
                        <button type="button" onClick={() => handleRemoveBusinessImage(removeKey)} style={{ ...businessInfoStyles.sheetActionRow, borderBottom: 'none', color: '#DC2626' }}>
                          <FiTrash2 size={19} color="#DC2626" />
                          <span>{isSignature ? 'Remove current image' : 'Remove current photo'}</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {isSignaturePadOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsSignaturePadOpen(false)}>
              <div style={{ background: '#ffffff', width: 'calc(100% - 40px)', maxWidth: '460px', borderRadius: '24px', padding: '20px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 12px' }}>Draw Signature</h3>
                <canvas
                  key={signaturePadKey}
                  ref={signatureCanvasRef}
                  width={360}
                  height={180}
                  style={{ width: '100%', height: '180px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', touchAction: 'none', display: 'block' }}
                  onPointerDown={handleSignaturePointerDown}
                  onPointerMove={handleSignaturePointerMove}
                  onPointerUp={handleSignaturePointerUp}
                  onPointerLeave={handleSignaturePointerUp}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button type="button" onClick={handleClearSignaturePad} style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#ffffff', color: '#334155', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
                  <button type="button" onClick={handleSaveSignaturePad} style={businessInfoStyles.modalSaveBtn}>Save</button>
                </div>
              </div>
            </div>
          )}

          {renderImageCropperModal()}

          {imageViewerSrc && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '24px', boxSizing: 'border-box' }} onClick={() => setImageViewerSrc(null)}>
              <img src={imageViewerSrc} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', objectFit: 'contain' }} />
              <button type="button" onClick={() => setImageViewerSrc(null)} aria-label="Close" style={{ position: 'absolute', top: '20px', right: '20px', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
          )}

          {showStatePicker && stateFieldTarget === 'business' && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setShowStatePicker(false)}>
              <div style={{ ...customerModuleStyles.bottomSheet, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>Select State</h3>
                <div style={customerModuleStyles.searchBox}>
                  <FiSearch size={17} color="#94A3B8" />
                  <input
                    type="text"
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    placeholder="Search by Name"
                    style={customerModuleStyles.searchInput}
                    autoFocus
                  />
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredStateList.length === 0 ? (
                    <p style={customerModuleStyles.emptyText}>No matching state found.</p>
                  ) : (
                    filteredStateList.map((s, idx) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { updateBusinessField('state', s); setShowStatePicker(false); setStateSearchQuery(''); }}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', padding: '14px 2px', fontSize: '14.5px', fontWeight: '600', color: '#0F172A',
                          borderBottom: idx < filteredStateList.length - 1 ? '1px solid #E2E8F0' : 'none',
                        }}
                      >
                        {toTitleCase(s)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Settings menu sub-screen -----
    if (quotationSubView === 'settingsMenu') {
      const settingsMenuItems = [
        { key: 'quotationSettings', label: 'Quotation Settings' },
        { key: 'invoiceSettings', label: 'Invoice Settings' },
        { key: 'purchaseOrderSettings', label: 'Purchase Order Settings' },
        { key: 'proformaInvoiceSettings', label: 'Proforma Invoice Settings' },
        { key: 'deliveryNoteSettings', label: 'Delivery Note Settings' },
        { key: 'receiptSettings', label: 'Receipt Settings' },
      ];
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Settings</h1>
            <span style={{ width: '27px', flexShrink: 0 }} />
          </div>

          <div style={{ ...customerModuleStyles.body, padding: '10px 18px 40px' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
              {settingsMenuItems.map((item, idx) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setSettingsReturnView('settingsMenu');
                    if (item.key === 'quotationSettings') setQuotationSubView('quotationSettingsDetail');
                    else if (item.key === 'invoiceSettings') setQuotationSubView('invoiceSettingsDetail');
                    else if (item.key === 'purchaseOrderSettings') setQuotationSubView('purchaseOrderSettingsDetail');
                    else if (item.key === 'proformaInvoiceSettings') setQuotationSubView('proformaInvoiceSettingsDetail');
                    else if (item.key === 'deliveryNoteSettings') setQuotationSubView('deliveryNoteSettingsDetail');
                    else if (item.key === 'receiptSettings') setQuotationSubView('receiptSettingsDetail');
                    else if (item.key === 'columnHeadingSettings') setQuotationSubView('columnHeadingSettingsDetail');
                    else showAlert('Coming soon.');
                  }}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', padding: '17px 18px',
                    borderBottom: idx < settingsMenuItems.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#0F172A', lineHeight: '1.35' }}>{item.label}</span>
                  <FiChevronRight size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Quotation Settings detail sub-screen -----
    if (quotationSubView === 'quotationSettingsDetail') {
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Quotation Settings</h1>
            <span style={businessInfoStyles.headerIconBtn}></span>
          </div>

          <div style={businessInfoStyles.body}>

            <ToggleSwitchRow icon={<FiPercent size={18} color="#1E293B" />} label="GST Display" value={quotationSettings.taxType} onChange={(v) => updateQuotationSettingField('taxType', v)} />
            <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={quotationSettings.showProductHSN} onChange={(v) => updateQuotationSettingField('showProductHSN', v)} />
            <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={quotationSettings.showShippingAddress} onChange={(v) => updateQuotationSettingField('showShippingAddress', v)} />

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Quotation Top Message"
              value={quotationSettings.topMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyQuotationMessageMode('top', opt)}
            />
            {quotationSettings.topMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={3}
                    value={quotationSettings.topMessage}
                    onChange={(e) => updateQuotationSettingField('topMessage', e.target.value)}
                    readOnly={quotationSettings.topMessageMode === 'Default'}
                    placeholder="Enter your custom top message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(quotationSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Quotation Bottom Message"
              value={quotationSettings.bottomMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyQuotationMessageMode('bottom', opt)}
            />
            {quotationSettings.bottomMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={2}
                    value={quotationSettings.bottomMessage}
                    onChange={(e) => updateQuotationSettingField('bottomMessage', e.target.value)}
                    readOnly={quotationSettings.bottomMessageMode === 'Default'}
                    placeholder="Enter your custom bottom message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(quotationSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={quotationSettings.showBankInfo} onChange={(v) => updateQuotationSettingField('showBankInfo', v)} />
            <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={quotationSettings.showUpiInfo} onChange={(v) => updateQuotationSettingField('showUpiInfo', v)} />
            <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={quotationSettings.showSignature} onChange={(v) => updateQuotationSettingField('showSignature', v)} />

            <div style={businessInfoStyles.settingsFooterRow}>
              <button type="button" onClick={handleResetQuotationSettings} style={businessInfoStyles.resetBtn}>Reset</button>
              <button type="button" onClick={handleUpdateQuotationSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Invoice Settings detail sub-screen -----
    if (quotationSubView === 'invoiceSettingsDetail') {
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Invoice Settings</h1>
            <span style={businessInfoStyles.headerIconBtn}></span>
          </div>

          <div style={businessInfoStyles.body}>

            <ToggleSwitchRow icon={<FiPercent size={18} color="#1E293B" />} label="GST Display" value={invoiceSettings.taxType} onChange={(v) => updateInvoiceSettingField('taxType', v)} />
            <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={invoiceSettings.showProductHSN} onChange={(v) => updateInvoiceSettingField('showProductHSN', v)} />
            <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={invoiceSettings.showShippingAddress} onChange={(v) => updateInvoiceSettingField('showShippingAddress', v)} />

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Invoice Top Message"
              value={invoiceSettings.topMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyInvoiceMessageMode('top', opt)}
            />
            {invoiceSettings.topMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={3}
                    value={invoiceSettings.topMessage}
                    onChange={(e) => updateInvoiceSettingField('topMessage', e.target.value)}
                    readOnly={invoiceSettings.topMessageMode === 'Default'}
                    placeholder="Enter your custom top message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(invoiceSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Invoice Bottom Message"
              value={invoiceSettings.bottomMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyInvoiceMessageMode('bottom', opt)}
            />
            {invoiceSettings.bottomMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={2}
                    value={invoiceSettings.bottomMessage}
                    onChange={(e) => updateInvoiceSettingField('bottomMessage', e.target.value)}
                    readOnly={invoiceSettings.bottomMessageMode === 'Default'}
                    placeholder="Enter your custom bottom message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(invoiceSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={invoiceSettings.showBankInfo} onChange={(v) => updateInvoiceSettingField('showBankInfo', v)} />
            <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={invoiceSettings.showUpiInfo} onChange={(v) => updateInvoiceSettingField('showUpiInfo', v)} />
            <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={invoiceSettings.showSignature} onChange={(v) => updateInvoiceSettingField('showSignature', v)} />

            <div style={businessInfoStyles.settingsFooterRow}>
              <button type="button" onClick={handleResetInvoiceSettings} style={businessInfoStyles.resetBtn}>Reset</button>
              <button type="button" onClick={handleUpdateInvoiceSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Purchase Order Settings detail sub-screen -----
    if (quotationSubView === 'purchaseOrderSettingsDetail') {
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Purchase Order Settings</h1>
            <span style={businessInfoStyles.headerIconBtn}></span>
          </div>

          <div style={businessInfoStyles.body}>

            <ToggleSwitchRow icon={<FiPercent size={18} color="#1E293B" />} label="GST Display" value={purchaseOrderSettings.taxType} onChange={(v) => updatePurchaseOrderSettingField('taxType', v)} />
            <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={purchaseOrderSettings.showProductHSN} onChange={(v) => updatePurchaseOrderSettingField('showProductHSN', v)} />
            <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={purchaseOrderSettings.showShippingAddress} onChange={(v) => updatePurchaseOrderSettingField('showShippingAddress', v)} />

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Purchase Order Top Message"
              value={purchaseOrderSettings.topMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyPurchaseOrderMessageMode('top', opt)}
            />
            {purchaseOrderSettings.topMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={3}
                    value={purchaseOrderSettings.topMessage}
                    onChange={(e) => updatePurchaseOrderSettingField('topMessage', e.target.value)}
                    readOnly={purchaseOrderSettings.topMessageMode === 'Default'}
                    placeholder="Enter your custom top message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(purchaseOrderSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <SegmentedModeRow
              icon={<FiCreditCard size={18} color="#1E293B" />}
              label="Purchase Order Bottom Message"
              value={purchaseOrderSettings.bottomMessageMode || 'Default'}
              options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
              onChange={(opt) => applyPurchaseOrderMessageMode('bottom', opt)}
            />
            {purchaseOrderSettings.bottomMessageMode !== 'Hide' && (
              <div style={quotationSettingsStyles.row}>
                <span style={quotationSettingsStyles.rowIcon} />
                <span style={quotationSettingsStyles.rowBody}>
                  <textarea
                    rows={2}
                    value={purchaseOrderSettings.bottomMessage}
                    onChange={(e) => updatePurchaseOrderSettingField('bottomMessage', e.target.value)}
                    readOnly={purchaseOrderSettings.bottomMessageMode === 'Default'}
                    placeholder="Enter your custom bottom message"
                    style={{
                      ...quotationSettingsStyles.textareaEl,
                      ...(purchaseOrderSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
                    }}
                  />
                </span>
              </div>
            )}

            <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={purchaseOrderSettings.showBankInfo} onChange={(v) => updatePurchaseOrderSettingField('showBankInfo', v)} />
            <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={purchaseOrderSettings.showUpiInfo} onChange={(v) => updatePurchaseOrderSettingField('showUpiInfo', v)} />
            <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={purchaseOrderSettings.showSignature} onChange={(v) => updatePurchaseOrderSettingField('showSignature', v)} />

            <div style={businessInfoStyles.settingsFooterRow}>
              <button type="button" onClick={handleResetPurchaseOrderSettings} style={businessInfoStyles.resetBtn}>Reset</button>
              <button type="button" onClick={handleUpdatePurchaseOrderSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Proforma Invoice Settings detail sub-screen -----
    // ----- Proforma Invoice Settings detail sub-screen -----
if (quotationSubView === 'proformaInvoiceSettingsDetail') {
return (
  <div style={businessInfoStyles.screen}>
    <div style={businessInfoStyles.header}>
      <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
        <FiArrowLeft size={19} color="#ffffff" />
      </button>
      <h1 style={businessInfoStyles.headerTitle}>Proforma Invoice Settings</h1>
      <span style={businessInfoStyles.headerIconBtn}></span>
    </div>

    <div style={businessInfoStyles.body}>

      <ToggleSwitchRow icon={<FiPercent size={18} color="#1E293B" />} label="GST Display" value={proformaInvoiceSettings.taxType} onChange={(v) => updateProformaInvoiceSettingField('taxType', v)} />
      <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={proformaInvoiceSettings.showProductHSN} onChange={(v) => updateProformaInvoiceSettingField('showProductHSN', v)} />
      <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={proformaInvoiceSettings.showShippingAddress} onChange={(v) => updateProformaInvoiceSettingField('showShippingAddress', v)} />

      <SegmentedModeRow
        icon={<FiCreditCard size={18} color="#1E293B" />}
        label="Proforma Invoice Top Message"
        value={proformaInvoiceSettings.topMessageMode || 'Default'}
        options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
        onChange={(opt) => applyProformaInvoiceMessageMode('top', opt)}
      />
      {proformaInvoiceSettings.topMessageMode !== 'Hide' && (
        <div style={quotationSettingsStyles.row}>
          <span style={quotationSettingsStyles.rowIcon} />
          <span style={quotationSettingsStyles.rowBody}>
            <textarea
              rows={3}
              value={proformaInvoiceSettings.topMessage}
              onChange={(e) => updateProformaInvoiceSettingField('topMessage', e.target.value)}
              readOnly={proformaInvoiceSettings.topMessageMode === 'Default'}
              placeholder="Enter your custom top message"
              style={{
                ...quotationSettingsStyles.textareaEl,
                ...(proformaInvoiceSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
              }}
            />
          </span>
        </div>
      )}

      <SegmentedModeRow
        icon={<FiCreditCard size={18} color="#1E293B" />}
        label="Proforma Invoice Bottom Message"
        value={proformaInvoiceSettings.bottomMessageMode || 'Default'}
        options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
        onChange={(opt) => applyProformaInvoiceMessageMode('bottom', opt)}
      />
      {proformaInvoiceSettings.bottomMessageMode !== 'Hide' && (
        <div style={quotationSettingsStyles.row}>
          <span style={quotationSettingsStyles.rowIcon} />
          <span style={quotationSettingsStyles.rowBody}>
            <textarea
              rows={2}
              value={proformaInvoiceSettings.bottomMessage}
              onChange={(e) => updateProformaInvoiceSettingField('bottomMessage', e.target.value)}
              readOnly={proformaInvoiceSettings.bottomMessageMode === 'Default'}
              placeholder="Enter your custom bottom message"
              style={{
                ...quotationSettingsStyles.textareaEl,
                ...(proformaInvoiceSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
              }}
            />
          </span>
        </div>
      )}

      <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={proformaInvoiceSettings.showBankInfo} onChange={(v) => updateProformaInvoiceSettingField('showBankInfo', v)} />
      <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={proformaInvoiceSettings.showUpiInfo} onChange={(v) => updateProformaInvoiceSettingField('showUpiInfo', v)} />
      <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={proformaInvoiceSettings.showSignature} onChange={(v) => updateProformaInvoiceSettingField('showSignature', v)} />

      <div style={businessInfoStyles.settingsFooterRow}>
        <button type="button" onClick={handleResetProformaInvoiceSettings} style={businessInfoStyles.resetBtn}>Reset</button>
        <button type="button" onClick={handleUpdateProformaInvoiceSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
      </div>
    </div>

    <AppPopup
      open={!!appPopup?.open}
      tone={appPopup?.tone}
      title={appPopup?.title}
      message={appPopup?.message}
      confirmLabel={appPopup?.confirmLabel}
      cancelLabel={appPopup?.cancelLabel}
      onConfirm={appPopup?.onConfirm || closeAppPopup}
      onCancel={closeAppPopup}
      onClose={closeAppPopup}
    />
  </div>
);
}

    // ----- Delivery Note Settings detail sub-screen -----
    // ----- Delivery Note Settings detail sub-screen -----
if (quotationSubView === 'deliveryNoteSettingsDetail') {
return (
  <div style={businessInfoStyles.screen}>
    <div style={businessInfoStyles.header}>
      <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
        <FiArrowLeft size={19} color="#ffffff" />
      </button>
      <h1 style={businessInfoStyles.headerTitle}>Delivery Note Settings</h1>
      <span style={businessInfoStyles.headerIconBtn}></span>
    </div>

    <div style={businessInfoStyles.body}>

      <ToggleSwitchRow icon={<FiTag size={18} color="#1E293B" />} label="Product HSN Display" value={deliveryNoteSettings.showProductHSN} onChange={(v) => updateDeliveryNoteSettingField('showProductHSN', v)} />
      <ToggleSwitchRow icon={<FiTruck size={18} color="#1E293B" />} label="Shipping Address Display" value={deliveryNoteSettings.showShippingAddress} onChange={(v) => updateDeliveryNoteSettingField('showShippingAddress', v)} />

      <SegmentedModeRow
        icon={<FiCreditCard size={18} color="#1E293B" />}
        label="Delivery Note Top Message"
        value={deliveryNoteSettings.topMessageMode || 'Default'}
        options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
        onChange={(opt) => applyDeliveryNoteMessageMode('top', opt)}
      />
      {deliveryNoteSettings.topMessageMode !== 'Hide' && (
        <div style={quotationSettingsStyles.row}>
          <span style={quotationSettingsStyles.rowIcon} />
          <span style={quotationSettingsStyles.rowBody}>
            <textarea
              rows={3}
              value={deliveryNoteSettings.topMessage}
              onChange={(e) => updateDeliveryNoteSettingField('topMessage', e.target.value)}
              readOnly={deliveryNoteSettings.topMessageMode === 'Default'}
              placeholder="Enter your custom top message"
              style={{
                ...quotationSettingsStyles.textareaEl,
                ...(deliveryNoteSettings.topMessageMode === 'Default' ? { color: '#64748B' } : {}),
              }}
            />
          </span>
        </div>
      )}

      <SegmentedModeRow
        icon={<FiCreditCard size={18} color="#1E293B" />}
        label="Delivery Note Bottom Message"
        value={deliveryNoteSettings.bottomMessageMode || 'Default'}
        options={[{ value: 'Default', label: 'Default' }, { value: 'Customize', label: 'Custom' }, { value: 'Hide', label: 'Hide' }]}
        onChange={(opt) => applyDeliveryNoteMessageMode('bottom', opt)}
      />
      {deliveryNoteSettings.bottomMessageMode !== 'Hide' && (
        <div style={quotationSettingsStyles.row}>
          <span style={quotationSettingsStyles.rowIcon} />
          <span style={quotationSettingsStyles.rowBody}>
            <textarea
              rows={2}
              value={deliveryNoteSettings.bottomMessage}
              onChange={(e) => updateDeliveryNoteSettingField('bottomMessage', e.target.value)}
              readOnly={deliveryNoteSettings.bottomMessageMode === 'Default'}
              placeholder="Enter your custom bottom message"
              style={{
                ...quotationSettingsStyles.textareaEl,
                ...(deliveryNoteSettings.bottomMessageMode === 'Default' ? { color: '#64748B' } : {}),
              }}
            />
          </span>
        </div>
      )}

      <ToggleSwitchRow icon={<HiOutlineBuildingOffice2 size={18} color="#1E293B" />} label="Payment- Bank Info" value={deliveryNoteSettings.showBankInfo} onChange={(v) => updateDeliveryNoteSettingField('showBankInfo', v)} />
      <ToggleSwitchRow icon={<span style={{ fontSize: '10.5px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.3px' }}>UPI</span>} label="QR Code Display" value={deliveryNoteSettings.showUpiInfo} onChange={(v) => updateDeliveryNoteSettingField('showUpiInfo', v)} />
      <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={deliveryNoteSettings.showSignature} onChange={(v) => updateDeliveryNoteSettingField('showSignature', v)} />

      <div style={businessInfoStyles.settingsFooterRow}>
        <button type="button" onClick={handleResetDeliveryNoteSettings} style={businessInfoStyles.resetBtn}>Reset</button>
        <button type="button" onClick={handleUpdateDeliveryNoteSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
      </div>
    </div>

    <AppPopup
      open={!!appPopup?.open}
      tone={appPopup?.tone}
      title={appPopup?.title}
      message={appPopup?.message}
      confirmLabel={appPopup?.confirmLabel}
      cancelLabel={appPopup?.cancelLabel}
      onConfirm={appPopup?.onConfirm || closeAppPopup}
      onCancel={closeAppPopup}
      onClose={closeAppPopup}
    />
  </div>
);
}
    // ----- Receipt Settings detail sub-screen -----
    if (quotationSubView === 'receiptSettingsDetail') {
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(settingsReturnView)} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Receipt Settings</h1>
            <span style={businessInfoStyles.headerIconBtn}></span>
          </div>

          <div style={businessInfoStyles.body}>

            <ToggleSwitchRow icon={<HiOutlinePencil size={18} color="#1E293B" />} label="Signature Display" value={receiptSettings.showSignature} onChange={(v) => updateReceiptSettingField('showSignature', v)} />

            <div style={{ marginTop: '4px' }}>
              <button type="button" onClick={handleUpdateReceiptSettings} style={businessInfoStyles.updateBtn}>Update</button>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Column Heading Settings detail sub-screen -----
    if (quotationSubView === 'columnHeadingSettingsDetail') {
      return (
        <div style={businessInfoStyles.screen}>
          <div style={businessInfoStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('settingsMenu')} aria-label="Back" style={businessInfoStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={businessInfoStyles.headerTitle}>Column Heading</h1>
            <span style={businessInfoStyles.headerIconBtn}></span>
          </div>

          <div style={businessInfoStyles.body}>
            <div style={quotationSettingsStyles.row}>
              <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
              <span style={quotationSettingsStyles.rowBody}>
                <span style={quotationSettingsStyles.rowLabel}>Tax Label</span>
                <input
                  type="text"
                  value={columnHeadingSettings.taxLabel}
                  onChange={(e) => updateColumnHeadingSettingField('taxLabel', e.target.value)}
                  style={quotationSettingsStyles.inputEl}
                />
              </span>
            </div>

            <div style={quotationSettingsStyles.row}>
              <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
              <span style={quotationSettingsStyles.rowBody}>
                <span style={quotationSettingsStyles.rowLabel}>Product HSN Label</span>
                <input
                  type="text"
                  value={columnHeadingSettings.hsnLabel}
                  onChange={(e) => updateColumnHeadingSettingField('hsnLabel', e.target.value)}
                  style={quotationSettingsStyles.inputEl}
                />
              </span>
            </div>

            <div style={quotationSettingsStyles.row}>
              <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
              <span style={quotationSettingsStyles.rowBody}>
                <span style={quotationSettingsStyles.rowLabel}>Other Charges Label</span>
                <input
                  type="text"
                  value={columnHeadingSettings.otherChargesLabel}
                  onChange={(e) => updateColumnHeadingSettingField('otherChargesLabel', e.target.value)}
                  style={quotationSettingsStyles.inputEl}
                />
              </span>
            </div>

            <div style={{ ...quotationSettingsStyles.row, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={quotationSettingsStyles.rowIcon}><FiTag size={18} color="#1E293B" /></span>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#1E293B' }}>Add QTY2 Column?</span>
              </span>
              <button
                type="button"
                onClick={() => updateColumnHeadingSettingField('showQty2Column', !columnHeadingSettings.showQty2Column)}
                aria-label="Toggle Add QTY2 Column"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  width: '76px', height: '32px', borderRadius: '16px',
                  border: '1.5px solid #0F172A', background: '#ffffff',
                  padding: '2px', cursor: 'pointer', flexShrink: 0,
                  justifyContent: columnHeadingSettings.showQty2Column ? 'flex-end' : 'flex-start',
                  fontFamily: 'inherit',
                }}
              >
                {!columnHeadingSettings.showQty2Column && (
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A', flex: 1, textAlign: columnHeadingSettings.showQty2Column ? 'right' : 'left', paddingRight: columnHeadingSettings.showQty2Column ? '4px' : 0, paddingLeft: columnHeadingSettings.showQty2Column ? 0 : '2px' }}>
                  {columnHeadingSettings.showQty2Column ? 'YES' : 'NO'}
                </span>
                {columnHeadingSettings.showQty2Column && (
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0F172A', flexShrink: 0 }} />
                )}
              </button>
            </div>

            <div style={businessInfoStyles.settingsFooterRow}>
              <button type="button" onClick={handleResetColumnHeadingSettings} style={businessInfoStyles.resetBtn}>Reset</button>
              <button type="button" onClick={handleUpdateColumnHeadingSettings} style={businessInfoStyles.updateBtnHalf}>Update</button>
            </div>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Customer List sub-screen -----
    if (quotationSubView === 'customerList') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Customer List</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => openEditCustomer(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={openAddCustomer} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add / Edit Customer sub-screen -----
    if (quotationSubView === 'addCustomer') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => requestQuotationLeave()} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Name"
              type="text"
              value={customerForm.name}
              onChange={(e) => updateCustomerField('name', e.target.value)}
              rightElement={
                <ContactPickButton
                  ariaLabel="Pick customer from contacts"
                  onPick={({ name, phone, email }) => {
                    if (name) updateCustomerField('name', name);
                    if (phone) {
                      updateCustomerField('mobile', phone);
                      if (customerMobileError) setCustomerMobileError(false);
                    }
                    if (email) {
                      updateCustomerField('email', email);
                      if (customerEmailError) setCustomerEmailError(false);
                    }
                  }}
                />
              }
            />

            <LabeledField
              label="Company Name"
              type="text"
              value={customerForm.companyName}
              onChange={(e) => updateCustomerField('companyName', e.target.value)}
            />
            <LabeledField
              label="Email"
              type="email"
              value={customerForm.email}
              onChange={(e) => {
                updateCustomerField('email', e.target.value);
                if (customerEmailError) setCustomerEmailError(false);
              }}
              error={customerEmailError ? 'Enter a valid email address' : null}
            />
            <LabeledField
              label="Mobile"
              type="tel"
              value={customerForm.mobile}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateCustomerField('mobile', digits);
                if (customerMobileError) setCustomerMobileError(false);
              }}
              error={customerMobileError ? 'Enter a valid 10-digit mobile number' : null}
            />
            <LabeledField
              label="Address Line 1"
              type="text"
              value={customerForm.addressLine1}
              onChange={(e) => updateCustomerField('addressLine1', e.target.value)}
            />
            <LabeledField
              label="Address Line 2"
              type="text"
              value={customerForm.addressLine2}
              onChange={(e) => updateCustomerField('addressLine2', e.target.value)}
            />
            <LabeledField
              label="City"
              type="text"
              value={customerForm.addressLine3}
              onChange={(e) => updateCustomerField('addressLine3', e.target.value)}
            />
            <LabeledField
              label="State"
              as="button"
              onClick={() => { setStateFieldTarget('customer'); setStateSearchQuery(''); setShowStatePicker(true); }}
              inputStyle={{ color: customerForm.state ? '#0F172A' : '#94A3B8' }}
            >
              {customerForm.state ? toTitleCase(customerForm.state) : 'Select State'}
            </LabeledField>
            <LabeledField
              label="PIN Code"
              type="text"
              inputMode="numeric"
              value={customerForm.pincode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                updateCustomerField('pincode', digits);
                if (customerPincodeError) setCustomerPincodeError(false);
              }}
              error={customerPincodeError ? 'Enter a valid 6-digit PIN code' : null}
            />
            <LabeledField
              label="GST Number"
              type="text"
              value={customerForm.gstin}
              onChange={(e) => {
                updateCustomerField('gstin', e.target.value);
                if (customerGstinError) setCustomerGstinError(false);
              }}
              error={customerGstinError ? 'Enter a valid GST number' : null}
              autoCapitalize="characters"
            />

            <div style={customerModuleStyles.sectionBar}>Shipping Details</div>
            <div style={customerModuleStyles.taxableRow}>
              <span style={customerModuleStyles.sheetSmallLabelInline}>Same as Above</span>
              <input
                type="checkbox"
                checked={customerForm.shippingSameAsBilling}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCustomerForm((prev) => ({
                    ...prev,
                    shippingSameAsBilling: checked,
                    ...(checked ? {
                      shippingAddressLine1: prev.addressLine1,
                      shippingAddressLine2: prev.addressLine2,
                      shippingCity: prev.addressLine3,
                      shippingState: prev.state,
                      shippingPincode: prev.pincode,
                    } : {
                      // Unchecking should give the user a blank slate to type their own
                      // shipping address into, not leave it pre-filled with whatever was
                      // just copied over from the billing address.
                      shippingAddressLine1: '',
                      shippingAddressLine2: '',
                      shippingCity: '',
                      shippingState: '',
                      shippingPincode: '',
                    }),
                  }));
                  if (checked) setCustomerShippingPincodeError(false);
                }}
                style={customerModuleStyles.checkbox}
              />
            </div>

            {!customerForm.shippingSameAsBilling && (
              <>
                <LabeledField
                  label="Shipping Address Line 1"
                  type="text"
                  value={customerForm.shippingAddressLine1}
                  onChange={(e) => updateCustomerField('shippingAddressLine1', e.target.value)}
                />
                <LabeledField
                  label="Shipping Address Line 2"
                  type="text"
                  value={customerForm.shippingAddressLine2}
                  onChange={(e) => updateCustomerField('shippingAddressLine2', e.target.value)}
                />
                <LabeledField
                  label="Shipping City"
                  type="text"
                  value={customerForm.shippingCity}
                  onChange={(e) => updateCustomerField('shippingCity', e.target.value)}
                />
                <LabeledField
                  label="Shipping State"
                  as="button"
                  onClick={() => { setStateFieldTarget('customerShipping'); setStateSearchQuery(''); setShowStatePicker(true); }}
                  inputStyle={{ color: customerForm.shippingState ? '#0F172A' : '#94A3B8' }}
                >
                  {customerForm.shippingState ? toTitleCase(customerForm.shippingState) : 'Select State'}
                </LabeledField>
                <LabeledField
                  label="Shipping PIN Code"
                  type="text"
                  inputMode="numeric"
                  value={customerForm.shippingPincode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    updateCustomerField('shippingPincode', digits);
                    if (customerShippingPincodeError) setCustomerShippingPincodeError(false);
                  }}
                  error={customerShippingPincodeError ? 'Enter a valid 6-digit PIN code' : null}
                />
              </>
            )}

            <button
              type="button"
              onClick={handleSaveCustomer}
              disabled={isSavingCustomer}
              style={{ ...customerModuleStyles.addBtn, cursor: isSavingCustomer ? 'default' : 'pointer', opacity: isSavingCustomer ? 0.7 : 1 }}
            >
              {isSavingCustomer ? 'Saving...' : (editingCustomerId ? 'Update' : 'Add')}
            </button>
          </div>

          {showStatePicker && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setShowStatePicker(false)}>
              <div style={{ ...customerModuleStyles.bottomSheet, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>Select State</h3>
                <div style={customerModuleStyles.searchBox}>
                  <FiSearch size={17} color="#94A3B8" />
                  <input
                    type="text"
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    placeholder="Search by Name"
                    style={customerModuleStyles.searchInput}
                    autoFocus
                  />
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredStateList.length === 0 ? (
                    <p style={customerModuleStyles.emptyText}>No matching state found.</p>
                  ) : (
                    filteredStateList.map((s, idx) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          if (stateFieldTarget === 'business') updateBusinessField('state', s);
                          else if (stateFieldTarget === 'customerShipping') updateCustomerField('shippingState', s);
                          else updateCustomerField('state', s);
                          setShowStatePicker(false);
                          setStateSearchQuery('');
                        }}
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', padding: '14px 2px', fontSize: '14.5px', fontWeight: '600', color: '#0F172A',
                          borderBottom: idx < filteredStateList.length - 1 ? '1px solid #E2E8F0' : 'none',
                        }}
                      >
                        {toTitleCase(s)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Product List sub-screen -----
    if (quotationSubView === 'productList') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Product List</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <div
                  key={product.id}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                      <button type="button" onClick={() => openEditProduct(product)} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit product">
                        <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={15} color="#475569" /></span>
                        <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(product)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete product">
                        <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={15} color="#DC2626" /></span>
                        <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                      </button>
                    </div>
                  </div>
                  {(product.price || product.gst) && (
                    <button type="button" onClick={() => openEditProduct(product)} style={{ ...customerModuleStyles.selectRowBtn, display: 'block' }}>
                      <div style={customerModuleStyles.productDetailRow}>
                        {product.price && (
                          <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                        )}
                        {product.price && product.gst && (
                          <span style={customerModuleStyles.productDetailDivider}>|</span>
                        )}
                        {product.gst && (
                          <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct()} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add / Edit Product sub-screen -----
    if (quotationSubView === 'addProduct') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => requestQuotationLeave()} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingProductId ? 'Edit Product' : 'Add Product'}</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={customerModuleStyles.formBody}>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => updateProductField('name', e.target.value)}
              placeholder="Product Name"
              style={customerModuleStyles.fieldInput}
            />
            <input
              type="number"
              value={productForm.price}
              onChange={(e) => updateProductField('price', e.target.value)}
              placeholder="Price"
              style={customerModuleStyles.fieldInput}
            />
            <div style={customerModuleStyles.suffixFieldWrap}>
              <input
                type="number"
                value={productForm.gst}
                onChange={(e) => { updateProductField('gst', e.target.value); if (productGstError) setProductGstError(false); }}
                placeholder="GST"
                style={{ ...customerModuleStyles.fieldInput, paddingRight: '38px', ...(productGstError ? { border: '1.5px solid #DC2626' } : null) }}
              />
              <span style={customerModuleStyles.suffixFieldIcon}>%</span>
            </div>
            {productGstError && <p style={customerModuleStyles.fieldErrorText}>Enter a valid GST percentage (0-100)</p>}
            <div>
              <textarea
                value={productForm.description}
                onChange={(e) => updateProductField('description', e.target.value.slice(0, 2000))}
                placeholder="Description"
                maxLength={2000}
                style={customerModuleStyles.descriptionTextarea}
              />
              <div style={customerModuleStyles.charCount}>{productForm.description.length}/2000</div>
            </div>
            <input
              type="text"
              value={productForm.unit}
              onChange={(e) => updateProductField('unit', e.target.value)}
              placeholder="Unit Of Measure(SET, KG etc.)"
              style={customerModuleStyles.fieldInput}
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={productForm.hsn}
              onChange={(e) => { updateProductField('hsn', e.target.value.replace(/\D/g, '').slice(0, 8)); if (productHsnError) setProductHsnError(false); }}
              placeholder="HSN"
              style={{ ...customerModuleStyles.fieldInput, ...(productHsnError ? { border: '1.5px solid #DC2626' } : null) }}
            />
            {productHsnError && <p style={customerModuleStyles.fieldErrorText}>Enter a valid HSN code (4, 6, or 8 digits)</p>}

            <button type="button" onClick={handleSaveProduct} style={{ ...customerModuleStyles.addBtn, marginTop: '18px' }}>
              {editingProductId ? 'Update' : 'Add'}
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Customer sub-screen (used from Make Quotation) -----
    if (quotationSubView === 'selectCustomerForQuotation') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForQuotation(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForQuotation')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForQuotation')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add Quotation Product sub-screen (Product / Quantity / Price / Description) -----
    if (quotationSubView === 'addQuotationProductLine') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingQuotationProductLineId ? 'Edit Quotation Product' : 'Add Quotation Product'}</h1>
            <button type="button" onClick={openPickProductForQuotationLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
              <FiSearch size={19} color="#ffffff" />
            </button>
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Product"
              as="button"
              onClick={openPickProductForQuotationLine}
              rightElement={<FiChevronRight size={18} color="#94A3B8" />}
            >
              {quotationProductLineForm.name || 'Select Product'}
            </LabeledField>

            <LabeledField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="1"
              value={quotationProductLineForm.qty}
              onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
            />

            <LabeledField
              label="Price"
              type="number"
              inputMode="decimal"
              value={quotationProductLineForm.price}
              onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
            />

            <div>
              <LabeledField
                label="Description"
                as="textarea"
                value={quotationProductLineForm.description}
                onChange={(e) => setQuotationProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                maxLength={2000}
              />
              <div style={customerModuleStyles.charCount}>{quotationProductLineForm.description.length}/2000</div>
            </div>

            <button type="button" onClick={handleAddQuotationProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
              Add To Quotation
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Pick Product sub-screen (choosing which product to add to a Quotation line) -----
    if (quotationSubView === 'pickProductForQuotationLine') {
      return (
        <div style={{ ...customerModuleStyles.screen}}>
          <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProductForQuotationLine(product)}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <FiChevronRight size={18} color="#94A3B8" />
                  </div>
                  {(product.price !== undefined && product.price !== '') || (product.gst !== undefined && product.gst !== '') ? (
                    <div style={customerModuleStyles.productDetailRow}>
                      {product.price !== undefined && product.price !== '' && (
                        <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                      )}
                      {product.price !== undefined && product.price !== '' && product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailDivider}>|</span>
                      )}
                      {product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct('pickProductForQuotationLine')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }


    // ----- Select Terms and Conditions sub-screen (used from Make Quotation) -----
    if (quotationSubView === 'selectTermsForQuotation') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeQuotation')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
            <button type="button" onClick={() => openAddTermsModal('quotation')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={customerModuleStyles.termsTabRow}>
            <span style={customerModuleStyles.termsTabActive}>Quotation</span>
          </div>

          <div style={customerModuleStyles.body}>
            {quotationTerms.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
            ) : (
              quotationTerms.map((term) => {
                const selected = termsDraftSelectedIds.includes(term.id);
                return (
                  <div
                    key={term.id}
                    style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTermsDraftSelection(term.id)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                    >
                      {term.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTermsModal(term, 'quotation')}
                      aria-label="Edit term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#0F766E' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiEdit3 size={16} color="#0F766E" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(term, 'quotation')}
                      aria-label="Delete term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={16} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneSelectTerms} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isAddTermsModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingTermId ? 'Edit Terms and condition' : 'Add Terms and condition'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Quotation</div>
                <textarea
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder="Terms and condition"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingTermId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Quotation sub-screen -----
    if (quotationSubView === 'makeQuotation') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingQuotationId ? 'Update Quotation' : 'Make Quotation'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makeQuotation'); setQuotationSubView('quotationSettingsDetail'); }}
              aria-label="Quotation Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={makeQuotationStyles.infoRow}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Quotation Date</span>
                  <div style={makeQuotationStyles.infoValue}>{quotationForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Quotation No</span>
                  <div style={makeQuotationStyles.infoValue}>{quotationForm.quotationNo || '-'}</div>
                </div>
              </div>
              <div style={makeQuotationStyles.otherInfoRow}>
                <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                <input
                  type="text"
                  value={quotationForm.otherInfo}
                  onChange={(e) => setQuotationForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                  style={makeQuotationStyles.otherInfoInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={editingQuotationId && selectedQuotationCustomer ? undefined : openSelectCustomerForQuotation}
              disabled={!!(editingQuotationId && selectedQuotationCustomer)}
              style={{ ...makeQuotationStyles.sectionCard, ...(editingQuotationId && selectedQuotationCustomer ? { cursor: 'default' } : {}) }}
            >
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                {!(editingQuotationId && selectedQuotationCustomer) && (
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                )}
              </div>
              {selectedQuotationCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedQuotationCustomer.name}</p>
                  {selectedQuotationCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedQuotationCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <div style={makeQuotationStyles.sectionCard}>
              <div
                role="button"
                tabIndex={0}
                onClick={openPickProductForQuotationLine}
                style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
              >
                <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {quotationForm.products.length > 0 && (
                <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                  {quotationForm.products.map((p) => {
                    const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                    const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                    const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    return (
                      <div
                        key={p.productId}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditQuotationProductLine(p)}
                        style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                              <FiEdit3 size={14} color="#0F766E" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeQuotationProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                          <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={openOtherChargeModal} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {quotationForm.otherCharges.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {quotationForm.otherCharges.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditOtherChargeModal(c); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{c.label}{c.taxable && c.gstPercent > 0 ? ` (GST ${c.gstPercent}%)` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeQuotationOtherCharge(c.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${c.label}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openSelectTermsForQuotation} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedQuotationTerms.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {selectedQuotationTerms.map((term) => (
                    <div key={term.id} style={makeQuotationStyles.lineRow}>
                      <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeQuotationSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div style={makeQuotationStyles.bottomBar}>
            <div>
              <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
              <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{quotationAmountDue}</div>
            </div>
            <button type="button" onClick={handleGenerateQuotation} disabled={isSavingQuotation} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingQuotation ? 'default' : 'pointer', opacity: isSavingQuotation ? 0.7 : 1 }}>{isSavingQuotation ? 'Saving...' : (editingQuotationId ? 'Update' : 'Generate')}</button>
          </div>

          {isOtherChargeModalOpen && (
<div style={customerModuleStyles.modalOverlay} onClick={() => setIsOtherChargeModalOpen(false)}>
  <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
    <div style={customerModuleStyles.sheetHandle} />
    <h3 style={customerModuleStyles.sheetTitle}>{editingOtherChargeId ? 'Edit Other Charge' : 'Other Charge Info'}</h3>
    <span style={customerModuleStyles.sheetSmallLabel}>Charge Name</span>
    <input
      type="text"
      value={otherChargeForm.label}
      onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
      placeholder="Other Charges"
      style={customerModuleStyles.fieldInput}
    />
    <input
      type="number"
      value={otherChargeForm.amount}
      onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
      placeholder="Other Charge Amount"
      style={customerModuleStyles.fieldInput}
    />
    <div style={customerModuleStyles.taxableRow}>
      <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
      <input
        type="checkbox"
        checked={otherChargeForm.taxable}
        onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
        style={customerModuleStyles.checkbox}
      />
    </div>
    {otherChargeForm.taxable && (
      <>
        <span style={customerModuleStyles.sheetSmallLabel}>Tax %</span>
        <input
          type="number"
          value={otherChargeForm.gstPercent}
          onChange={(e) => setOtherChargeForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
          placeholder="Tax Percentage"
          style={customerModuleStyles.fieldInput}
        />
        {/* Tax preview */}
        {otherChargeForm.amount && Number(otherChargeForm.amount) > 0 && 
         otherChargeForm.gstPercent && Number(otherChargeForm.gstPercent) > 0 && (
          <div style={{ 
            background: '#F1F5F9', 
            borderRadius: '10px', 
            padding: '12px', 
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Tax Amount ({otherChargeForm.gstPercent}%)
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
              ₹{(Number(otherChargeForm.amount) * Number(otherChargeForm.gstPercent) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {otherChargeForm.amount && Number(otherChargeForm.amount) > 0 && 
         otherChargeForm.gstPercent && Number(otherChargeForm.gstPercent) > 0 && (
          <div style={{ 
            background: '#ECFDF5', 
            borderRadius: '10px', 
            padding: '12px', 
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#065F46' }}>
              Total (including tax)
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#065F46' }}>
              ₹{(Number(otherChargeForm.amount) * (1 + Number(otherChargeForm.gstPercent) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </>
    )}
    <button type="button" onClick={handleSaveOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingOtherChargeId ? 'Update' : 'Save'}</button>
  </div>
</div>
)}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Quotation List sub-screen (Matches Screenshot 1) -----
    if (quotationSubView === 'quotationList') {
      const searchQuotation = (q) => {
        const qs = quotationSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return q.customerName.toLowerCase().includes(qs) || 
               (q.quotationNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Quotation</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={quotationSearchQuery}
                onChange={(e) => setQuotationSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Quotation#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {quotations.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>No quotations generated yet.</p>
            ) : (
              sortDocumentsByCreated(quotations.filter(searchQuotation)).map((q) => (
                <DocumentListCard
                  key={q.id}
                  onClick={() => { setSelectedQuotationId(q.id); setQuotationSubView('quotationDetail'); }}
                  name={q.customerName}
                  docNumber={q.quotationNo || 'Quote-' + q.id.slice(0, 4)}
                  date={q.date}
                  amount={q.grandTotal}
                  status={q.status}
                />
              ))
            )}
          </div>

          <button type="button" onClick={() => { setEditingQuotationId(null); setQuotationForm({ ...emptyQuotationForm(), quotationNo: getNextQuotationNumber() }); setQuotationSubView('makeQuotation'); }} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Quotation</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Quotation Detail sub-screen (Matches Screenshot 2, 3, 4) -----
    if (quotationSubView === 'quotationDetail') {
      const currentQuotation = quotations.find(q => q.id === selectedQuotationId);
      if (!currentQuotation) {
        setQuotationSubView('quotationList');
        return null;
      }

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('quotationList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Quotation Detail</h1>
            <button type="button" onClick={() => handleShareQuotation(currentQuotation)} aria-label="Share quotation" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <DocumentStatusBadge status={currentQuotation.status} />
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
              <div style={docStyles.page}>
                <GeneratedDocumentPreview model={buildQuotationDocModel(currentQuotation)} />
              </div>
            </div>
          </div>


          {/* BOTTOM ACTION BAR (Duplicate, Edit, Invoice, Status, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicateQuotation(currentQuotation)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditQuotation(currentQuotation)} style={docActionBarStyles.btn}>
              {/* Standardized Edit icon - matches the Edit pencil icon and styling used in the
                  Attendance Module for the Project Name field in the header, so the Edit action
                  looks and behaves the same everywhere within the Quotation Module. */}
              <span style={docActionBarStyles.iconWrap}><span style={{ cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>&#9999;&#65039;</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button onClick={() => setShowConvertSheet(true)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
              <span style={docActionBarStyles.label}>Convert</span>
            </button>
            <button onClick={() => setShowQuotationStatusSheet(true)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>💬</span></span>
              <span style={docActionBarStyles.label}>Status</span>
            </button>
            <button
              onClick={() => {
                showConfirm('Delete this quotation?', async () => {
                  const previous = quotations;
                  const deletedId = selectedQuotationId;
                  persistQuotations(quotations.filter(q => q.id !== deletedId));
                  setQuotationSubView('quotationList');
                  try {
                    await documentService.deleteQuotation(deletedId);
                  } catch (error) {
                    console.error('Error deleting quotation:', error);
                    persistQuotations(previous); // restore on failure
                    showAlert('Could not delete the quotation on the server. Reloading your quotations.');
                    if (loggedInUser?.userId) await loadUserQuotations(loggedInUser.userId);
                  }
                });
              }}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          {/* STATUS BOTTOM SHEET (Ref Image 4) */}
          <DocumentStatusSheet
            open={showQuotationStatusSheet}
            title="Quotation Status"
            onSelect={handleSetQuotationStatus}
            onClose={() => setShowQuotationStatusSheet(false)}
          />

          {/* CONVERSION BOTTOM SHEET (Invoice click - Ref Image 4) */}
          {showConvertSheet && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowConvertSheet(false)}>
              <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Quotation to...</h3>
                
                <button
                  onClick={async () => {
                    setShowConvertSheet(false);
                    if (!loggedInUser?.userId) {
                      showAlert('You need to be signed in to convert this quotation.');
                      return;
                    }
                    const payload = {
                      proformaInvoiceNo: getNextProformaInvoiceNumber(),
                      date: formatQuotationDate(new Date()),
                      dueDate: '', poNo: '', otherInfo: currentQuotation.otherInfo || '',
                      customerId: currentQuotation.customerId,
                      products: currentQuotation.products || [],
                      otherCharges: currentQuotation.otherCharges || [],
                      termsIds: currentQuotation.termsIds || [],
                      paidInfo: [],
                      customerName: currentQuotation.customerName,
                      customerCompany: currentQuotation.customerCompany,
                      customerMobile: currentQuotation.customerMobile,
                      customerEmail: currentQuotation.customerEmail,
                      customerAddressLine1: currentQuotation.customerAddressLine1,
                      customerAddressLine2: currentQuotation.customerAddressLine2,
                      customerAddressLine3: currentQuotation.customerAddressLine3,
                      customerBillingAddress: currentQuotation.customerBillingAddress,
                      customerShippingAddress: currentQuotation.customerShippingAddress,
                      docSnapshot: JSON.stringify(buildDocSettingsSnapshot(proformaInvoiceSettings)),
                    };
                    try {
                      // Convert always creates a brand-new, independently deletable Proforma
                      // Invoice on the server; the source Quotation is left untouched.
                      const created = await proformaInvoicesService.createProformaInvoice(loggedInUser.userId, payload);
                      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
                      persistProformaInvoices([...proformaInvoices, parsedCreated]);
                      showSuccess('Converted to Proforma Invoice successfully.');
                      setSelectedProformaInvoiceId(created.id);
                      setQuotationSubView('proformaInvoiceDetail');
                    } catch (error) {
                      console.error('Error converting quotation to proforma invoice:', error);
                      showAlert('Could not convert to Proforma Invoice. Please try again.');
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                >
                  Convert To Proforma Invoice
                </button>
                <button
                  onClick={async () => {
                    setShowConvertSheet(false);
                    if (!loggedInUser?.userId) {
                      showAlert('You need to be signed in to convert this quotation.');
                      return;
                    }
                    const payload = {
                      invoiceNo: getNextInvoiceNumber(),
                      date: formatQuotationDate(new Date()),
                      dueDate: '', poNo: '', otherInfo: currentQuotation.otherInfo || '',
                      customerId: currentQuotation.customerId,
                      products: currentQuotation.products || [],
                      otherCharges: currentQuotation.otherCharges || [],
                      termsIds: currentQuotation.termsIds || [],
                      paidInfo: [],
                      customerName: currentQuotation.customerName,
                      customerCompany: currentQuotation.customerCompany,
                      customerMobile: currentQuotation.customerMobile,
                      customerEmail: currentQuotation.customerEmail,
                      customerAddressLine1: currentQuotation.customerAddressLine1,
                      customerAddressLine2: currentQuotation.customerAddressLine2,
                      customerAddressLine3: currentQuotation.customerAddressLine3,
                      customerBillingAddress: currentQuotation.customerBillingAddress,
                      customerShippingAddress: currentQuotation.customerShippingAddress,
                      docSnapshot: JSON.stringify(buildDocSettingsSnapshot(invoiceSettings)),
                    };
                    try {
                      // Convert always creates a brand-new, independently deletable Invoice
                      // on the server; the source Quotation is left untouched.
                      const created = await invoicesService.createInvoice(loggedInUser.userId, payload);
                      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
                      persistInvoices([...invoices, parsedCreated]);
                      showSuccess('Converted to Invoice successfully.');
                      setSelectedInvoiceId(created.id);
                      setQuotationSubView('invoiceDetail');
                    } catch (error) {
                      console.error('Error converting quotation to invoice:', error);
                      showAlert('Could not convert to Invoice. Please try again.');
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                >
                  Convert To Invoice
                </button>
                <button onClick={() => setShowConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    if (quotationSubView === 'selectCustomerForPurchaseOrder') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForPurchaseOrder(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForPurchaseOrder')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForPurchaseOrder')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add Purchase Order Product sub-screen (Product / Quantity / Price / Description) -----
    if (quotationSubView === 'addPurchaseOrderProductLine') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingPurchaseOrderProductLineId ? 'Edit Purchase Order Product' : 'Add Purchase Order Product'}</h1>
            <button type="button" onClick={openPickProductForPurchaseOrderLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
              <FiSearch size={19} color="#ffffff" />
            </button>
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Product"
              as="button"
              onClick={openPickProductForPurchaseOrderLine}
              rightElement={<FiChevronRight size={18} color="#94A3B8" />}
            >
              {purchaseOrderProductLineForm.name || 'Select Product'}
            </LabeledField>

            <LabeledField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="1"
              value={purchaseOrderProductLineForm.qty}
              onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
            />

            <LabeledField
              label="Price"
              type="number"
              inputMode="decimal"
              value={purchaseOrderProductLineForm.price}
              onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
            />

            <div>
              <LabeledField
                label="Description"
                as="textarea"
                value={purchaseOrderProductLineForm.description}
                onChange={(e) => setPurchaseOrderProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                maxLength={2000}
              />
              <div style={customerModuleStyles.charCount}>{purchaseOrderProductLineForm.description.length}/2000</div>
            </div>

            <button type="button" onClick={handleAddPurchaseOrderProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
              Add To Purchase Order
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Pick Product sub-screen (choosing which product to add to a Purchase Order line) -----
    if (quotationSubView === 'pickProductForPurchaseOrderLine') {
      return (
        <div style={{ ...customerModuleStyles.screen}}>
          <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProductForPurchaseOrderLine(product)}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <FiChevronRight size={18} color="#94A3B8" />
                  </div>
                  {(product.price !== undefined && product.price !== '') || (product.gst !== undefined && product.gst !== '') ? (
                    <div style={customerModuleStyles.productDetailRow}>
                      {product.price !== undefined && product.price !== '' && (
                        <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                      )}
                      {product.price !== undefined && product.price !== '' && product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailDivider}>|</span>
                      )}
                      {product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct('pickProductForPurchaseOrderLine')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Terms and Conditions sub-screen (used from Make Purchase Order) -----
    if (quotationSubView === 'selectTermsForPurchaseOrder') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makePurchaseOrder')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
            <button type="button" onClick={() => openAddTermsModal('purchaseOrder')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={customerModuleStyles.termsTabRow}>
            <span style={customerModuleStyles.termsTabActive}>Purchase Order</span>
          </div>

          <div style={customerModuleStyles.body}>
            {purchaseOrderTerms.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
            ) : (
              purchaseOrderTerms.map((term) => {
                const selected = purchaseOrderTermsDraftSelectedIds.includes(term.id);
                return (
                  <div
                    key={term.id}
                    style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <button
                      type="button"
                      onClick={() => togglePurchaseOrderTermsDraftSelection(term.id)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                    >
                      {term.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTermsModal(term, 'purchaseOrder')}
                      aria-label="Edit term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#0F766E' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiEdit3 size={16} color="#0F766E" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(term, 'purchaseOrder')}
                      aria-label="Delete term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={16} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneSelectPurchaseOrderTerms} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isAddTermsModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingTermId ? 'Edit Terms and condition' : 'Add Terms and condition'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Purchase Order</div>
                <textarea
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder="Terms and condition"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingTermId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Purchase Order sub-screen -----
    if (quotationSubView === 'makePurchaseOrder') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingPurchaseOrderId ? 'Update Purchase Order' : 'Make Purchase Order'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makePurchaseOrder'); setQuotationSubView('purchaseOrderSettingsDetail'); }}
              aria-label="Purchase Order Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={makeQuotationStyles.infoRow}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Purchase Order Date</span>
                  <div style={makeQuotationStyles.infoValue}>{purchaseOrderForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Purchase Order No</span>
                  <div style={makeQuotationStyles.infoValue}>{purchaseOrderForm.purchaseOrderNo || '-'}</div>
                </div>
              </div>
              <div style={makeQuotationStyles.otherInfoRow}>
                <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                <input
                  type="text"
                  value={purchaseOrderForm.otherInfo}
                  onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                  style={makeQuotationStyles.otherInfoInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={editingPurchaseOrderId && selectedPurchaseOrderCustomer ? undefined : openSelectCustomerForPurchaseOrder}
              disabled={!!(editingPurchaseOrderId && selectedPurchaseOrderCustomer)}
              style={{ ...makeQuotationStyles.sectionCard, ...(editingPurchaseOrderId && selectedPurchaseOrderCustomer ? { cursor: 'default' } : {}) }}
            >
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                {!(editingPurchaseOrderId && selectedPurchaseOrderCustomer) && (
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                )}
              </div>
              {selectedPurchaseOrderCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedPurchaseOrderCustomer.name}</p>
                  {selectedPurchaseOrderCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedPurchaseOrderCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <div style={makeQuotationStyles.sectionCard}>
              <div
                role="button"
                tabIndex={0}
                onClick={openPickProductForPurchaseOrderLine}
                style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
              >
                <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {purchaseOrderForm.products.length > 0 && (
                <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                  {purchaseOrderForm.products.map((p) => {
                    const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                    const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                    const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    return (
                      <div
                        key={p.productId}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditPurchaseOrderProductLine(p)}
                        style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                              <FiEdit3 size={14} color="#0F766E" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removePurchaseOrderProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                          <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={openPurchaseOrderOtherChargeModal} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {purchaseOrderForm.otherCharges.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {purchaseOrderForm.otherCharges.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditPurchaseOrderOtherChargeModal(c); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{c.label}{c.taxable && c.gstPercent > 0 ? ` (GST ${c.gstPercent}%)` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removePurchaseOrderOtherCharge(c.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${c.label}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openSelectTermsForPurchaseOrder} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedPurchaseOrderTerms.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {selectedPurchaseOrderTerms.map((term) => (
                    <div key={term.id} style={makeQuotationStyles.lineRow}>
                      <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removePurchaseOrderSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div style={makeQuotationStyles.bottomBar}>
            <div>
              <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
              <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{purchaseOrderAmountDue}</div>
            </div>
            <button type="button" onClick={handleGeneratePurchaseOrder} disabled={isSavingPurchaseOrder} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingPurchaseOrder ? 'default' : 'pointer', opacity: isSavingPurchaseOrder ? 0.7 : 1 }}>{isSavingPurchaseOrder ? 'Saving...' : (editingPurchaseOrderId ? 'Update' : 'Generate')}</button>
          </div>

          {isPurchaseOrderOtherChargeModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsPurchaseOrderOtherChargeModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingPurchaseOrderOtherChargeId ? 'Edit Other Charge' : 'Other Charge Info'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>Charge Name</span>
                <input
                  type="text"
                  value={purchaseOrderOtherChargeForm.label}
                  onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Other Charges"
                  style={customerModuleStyles.fieldInput}
                />
                <input
                  type="number"
                  value={purchaseOrderOtherChargeForm.amount}
                  onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Other Charge Amount"
                  style={customerModuleStyles.fieldInput}
                />
                <div style={customerModuleStyles.taxableRow}>
                  <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                  <input
                    type="checkbox"
                    checked={purchaseOrderOtherChargeForm.taxable}
                    onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                    style={customerModuleStyles.checkbox}
                  />
                </div>
                {purchaseOrderOtherChargeForm.taxable && (
                  <>
                    <span style={customerModuleStyles.sheetSmallLabel}>Tax %</span>
                    <input
                      type="number"
                      value={purchaseOrderOtherChargeForm.gstPercent}
                      onChange={(e) => setPurchaseOrderOtherChargeForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
                      placeholder="Tax Percentage"
                      style={customerModuleStyles.fieldInput}
                    />
                    {/* Tax preview */}
                    {purchaseOrderOtherChargeForm.amount && Number(purchaseOrderOtherChargeForm.amount) > 0 &&
                     purchaseOrderOtherChargeForm.gstPercent && Number(purchaseOrderOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#F1F5F9',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          Tax Amount ({purchaseOrderOtherChargeForm.gstPercent}%)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                          ₹{(Number(purchaseOrderOtherChargeForm.amount) * Number(purchaseOrderOtherChargeForm.gstPercent) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {purchaseOrderOtherChargeForm.amount && Number(purchaseOrderOtherChargeForm.amount) > 0 &&
                     purchaseOrderOtherChargeForm.gstPercent && Number(purchaseOrderOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#ECFDF5',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#065F46' }}>
                          Total (including tax)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#065F46' }}>
                          ₹{(Number(purchaseOrderOtherChargeForm.amount) * (1 + Number(purchaseOrderOtherChargeForm.gstPercent) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <button type="button" onClick={handleSavePurchaseOrderOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingPurchaseOrderOtherChargeId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Purchase Order List sub-screen -----
    if (quotationSubView === 'purchaseOrderList') {
      const searchPurchaseOrder = (q) => {
        const qs = purchaseOrderSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return q.customerName.toLowerCase().includes(qs) || 
               (q.purchaseOrderNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Purchase Order</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={purchaseOrderSearchQuery}
                onChange={(e) => setPurchaseOrderSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Purchase Order#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {purchaseOrders.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>No purchase orders generated yet.</p>
            ) : (
              sortDocumentsByCreated(purchaseOrders.filter(searchPurchaseOrder)).map((q) => (
                <DocumentListCard
                  key={q.id}
                  onClick={() => { setSelectedPurchaseOrderId(q.id); setQuotationSubView('purchaseOrderDetail'); }}
                  name={q.customerName}
                  docNumber={q.purchaseOrderNo || 'PO-' + q.id.slice(0, 4)}
                  date={q.date}
                  amount={q.grandTotal}
                />
              ))
            )}
          </div>

          <button type="button" onClick={() => { setEditingPurchaseOrderId(null); setPurchaseOrderForm({ ...emptyPurchaseOrderForm(), purchaseOrderNo: getNextPurchaseOrderNumber() }); setQuotationSubView('makePurchaseOrder'); }} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Purchase<br />Order</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Purchase Order Detail sub-screen -----
    if (quotationSubView === 'purchaseOrderDetail') {
      const currentPurchaseOrder = purchaseOrders.find(q => q.id === selectedPurchaseOrderId);
      if (!currentPurchaseOrder) {
        setQuotationSubView('purchaseOrderList');
        return null;
      }

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('purchaseOrderList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Purchase Order Detail</h1>
            <button type="button" onClick={() => handleSharePurchaseOrder(currentPurchaseOrder)} aria-label="Share purchase order" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
              <div style={docStyles.page}>
                <GeneratedDocumentPreview model={buildPurchaseOrderDocModel(currentPurchaseOrder)} />
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicatePurchaseOrder(currentPurchaseOrder)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditPurchaseOrder(currentPurchaseOrder)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button
              onClick={() => {
                showConfirm('Delete this purchase order?', async () => {
                  const previous = purchaseOrders;
                  const deletedId = selectedPurchaseOrderId;
                  persistPurchaseOrders(purchaseOrders.filter(o => o.id !== deletedId));
                  setQuotationSubView('purchaseOrderList');
                  try {
                    await purchaseOrdersService.deletePurchaseOrder(deletedId);
                  } catch (error) {
                    console.error('Error deleting purchase order:', error);
                    persistPurchaseOrders(previous);
                    showAlert('Could not delete the purchase order. Please try again.');
                  }
                });
              }}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    if (quotationSubView === 'selectCustomerForProformaInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForProformaInvoice(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForProformaInvoice')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForProformaInvoice')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add Proforma Invoice Product sub-screen (Product / Quantity / Price / Description) -----
    if (quotationSubView === 'addProformaInvoiceProductLine') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingProformaInvoiceProductLineId ? 'Edit Proforma Invoice Product' : 'Add Proforma Invoice Product'}</h1>
            <button type="button" onClick={openPickProductForProformaInvoiceLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
              <FiSearch size={19} color="#ffffff" />
            </button>
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Product"
              as="button"
              onClick={openPickProductForProformaInvoiceLine}
              rightElement={<FiChevronRight size={18} color="#94A3B8" />}
            >
              {proformaInvoiceProductLineForm.name || 'Select Product'}
            </LabeledField>

            <LabeledField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="1"
              value={proformaInvoiceProductLineForm.qty}
              onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
            />

            <LabeledField
              label="Price"
              type="number"
              inputMode="decimal"
              value={proformaInvoiceProductLineForm.price}
              onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
            />

            <div>
              <LabeledField
                label="Description"
                as="textarea"
                value={proformaInvoiceProductLineForm.description}
                onChange={(e) => setProformaInvoiceProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                maxLength={2000}
              />
              <div style={customerModuleStyles.charCount}>{proformaInvoiceProductLineForm.description.length}/2000</div>
            </div>

            <button type="button" onClick={handleAddProformaInvoiceProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
              Add To Proforma Invoice
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Pick Product sub-screen (choosing which product to add to a Proforma Invoice line) -----
    if (quotationSubView === 'pickProductForProformaInvoiceLine') {
      return (
        <div style={{ ...customerModuleStyles.screen}}>
          <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProductForProformaInvoiceLine(product)}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <FiChevronRight size={18} color="#94A3B8" />
                  </div>
                  {(product.price !== undefined && product.price !== '') || (product.gst !== undefined && product.gst !== '') ? (
                    <div style={customerModuleStyles.productDetailRow}>
                      {product.price !== undefined && product.price !== '' && (
                        <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                      )}
                      {product.price !== undefined && product.price !== '' && product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailDivider}>|</span>
                      )}
                      {product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct('pickProductForProformaInvoiceLine')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Terms and Conditions sub-screen (used from Make Proforma Invoice) -----
    if (quotationSubView === 'selectTermsForProformaInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
            <button type="button" onClick={() => openAddTermsModal('proformaInvoice')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={customerModuleStyles.termsTabRow}>
            <span style={customerModuleStyles.termsTabActive}>Proforma Invoice</span>
          </div>

          <div style={customerModuleStyles.body}>
            {proformaInvoiceTerms.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
            ) : (
              proformaInvoiceTerms.map((term) => {
                const selected = proformaInvoiceTermsDraftSelectedIds.includes(term.id);
                return (
                  <div
                    key={term.id}
                    style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleProformaInvoiceTermsDraftSelection(term.id)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                    >
                      {term.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTermsModal(term, 'proformaInvoice')}
                      aria-label="Edit term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#0F766E' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiEdit3 size={16} color="#0F766E" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(term, 'proformaInvoice')}
                      aria-label="Delete term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={16} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneSelectProformaInvoiceTerms} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isAddTermsModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingTermId ? 'Edit Terms and condition' : 'Add Terms and condition'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Proforma Invoice</div>
                <textarea
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder="Terms and condition"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingTermId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Proforma Invoice sub-screen -----
    if (quotationSubView === 'makeProformaInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingProformaInvoiceId ? 'Update Proforma Invoice' : 'Make Proforma Invoice'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makeProformaInvoice'); setQuotationSubView('proformaInvoiceSettingsDetail'); }}
              aria-label="Proforma Invoice Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={makeQuotationStyles.infoRow}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Proforma Invoice Date</span>
                  <div style={makeQuotationStyles.infoValue}>{proformaInvoiceForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Proforma Invoice No</span>
                  <div style={makeQuotationStyles.infoValue}>{proformaInvoiceForm.proformaInvoiceNo || '-'}</div>
                </div>
              </div>
              <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Due Date</span>
                  <input
                    type="text"
                    value={proformaInvoiceForm.dueDate}
                    onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    placeholder="-"
                    style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>PO No</span>
                  <input
                    type="text"
                    value={proformaInvoiceForm.poNo}
                    onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, poNo: e.target.value }))}
                    placeholder="-"
                    style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, textAlign: 'right', width: '140px', marginLeft: 'auto' }}
                  />
                </div>
              </div>
              <div style={makeQuotationStyles.otherInfoRow}>
                <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                <input
                  type="text"
                  value={proformaInvoiceForm.otherInfo}
                  onChange={(e) => setProformaInvoiceForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                  style={makeQuotationStyles.otherInfoInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={editingProformaInvoiceId && selectedProformaInvoiceCustomer ? undefined : openSelectCustomerForProformaInvoice}
              disabled={!!(editingProformaInvoiceId && selectedProformaInvoiceCustomer)}
              style={{ ...makeQuotationStyles.sectionCard, ...(editingProformaInvoiceId && selectedProformaInvoiceCustomer ? { cursor: 'default' } : {}) }}
            >
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>BILL TO (CUSTOMER)</span>
                {!(editingProformaInvoiceId && selectedProformaInvoiceCustomer) && (
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                )}
              </div>
              {selectedProformaInvoiceCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedProformaInvoiceCustomer.name}</p>
                  {selectedProformaInvoiceCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedProformaInvoiceCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <div style={makeQuotationStyles.sectionCard}>
              <div
                role="button"
                tabIndex={0}
                onClick={openPickProductForProformaInvoiceLine}
                style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
              >
                <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {proformaInvoiceForm.products.length > 0 && (
                <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                  {proformaInvoiceForm.products.map((p) => {
                    const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                    const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                    const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    return (
                      <div
                        key={p.productId}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditProformaInvoiceProductLine(p)}
                        style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                              <FiEdit3 size={14} color="#0F766E" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeProformaInvoiceProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                          <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={openProformaInvoiceOtherChargeModal} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {proformaInvoiceForm.otherCharges.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {proformaInvoiceForm.otherCharges.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditProformaInvoiceOtherChargeModal(c); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{c.label}{c.taxable && c.gstPercent > 0 ? ` (GST ${c.gstPercent}%)` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeProformaInvoiceOtherCharge(c.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${c.label}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openSelectTermsForProformaInvoice} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedProformaInvoiceTerms.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {selectedProformaInvoiceTerms.map((term) => (
                    <div key={term.id} style={makeQuotationStyles.lineRow}>
                      <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeProformaInvoiceSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openProformaPaidInfoList} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>PAID INFO</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {proformaInvoiceForm.paidInfo.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {proformaInvoiceForm.paidInfo.map((p) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditProformaPaidInfoModal(p); setQuotationSubView('proformaPaidInfoList'); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{p.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeProformaPaidInfoLine(p.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove paid info"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div style={makeQuotationStyles.bottomBar}>
            <div>
              <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
              <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{proformaInvoiceAmountDue}</div>
            </div>
            <button type="button" onClick={handleGenerateProformaInvoice} disabled={isSavingProformaInvoice} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingProformaInvoice ? 'default' : 'pointer', opacity: isSavingProformaInvoice ? 0.7 : 1 }}>{isSavingProformaInvoice ? 'Saving...' : (editingProformaInvoiceId ? 'Update' : 'Generate')}</button>
          </div>

          {isProformaInvoiceOtherChargeModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsProformaInvoiceOtherChargeModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingProformaInvoiceOtherChargeId ? 'Edit Other Charge' : 'Other Charge Info'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>Charge Name</span>
                <input
                  type="text"
                  value={proformaInvoiceOtherChargeForm.label}
                  onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Other Charges"
                  style={customerModuleStyles.fieldInput}
                />
                <input
                  type="number"
                  value={proformaInvoiceOtherChargeForm.amount}
                  onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Other Charge Amount"
                  style={customerModuleStyles.fieldInput}
                />
                <div style={customerModuleStyles.taxableRow}>
                  <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                  <input
                    type="checkbox"
                    checked={proformaInvoiceOtherChargeForm.taxable}
                    onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                    style={customerModuleStyles.checkbox}
                  />
                </div>
                {proformaInvoiceOtherChargeForm.taxable && (
                  <>
                    <span style={customerModuleStyles.sheetSmallLabel}>Tax %</span>
                    <input
                      type="number"
                      value={proformaInvoiceOtherChargeForm.gstPercent}
                      onChange={(e) => setProformaInvoiceOtherChargeForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
                      placeholder="Tax Percentage"
                      style={customerModuleStyles.fieldInput}
                    />
                    {/* Tax preview */}
                    {proformaInvoiceOtherChargeForm.amount && Number(proformaInvoiceOtherChargeForm.amount) > 0 &&
                     proformaInvoiceOtherChargeForm.gstPercent && Number(proformaInvoiceOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#F1F5F9',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          Tax Amount ({proformaInvoiceOtherChargeForm.gstPercent}%)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                          ₹{(Number(proformaInvoiceOtherChargeForm.amount) * Number(proformaInvoiceOtherChargeForm.gstPercent) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {proformaInvoiceOtherChargeForm.amount && Number(proformaInvoiceOtherChargeForm.amount) > 0 &&
                     proformaInvoiceOtherChargeForm.gstPercent && Number(proformaInvoiceOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#ECFDF5',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#065F46' }}>
                          Total (including tax)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#065F46' }}>
                          ₹{(Number(proformaInvoiceOtherChargeForm.amount) * (1 + Number(proformaInvoiceOtherChargeForm.gstPercent) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <button type="button" onClick={handleSaveProformaInvoiceOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingProformaInvoiceOtherChargeId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Proforma Paid Info List sub-screen -----
    if (quotationSubView === 'proformaPaidInfoList') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeProformaInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Paid Info List</h1>
            <button type="button" onClick={openAddProformaPaidInfoModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '90px' }}>
            {proformaInvoiceForm.paidInfo.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any paid info</p>
            ) : (
              proformaInvoiceForm.paidInfo.map((p) => {
                const isSelected = selectedProformaPaidInfoIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProformaPaidInfoSelection(p.id)}
                    style={{ ...customerModuleStyles.customerCard, ...(isSelected ? customerModuleStyles.termCardSelected : {}) }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={customerModuleStyles.customerName}>{'\u20B9'}{p.amount}</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{p.date}</span>
                      </div>
                      {p.note && <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{p.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditProformaPaidInfoModal(p); }}
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#475569', marginLeft: '10px' }}
                      aria-label="Edit paid info"
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeProformaPaidInfoLine(p.id); }}
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626', marginLeft: '10px' }}
                      aria-label="Delete paid info"
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneProformaPaidInfoList} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isProformaPaidInfoModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsProformaPaidInfoModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingProformaPaidInfoId ? 'Edit Paid Info' : 'Paid Info'}</h3>
                <button
                  type="button"
                  onClick={() => { setProformaPaidInfoCalendarMonth(parseQuotationDate(proformaPaidInfoForm.date) || new Date()); setIsProformaPaidInfoDatePickerOpen(true); }}
                  style={{ ...customerModuleStyles.fieldInput, textAlign: 'left', cursor: 'pointer', color: proformaPaidInfoForm.date ? '#0F172A' : '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{proformaPaidInfoForm.date || t('selectDatePlaceholder')}</span>
                  <span style={{ fontSize: '15px' }}>&#128197;</span>
                </button>
                <input
                  type="number"
                  value={proformaPaidInfoForm.amount}
                  onChange={(e) => setProformaPaidInfoForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  style={customerModuleStyles.fieldInput}
                />
                <textarea
                  value={proformaPaidInfoForm.note}
                  onChange={(e) => setProformaPaidInfoForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Note"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleSaveProformaPaidInfo} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingProformaPaidInfoId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          {/* ============ PROFORMA PAID INFO DATE CALENDAR POPUP ============ */}
          {isProformaPaidInfoDatePickerOpen && (() => {
            const maxDateStr = toLocalISODate(new Date());
            const year = proformaPaidInfoCalendarMonth.getFullYear();
            const month = proformaPaidInfoCalendarMonth.getMonth();
            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < firstWeekday; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            const rows = [];
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

            return (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ backgroundColor: '#0B3C9B', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                    <div style={{ fontSize: '21px', fontWeight: '700' }}>{proformaPaidInfoForm.date ? proformaPaidInfoForm.date : t('selectDatePlaceholder')}</div>
                  </div>
                  <div style={{ padding: '16px 18px 4px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <button onClick={() => setProformaPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{proformaPaidInfoCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setProformaPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {row.map((dayNum, ci) => {
                          if (!dayNum) return <div key={ci} />;
                          const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const displayStr = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                          const isDisabled = isoStr > maxDateStr;
                          const isSelected = proformaPaidInfoForm.date === displayStr;
                          return (
                            <div
                              key={ci}
                              onClick={() => { if (isDisabled) return; setProformaPaidInfoForm((prev) => ({ ...prev, date: displayStr })); setIsProformaPaidInfoDatePickerOpen(false); }}
                              style={{
                                textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '50%',
                                fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                                cursor: isDisabled ? 'default' : 'pointer',
                                color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : '#1E293B'),
                                backgroundColor: isSelected ? '#0B3C9B' : 'transparent'
                              }}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '22px', padding: '12px 20px 18px 20px' }}>
                    <button onClick={() => setIsProformaPaidInfoDatePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('cancel')}</button>
                  </div>
                </div>
              </div>
            );
          })()}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Proforma Invoice List sub-screen -----
    if (quotationSubView === 'proformaInvoiceList') {
      const searchProformaInvoice = (q) => {
        const qs = proformaInvoiceSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return q.customerName.toLowerCase().includes(qs) || 
               (q.proformaInvoiceNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Proforma Invoice</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={proformaInvoiceSearchQuery}
                onChange={(e) => setProformaInvoiceSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Proforma#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {proformaInvoices.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>No proforma invoices generated yet.</p>
            ) : (
              sortDocumentsByCreated(proformaInvoices.filter(searchProformaInvoice)).map((q) => (
                <DocumentListCard
                  key={q.id}
                  onClick={() => { setSelectedProformaInvoiceId(q.id); setQuotationSubView('proformaInvoiceDetail'); }}
                  name={q.customerName}
                  docNumber={q.proformaInvoiceNo || 'PI-' + q.id.slice(0, 4)}
                  date={q.date}
                  amount={q.grandTotal}
                />
              ))
            )}
          </div>

          <button type="button" onClick={() => { setEditingProformaInvoiceId(null); setProformaInvoiceForm({ ...emptyProformaInvoiceForm(), proformaInvoiceNo: getNextProformaInvoiceNumber() }); setQuotationSubView('makeProformaInvoice'); }} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Proforma<br />Invoice</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Proforma Invoice Detail sub-screen -----
    if (quotationSubView === 'proformaInvoiceDetail') {
      const currentProformaInvoice = proformaInvoices.find(q => q.id === selectedProformaInvoiceId);
      if (!currentProformaInvoice) {
        setQuotationSubView('proformaInvoiceList');
        return null;
      }

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('proformaInvoiceList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Proforma Invoice Detail</h1>
            <button type="button" onClick={() => handleShareProformaInvoice(currentProformaInvoice)} aria-label="Share proforma invoice" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
              <div style={docStyles.page}>
                <GeneratedDocumentPreview model={buildProformaInvoiceDocModel(currentProformaInvoice)} />
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicateProformaInvoice(currentProformaInvoice)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditProformaInvoice(currentProformaInvoice)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button onClick={() => setShowProformaInvoiceConvertSheet(true)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
              <span style={docActionBarStyles.label}>Convert</span>
            </button>
            <button
              onClick={() => {
showConfirm('Delete this proforma invoice?', async () => {
  const previous = proformaInvoices;
  const deletedId = selectedProformaInvoiceId;
  persistProformaInvoices(proformaInvoices.filter(inv => inv.id !== deletedId));
  setQuotationSubView('proformaInvoiceList');
  try {
    await proformaInvoicesService.deleteProformaInvoice(deletedId);
  } catch (error) {
    console.error('Error deleting proforma invoice:', error);
    persistProformaInvoices(previous);
    showAlert('Could not delete the proforma invoice. Please try again.');
  }
});
}}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          {/* CONVERSION BOTTOM SHEET (Convert click) */}
          {showProformaInvoiceConvertSheet && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowProformaInvoiceConvertSheet(false)}>
              <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Proforma Invoice to...</h3>

                <button
                  onClick={async () => {
                    setShowProformaInvoiceConvertSheet(false);
                    if (!loggedInUser?.userId) {
                      showAlert('You need to be signed in to convert this proforma invoice.');
                      return;
                    }
                    const payload = {
                      invoiceNo: getNextInvoiceNumber(),
                      date: formatQuotationDate(new Date()),
                      dueDate: currentProformaInvoice.dueDate || '', poNo: currentProformaInvoice.poNo || '', otherInfo: currentProformaInvoice.otherInfo || '',
                      customerId: currentProformaInvoice.customerId,
                      products: currentProformaInvoice.products || [],
                      otherCharges: currentProformaInvoice.otherCharges || [],
                      termsIds: currentProformaInvoice.termsIds || [],
                      paidInfo: [],
                      customerName: currentProformaInvoice.customerName,
                      customerCompany: currentProformaInvoice.customerCompany,
                      customerMobile: currentProformaInvoice.customerMobile,
                      customerEmail: currentProformaInvoice.customerEmail,
                      customerAddressLine1: currentProformaInvoice.customerAddressLine1,
                      customerAddressLine2: currentProformaInvoice.customerAddressLine2,
                      customerAddressLine3: currentProformaInvoice.customerAddressLine3,
                      customerBillingAddress: currentProformaInvoice.customerBillingAddress,
                      customerShippingAddress: currentProformaInvoice.customerShippingAddress,
                      docSnapshot: JSON.stringify(buildDocSettingsSnapshot(invoiceSettings)),
                    };
                    try {
                      // Convert always creates a brand-new, independently deletable Invoice
                      // on the server; the source Proforma Invoice is left untouched.
                      const created = await invoicesService.createInvoice(loggedInUser.userId, payload);
                      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
                      persistInvoices([...invoices, parsedCreated]);
                      showSuccess('Converted to Invoice successfully.');
                      setSelectedInvoiceId(created.id);
                      setQuotationSubView('invoiceDetail');
                    } catch (error) {
                      console.error('Error converting proforma invoice to invoice:', error);
                      showAlert('Could not convert to Invoice. Please try again.');
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                >
                  Convert To Invoice
                </button>
                <button
                  onClick={async () => {
                    setShowProformaInvoiceConvertSheet(false);
                    if (!loggedInUser?.userId) {
                      showAlert('You need to be signed in to convert this proforma invoice.');
                      return;
                    }
                    const payload = {
                      deliveryNoteNo: getNextDeliveryNoteNumber(),
                      date: formatQuotationDate(new Date()),
                      refNo: currentProformaInvoice.proformaInvoiceNo || '',
                      otherInfo: currentProformaInvoice.otherInfo || '',
                      customerId: currentProformaInvoice.customerId,
                      products: currentProformaInvoice.products || [],
                      otherCharges: [],
                      termsIds: [],
                      customerName: currentProformaInvoice.customerName,
                      customerCompany: currentProformaInvoice.customerCompany,
                      customerMobile: currentProformaInvoice.customerMobile,
                      customerEmail: currentProformaInvoice.customerEmail,
                      customerAddressLine1: currentProformaInvoice.customerAddressLine1,
                      customerAddressLine2: currentProformaInvoice.customerAddressLine2,
                      customerAddressLine3: currentProformaInvoice.customerAddressLine3,
                      customerBillingAddress: currentProformaInvoice.customerBillingAddress,
                      customerShippingAddress: currentProformaInvoice.customerShippingAddress,
                      docSnapshot: JSON.stringify(buildDocSettingsSnapshot(deliveryNoteSettings)),
                    };
                    try {
                      // Convert always creates a brand-new, independently deletable Delivery
                      // Note on the server; the source Proforma Invoice is left untouched.
                      const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
                      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
                      persistDeliveryNotes([...deliveryNotes, parsedCreated]);
                      showSuccess('Converted to Delivery Note successfully.');
                      setSelectedDeliveryNoteId(created.id);
                      setQuotationSubView('deliveryNoteDetail');
                    } catch (error) {
                      console.error('Error converting proforma invoice to delivery note:', error);
                      showAlert('Could not convert to Delivery Note. Please try again.');
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                >
                  Convert To Delivery Note
                </button>
                <button onClick={() => setShowProformaInvoiceConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Customer sub-screen (used from Make Delivery Note) -----
    if (quotationSubView === 'selectCustomerForDeliveryNote') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForDeliveryNote(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForDeliveryNote')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForDeliveryNote')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add Delivery Note Product sub-screen (Product / Quantity / Price / Description) -----
    if (quotationSubView === 'addDeliveryNoteProductLine') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingDeliveryNoteProductLineId ? 'Edit Delivery Note Product' : 'Add Delivery Note Product'}</h1>
            <button type="button" onClick={openPickProductForDeliveryNoteLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
              <FiSearch size={19} color="#ffffff" />
            </button>
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Product"
              as="button"
              onClick={openPickProductForDeliveryNoteLine}
              rightElement={<FiChevronRight size={18} color="#94A3B8" />}
            >
              {deliveryNoteProductLineForm.name || 'Select Product'}
            </LabeledField>

            <LabeledField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="1"
              value={deliveryNoteProductLineForm.qty}
              onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
            />

            <LabeledField
              label="Price"
              type="number"
              inputMode="decimal"
              value={deliveryNoteProductLineForm.price}
              onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
            />

            <div>
              <LabeledField
                label="Description"
                as="textarea"
                value={deliveryNoteProductLineForm.description}
                onChange={(e) => setDeliveryNoteProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                maxLength={2000}
              />
              <div style={customerModuleStyles.charCount}>{deliveryNoteProductLineForm.description.length}/2000</div>
            </div>

            <button type="button" onClick={handleAddDeliveryNoteProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
              Add To Delivery Note
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Pick Product sub-screen (choosing which product to add to a Delivery Note line) -----
    if (quotationSubView === 'pickProductForDeliveryNoteLine') {
      return (
        <div style={{ ...customerModuleStyles.screen}}>
          <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProductForDeliveryNoteLine(product)}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <FiChevronRight size={18} color="#94A3B8" />
                  </div>
                  {(product.price !== undefined && product.price !== '') || (product.gst !== undefined && product.gst !== '') ? (
                    <div style={customerModuleStyles.productDetailRow}>
                      {product.price !== undefined && product.price !== '' && (
                        <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                      )}
                      {product.price !== undefined && product.price !== '' && product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailDivider}>|</span>
                      )}
                      {product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct('pickProductForDeliveryNoteLine')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Terms and Conditions sub-screen (used from Make Delivery Note) -----
    if (quotationSubView === 'selectTermsForDeliveryNote') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeDeliveryNote')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
            <button type="button" onClick={() => openAddTermsModal('deliveryNote')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={customerModuleStyles.termsTabRow}>
            <span style={customerModuleStyles.termsTabActive}>Delivery Note</span>
          </div>

          <div style={customerModuleStyles.body}>
            {deliveryNoteTerms.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
            ) : (
              deliveryNoteTerms.map((term) => {
                const selected = deliveryNoteTermsDraftSelectedIds.includes(term.id);
                return (
                  <div
                    key={term.id}
                    style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDeliveryNoteTermsDraftSelection(term.id)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                    >
                      {term.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTermsModal(term, 'deliveryNote')}
                      aria-label="Edit term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#0F766E' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiEdit3 size={16} color="#0F766E" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(term, 'deliveryNote')}
                      aria-label="Delete term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={16} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneSelectDeliveryNoteTerms} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isAddTermsModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingTermId ? 'Edit Terms and condition' : 'Add Terms and condition'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Delivery Note</div>
                <textarea
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder="Terms and condition"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingTermId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Delivery Note sub-screen -----
    if (quotationSubView === 'makeDeliveryNote') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingDeliveryNoteId ? 'Update Delivery Note' : 'Make Delivery Note'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makeDeliveryNote'); setQuotationSubView('deliveryNoteSettingsDetail'); }}
              aria-label="Delivery Note Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={makeQuotationStyles.infoRow}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Delivery Note Date</span>
                  <div style={makeQuotationStyles.infoValue}>{deliveryNoteForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Delivery Note No</span>
                  <div style={makeQuotationStyles.infoValue}>{deliveryNoteForm.deliveryNoteNo || '-'}</div>
                </div>
              </div>
              <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Ref No</span>
                  <input
                    type="text"
                    value={deliveryNoteForm.refNo}
                    onChange={(e) => setDeliveryNoteForm((prev) => ({ ...prev, refNo: e.target.value }))}
                    placeholder="-"
                    style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                  />
                </div>
              </div>
              <div style={makeQuotationStyles.otherInfoRow}>
                <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                <input
                  type="text"
                  value={deliveryNoteForm.otherInfo}
                  onChange={(e) => setDeliveryNoteForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                  style={makeQuotationStyles.otherInfoInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={editingDeliveryNoteId && selectedDeliveryNoteCustomer ? undefined : openSelectCustomerForDeliveryNote}
              disabled={!!(editingDeliveryNoteId && selectedDeliveryNoteCustomer)}
              style={{ ...makeQuotationStyles.sectionCard, ...(editingDeliveryNoteId && selectedDeliveryNoteCustomer ? { cursor: 'default' } : {}) }}
            >
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TO (CUSTOMER)</span>
                {!(editingDeliveryNoteId && selectedDeliveryNoteCustomer) && (
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                )}
              </div>
              {selectedDeliveryNoteCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedDeliveryNoteCustomer.name}</p>
                  {selectedDeliveryNoteCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedDeliveryNoteCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <div style={makeQuotationStyles.sectionCard}>
              <div
                role="button"
                tabIndex={0}
                onClick={openPickProductForDeliveryNoteLine}
                style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
              >
                <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {deliveryNoteForm.products.length > 0 && (
                <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '8px' }}>
                  {deliveryNoteForm.products.map((p) => (
                    <div
                      key={p.productId}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEditDeliveryNoteProductLine(p)}
                      style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>{p.name} x{p.qty}{p.unit ? ` ${p.unit}` : ''}</span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeDeliveryNoteProductLine(p.productId); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${p.name}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={openSelectTermsForDeliveryNote} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedDeliveryNoteTerms.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {selectedDeliveryNoteTerms.map((term) => (
                    <div key={term.id} style={makeQuotationStyles.lineRow}>
                      <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeDeliveryNoteSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div style={{ ...makeQuotationStyles.bottomBar, justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleGenerateDeliveryNote} disabled={isSavingDeliveryNote} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingDeliveryNote ? 'default' : 'pointer', opacity: isSavingDeliveryNote ? 0.7 : 1 }}>{isSavingDeliveryNote ? 'Saving...' : (editingDeliveryNoteId ? 'Update' : 'Generate')}</button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Delivery Note List sub-screen -----
    if (quotationSubView === 'deliveryNoteList') {
      const searchDeliveryNote = (q) => {
        const qs = deliveryNoteSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return q.customerName.toLowerCase().includes(qs) || 
               (q.deliveryNoteNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Delivery Note</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={deliveryNoteSearchQuery}
                onChange={(e) => setDeliveryNoteSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Delivery Note#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {deliveryNotes.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>No delivery notes generated yet.</p>
            ) : (
              sortDocumentsByCreated(deliveryNotes.filter(searchDeliveryNote)).map((q) => (
                <DocumentListCard
                  key={q.id}
                  onClick={() => { setSelectedDeliveryNoteId(q.id); setQuotationSubView('deliveryNoteDetail'); }}
                  name={q.customerName}
                  docNumber={q.deliveryNoteNo || 'DN-' + q.id.slice(0, 4)}
                  date={q.date}
                  amountText={`${q.products.length} item${q.products.length === 1 ? '' : 's'}`}
                />
              ))
            )}
          </div>

          <button type="button" onClick={openMakeDeliveryNote} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Delivery<br />Note</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Delivery Note Detail sub-screen -----
    if (quotationSubView === 'deliveryNoteDetail') {
      const currentDeliveryNote = deliveryNotes.find(q => q.id === selectedDeliveryNoteId);
      if (!currentDeliveryNote) {
        setQuotationSubView('deliveryNoteList');
        return null;
      }

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('deliveryNoteList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Delivery Note Detail</h1>
            <button type="button" onClick={() => handleShareDeliveryNote(currentDeliveryNote)} aria-label="Share delivery note" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
              <div style={docStyles.page}>
                <GeneratedDocumentPreview model={buildDeliveryNoteDocModel(currentDeliveryNote)} />
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicateDeliveryNote(currentDeliveryNote)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditDeliveryNote(currentDeliveryNote)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button
              onClick={() => {
showConfirm('Delete this delivery note?', async () => {
  const previous = deliveryNotes;
  const deletedId = selectedDeliveryNoteId;
  persistDeliveryNotes(deliveryNotes.filter(dn => dn.id !== deletedId));
  setQuotationSubView('deliveryNoteList');
  try {
    await deliveryNotesService.deleteDeliveryNote(deletedId);
  } catch (error) {
    console.error('Error deleting delivery note:', error);
    persistDeliveryNotes(previous);
    showAlert('Could not delete the delivery note. Please try again.');
  }
});
}}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Customer sub-screen (used from Make Invoice) -----
    if (quotationSubView === 'selectCustomerForInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForInvoice(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForInvoice')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForInvoice')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Add Invoice Product sub-screen (Product / Quantity / Price / Description) -----
    if (quotationSubView === 'addInvoiceProductLine') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingInvoiceProductLineId ? 'Edit Invoice Product' : 'Add Invoice Product'}</h1>
            <button type="button" onClick={openPickProductForInvoiceLine} aria-label="Search product" style={customerModuleStyles.headerIconBtn}>
              <FiSearch size={19} color="#ffffff" />
            </button>
          </div>

          <div style={customerModuleStyles.formBody}>
            <LabeledField
              label="Product"
              as="button"
              onClick={openPickProductForInvoiceLine}
              rightElement={<FiChevronRight size={18} color="#94A3B8" />}
            >
              {invoiceProductLineForm.name || 'Select Product'}
            </LabeledField>

            <LabeledField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min="1"
              value={invoiceProductLineForm.qty}
              onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, qty: e.target.value }))}
            />

            <LabeledField
              label="Price"
              type="number"
              inputMode="decimal"
              value={invoiceProductLineForm.price}
              onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, price: e.target.value }))}
            />

            <div>
              <LabeledField
                label="Description"
                as="textarea"
                value={invoiceProductLineForm.description}
                onChange={(e) => setInvoiceProductLineForm((prev) => ({ ...prev, description: e.target.value.slice(0, 2000) }))}
                maxLength={2000}
              />
              <div style={customerModuleStyles.charCount}>{invoiceProductLineForm.description.length}/2000</div>
            </div>

            <button type="button" onClick={handleAddInvoiceProductLine} style={{ ...customerModuleStyles.addBtn, marginTop: '6px' }}>
              Add To Invoice
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Pick Product sub-screen (choosing which product to add to a Invoice line) -----
    if (quotationSubView === 'pickProductForInvoiceLine') {
      return (
        <div style={{ ...customerModuleStyles.screen}}>
          <div style={{ ...customerModuleStyles.header, flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView(productPickerReturnView || 'makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Product</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={{ ...customerModuleStyles.body, maxWidth: 'none', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '110px' }}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {products.length === 0 ? 'No products added yet. Tap "Add Product" to create one.' : 'No products match your search.'}
              </p>
            ) : (
              sortByName(filteredProducts, (p) => p.name).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handlePickProductForInvoiceLine(product)}
                  style={customerModuleStyles.productCard}
                >
                  <div style={customerModuleStyles.productCardTopRow}>
                    <span style={customerModuleStyles.customerName}>{product.name}</span>
                    <FiChevronRight size={18} color="#94A3B8" />
                  </div>
                  {(product.price !== undefined && product.price !== '') || (product.gst !== undefined && product.gst !== '') ? (
                    <div style={customerModuleStyles.productDetailRow}>
                      {product.price !== undefined && product.price !== '' && (
                        <span style={customerModuleStyles.productDetailText}>Price: {'\u20B9'}{product.price}</span>
                      )}
                      {product.price !== undefined && product.price !== '' && product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailDivider}>|</span>
                      )}
                      {product.gst !== undefined && product.gst !== '' && (
                        <span style={customerModuleStyles.productDetailText}>GST: {product.gst}%</span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddProduct('pickProductForInvoiceLine')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />PRODUCT</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Terms and Conditions sub-screen (used from Make Invoice) -----
    if (quotationSubView === 'selectTermsForInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Select Terms and…</h1>
            <button type="button" onClick={() => openAddTermsModal('invoice')} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={customerModuleStyles.termsTabRow}>
            <span style={customerModuleStyles.termsTabActive}>Invoice</span>
          </div>

          <div style={customerModuleStyles.body}>
            {invoiceTerms.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '80px' }}>You don't have any terms and conditions</p>
            ) : (
              invoiceTerms.map((term) => {
                const selected = invoiceTermsDraftSelectedIds.includes(term.id);
                return (
                  <div
                    key={term.id}
                    style={{ ...customerModuleStyles.termCard, ...(selected ? customerModuleStyles.termCardSelected : {}), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleInvoiceTermsDraftSelection(term.id)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '14.5px', fontWeight: '500', color: '#0F172A', lineHeight: '1.5' }}
                    >
                      {term.text}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTermsModal(term, 'invoice')}
                      aria-label="Edit term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#0F766E' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiEdit3 size={16} color="#0F766E" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(term, 'invoice')}
                      aria-label="Delete term"
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }}
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={16} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDoneSelectTermsInvoice} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isAddTermsModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsAddTermsModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingTermId ? 'Edit Terms and condition' : 'Add Terms and condition'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>TYPE</span>
                <div style={{ ...customerModuleStyles.fieldInput, color: '#0F172A' }}>Invoice</div>
                <textarea
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder="Terms and condition"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleAddTerm} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingTermId ? 'Update' : 'Add'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Paid Info List sub-screen (Matches Screenshots 2 & 3) -----
    if (quotationSubView === 'paidInfoList') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeInvoice')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Paid Info List</h1>
            <button type="button" onClick={openAddPaidInfoModal} aria-label="Add" style={customerModuleStyles.headerAddBtn}>
              <FiPlus size={18} color="#0F766E" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '90px' }}>
            {invoiceForm.paidInfo.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any paid info</p>
            ) : (
              invoiceForm.paidInfo.map((p) => {
                const isSelected = selectedPaidInfoIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePaidInfoSelection(p.id)}
                    style={{ ...customerModuleStyles.customerCard, ...(isSelected ? customerModuleStyles.termCardSelected : {}) }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={customerModuleStyles.customerName}>{'\u20B9'}{p.amount}</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{p.date}</span>
                      </div>
                      {p.note && <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{p.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditPaidInfoModal(p); }}
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#475569', marginLeft: '10px' }}
                      aria-label="Edit paid info"
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePaidInfoLine(p.id); }}
                      style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626', marginLeft: '10px' }}
                      aria-label="Delete paid info"
                    >
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div style={customerModuleStyles.doneBtnWrap}>
            <button type="button" onClick={handleDonePaidInfoList} style={customerModuleStyles.doneBtn}>DONE</button>
          </div>

          {isPaidInfoModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsPaidInfoModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingPaidInfoId ? 'Edit Paid Info' : 'Paid Info'}</h3>
                <button
                  type="button"
                  onClick={() => { setPaidInfoCalendarMonth(parseQuotationDate(paidInfoForm.date) || new Date()); setIsPaidInfoDatePickerOpen(true); }}
                  style={{ ...customerModuleStyles.fieldInput, textAlign: 'left', cursor: 'pointer', color: paidInfoForm.date ? '#0F172A' : '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{paidInfoForm.date || t('selectDatePlaceholder')}</span>
                  <span style={{ fontSize: '15px' }}>&#128197;</span>
                </button>
                <input
                  type="number"
                  value={paidInfoForm.amount}
                  onChange={(e) => setPaidInfoForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                  style={customerModuleStyles.fieldInput}
                />
                <textarea
                  value={paidInfoForm.note}
                  onChange={(e) => setPaidInfoForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Note"
                  style={customerModuleStyles.descriptionTextarea}
                />
                <button type="button" onClick={handleSavePaidInfo} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingPaidInfoId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          {/* ============ PAID INFO DATE CALENDAR POPUP ============ */}
          {isPaidInfoDatePickerOpen && (() => {
            const maxDateStr = toLocalISODate(new Date());
            const year = paidInfoCalendarMonth.getFullYear();
            const month = paidInfoCalendarMonth.getMonth();
            const firstWeekday = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < firstWeekday; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            const rows = [];
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

            return (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '340px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  <div style={{ backgroundColor: '#0B3C9B', padding: '20px 20px 16px 20px', color: '#ffffff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '4px' }}>{year}</div>
                    <div style={{ fontSize: '21px', fontWeight: '700' }}>{paidInfoForm.date ? paidInfoForm.date : t('selectDatePlaceholder')}</div>
                  </div>
                  <div style={{ padding: '16px 18px 4px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <button onClick={() => setPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&lsaquo;</button>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{paidInfoCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setPaidInfoCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#334155', padding: '4px 10px' }}>&rsaquo;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', fontWeight: '600', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {row.map((dayNum, ci) => {
                          if (!dayNum) return <div key={ci} />;
                          const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const displayStr = `${String(dayNum).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                          const isDisabled = isoStr > maxDateStr;
                          const isSelected = paidInfoForm.date === displayStr;
                          return (
                            <div
                              key={ci}
                              onClick={() => { if (isDisabled) return; setPaidInfoForm((prev) => ({ ...prev, date: displayStr })); setIsPaidInfoDatePickerOpen(false); }}
                              style={{
                                textAlign: 'center', padding: '9px 0', margin: '2px 0', borderRadius: '50%',
                                fontSize: '13px', fontWeight: isSelected ? '700' : '500',
                                cursor: isDisabled ? 'default' : 'pointer',
                                color: isDisabled ? '#CBD5E1' : (isSelected ? '#ffffff' : '#1E293B'),
                                backgroundColor: isSelected ? '#0B3C9B' : 'transparent'
                              }}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '22px', padding: '12px 20px 18px 20px' }}>
                    <button onClick={() => setIsPaidInfoDatePickerOpen(false)} style={{ background: 'none', border: 'none', color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>{t('cancel')}</button>
                  </div>
                </div>
              </div>
            );
          })()}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Invoice sub-screen (Matches Screenshot 1) -----
    if (quotationSubView === 'makeInvoice') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingInvoiceId ? 'Update Invoice' : 'Make Invoice'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makeInvoice'); setQuotationSubView('invoiceSettingsDetail'); }}
              aria-label="Invoice Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={makeQuotationStyles.infoRow}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Invoice Date</span>
                  <div style={makeQuotationStyles.infoValue}>{invoiceForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Invoice No</span>
                  <div style={makeQuotationStyles.infoValue}>{invoiceForm.invoiceNo || '-'}</div>
                </div>
              </div>
              <div style={{ ...makeQuotationStyles.infoRow, marginBottom: '14px' }}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Due Date</span>
                  <input
                    type="text"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    placeholder="-"
                    style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, width: '140px' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>PO No</span>
                  <input
                    type="text"
                    value={invoiceForm.poNo}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, poNo: e.target.value }))}
                    placeholder="-"
                    style={{ ...makeQuotationStyles.otherInfoInput, display: 'block', fontSize: '17px', fontWeight: '700', color: '#0F172A', marginTop: '4px', borderBottom: 'none', padding: 0, textAlign: 'right', width: '140px', marginLeft: 'auto' }}
                  />
                </div>
              </div>
              <div style={makeQuotationStyles.otherInfoRow}>
                <span style={makeQuotationStyles.infoLabel}>Other Info:</span>
                <input
                  type="text"
                  value={invoiceForm.otherInfo}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, otherInfo: e.target.value }))}
                  style={makeQuotationStyles.otherInfoInput}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={editingInvoiceId && selectedInvoiceCustomer ? undefined : openSelectCustomerForInvoice}
              disabled={!!(editingInvoiceId && selectedInvoiceCustomer)}
              style={{ ...makeQuotationStyles.sectionCard, ...(editingInvoiceId && selectedInvoiceCustomer ? { cursor: 'default' } : {}) }}
            >
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>BILL TO (CUSTOMER)</span>
                {!(editingInvoiceId && selectedInvoiceCustomer) && (
                  <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
                )}
              </div>
              {selectedInvoiceCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedInvoiceCustomer.name}</p>
                  {selectedInvoiceCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedInvoiceCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <div style={makeQuotationStyles.sectionCard}>
              <div
                role="button"
                tabIndex={0}
                onClick={openPickProductForInvoiceLine}
                style={{ ...makeQuotationStyles.sectionCardTopRow, cursor: 'pointer' }}
              >
                <span style={makeQuotationStyles.sectionCardLabel}>PRODUCTS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {invoiceForm.products.length > 0 && (
                <div style={{ ...makeQuotationStyles.sectionCardBody, gap: '10px' }}>
                  {invoiceForm.products.map((p) => {
                    const amount = (Number(p.price) || 0) * (Number(p.qty) || 0);
                    const totalAmount = amount * (1 + (Number(p.gst) || 0) / 100);
                    const fmt = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    return (
                      <div
                        key={p.productId}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditInvoiceProductLine(p)}
                        style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', border: '1px solid #E9ECF2' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{p.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                              <FiEdit3 size={14} color="#0F766E" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); removeInvoiceProductLine(p.productId); }}
                              style={makeQuotationStyles.removeIconBtn}
                              aria-label={`Remove ${p.name}`}
                            >
                              <FiTrash2 size={16} color="#DC2626" />
                            </span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Amount</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>{p.qty} * {'\u20B9'}{fmt(Number(p.price) || 0)} = {'\u20B9'}{fmt(amount)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Total amount</span>
                          <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{'\u20B9'}{fmt(totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={openInvoiceOtherChargeModal} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>OTHER CHARGE</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {invoiceForm.otherCharges.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {invoiceForm.otherCharges.map((c) => (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditInvoiceOtherChargeModal(c); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{c.label}{c.taxable && c.gstPercent > 0 ? ` (GST ${c.gstPercent}%)` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{c.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeInvoiceOtherCharge(c.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label={`Remove ${c.label}`}
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openSelectTermsForInvoice} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>TERMS & CONDITIONS</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedInvoiceTerms.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {selectedInvoiceTerms.map((term) => (
                    <div key={term.id} style={makeQuotationStyles.lineRow}>
                      <p style={{ ...makeQuotationStyles.sectionCardSubLine, flex: 1, marginRight: '10px' }}>{term.text}</p>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeInvoiceSelectedTerm(term.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove term"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>

            <button type="button" onClick={openPaidInfoList} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>PAID INFO</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {invoiceForm.paidInfo.length > 0 && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  {invoiceForm.paidInfo.map((p) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEditPaidInfoModal(p); setQuotationSubView('paidInfoList'); }}
                      style={{ ...makeQuotationStyles.lineRow, cursor: 'pointer' }}
                    >
                      <span style={makeQuotationStyles.sectionCardLine}>{p.date}{p.note ? ` — ${p.note}` : ''}</span>
                      <span style={makeQuotationStyles.lineRowRight}>
                        <span style={makeQuotationStyles.sectionCardLine}>{'\u20B9'}{p.amount}</span>
                        <span style={makeQuotationStyles.editIconBtn} aria-hidden="true">
                          <FiEdit3 size={14} color="#0F766E" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removePaidInfoLine(p.id); }}
                          style={makeQuotationStyles.removeIconBtn}
                          aria-label="Remove paid info"
                        >
                          <FiTrash2 size={16} color="#DC2626" />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>

          <div style={makeQuotationStyles.bottomBar}>
            <div>
              <span style={makeQuotationStyles.bottomBarLabel}>Amount Due</span>
              <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{invoiceAmountDue}</div>
            </div>
            <button type="button" onClick={handleGenerateInvoice} disabled={isSavingInvoice} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingInvoice ? 'default' : 'pointer', opacity: isSavingInvoice ? 0.7 : 1 }}>{isSavingInvoice ? 'Saving...' : (editingInvoiceId ? 'Update' : 'Generate')}</button>
          </div>

          {isInvoiceOtherChargeModalOpen && (
            <div style={customerModuleStyles.modalOverlay} onClick={() => setIsInvoiceOtherChargeModalOpen(false)}>
              <div style={customerModuleStyles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                <div style={customerModuleStyles.sheetHandle} />
                <h3 style={customerModuleStyles.sheetTitle}>{editingInvoiceOtherChargeId ? 'Edit Other Charge' : 'Other Charge Info'}</h3>
                <span style={customerModuleStyles.sheetSmallLabel}>Charge Name</span>
                <input
                  type="text"
                  value={invoiceOtherChargeForm.label}
                  onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Other Charges"
                  style={customerModuleStyles.fieldInput}
                />
                <input
                  type="number"
                  value={invoiceOtherChargeForm.amount}
                  onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="Other Charge Amount"
                  style={customerModuleStyles.fieldInput}
                />
                <div style={customerModuleStyles.taxableRow}>
                  <span style={customerModuleStyles.sheetSmallLabelInline}>Is Taxable?</span>
                  <input
                    type="checkbox"
                    checked={invoiceOtherChargeForm.taxable}
                    onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                    style={customerModuleStyles.checkbox}
                  />
                </div>
                {invoiceOtherChargeForm.taxable && (
                  <>
                    <span style={customerModuleStyles.sheetSmallLabel}>Tax %</span>
                    <input
                      type="number"
                      value={invoiceOtherChargeForm.gstPercent}
                      onChange={(e) => setInvoiceOtherChargeForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
                      placeholder="Tax Percentage"
                      style={customerModuleStyles.fieldInput}
                    />
                    {/* Tax preview */}
                    {invoiceOtherChargeForm.amount && Number(invoiceOtherChargeForm.amount) > 0 &&
                     invoiceOtherChargeForm.gstPercent && Number(invoiceOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#F1F5F9',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          Tax Amount ({invoiceOtherChargeForm.gstPercent}%)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                          ₹{(Number(invoiceOtherChargeForm.amount) * Number(invoiceOtherChargeForm.gstPercent) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {invoiceOtherChargeForm.amount && Number(invoiceOtherChargeForm.amount) > 0 &&
                     invoiceOtherChargeForm.gstPercent && Number(invoiceOtherChargeForm.gstPercent) > 0 && (
                      <div style={{
                        background: '#ECFDF5',
                        borderRadius: '10px',
                        padding: '12px',
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', color: '#065F46' }}>
                          Total (including tax)
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#065F46' }}>
                          ₹{(Number(invoiceOtherChargeForm.amount) * (1 + Number(invoiceOtherChargeForm.gstPercent) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <button type="button" onClick={handleSaveInvoiceOtherCharge} style={{ ...customerModuleStyles.addBtn, marginTop: '14px' }}>{editingInvoiceOtherChargeId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Invoice List sub-screen (Matches Screenshot 4) -----
    if (quotationSubView === 'invoiceList') {
      const searchInvoice = (inv) => {
        const qs = invoiceSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return inv.customerName.toLowerCase().includes(qs) ||
               (inv.customerCompany || '').toLowerCase().includes(qs) ||
               (inv.invoiceNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Invoice</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Invoice#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {invoices.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>No invoices generated yet.</p>
            ) : (
              sortDocumentsByCreated(invoices.filter(searchInvoice)).map((inv) => (
                <DocumentListCard
                  key={inv.id}
                  onClick={() => { setSelectedInvoiceId(inv.id); setQuotationSubView('invoiceDetail'); }}
                  name={inv.customerName}
                  docNumber={inv.invoiceNo || 'INV-' + inv.id.slice(0, 4)}
                  date={inv.date}
                  amount={inv.grandTotal}
                  status={normalizeInvoiceStatus(inv.status)}
                />
              ))
            )}
          </div>

          <button type="button" onClick={openMakeInvoice} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Invoice</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Invoice Detail sub-screen -----
    if (quotationSubView === 'invoiceDetail') {
      const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
      if (!currentInvoice) {
        setQuotationSubView('invoiceList');
        return null;
      }

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('invoiceList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Invoice Detail</h1>
            <button type="button" onClick={() => handleShareInvoice(currentInvoice)} aria-label="Share invoice" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <DocumentStatusBadge status={normalizeInvoiceStatus(currentInvoice.status)} />
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', boxSizing: 'border-box' }}>
              <div style={docStyles.page}>
                <GeneratedDocumentPreview model={buildInvoiceDocModel(currentInvoice)} />
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR (Duplicate, Edit, Status, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicateInvoice(currentInvoice)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditInvoice(currentInvoice)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button onClick={() => setShowInvoiceConvertSheet(true)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📑</span></span>
              <span style={docActionBarStyles.label}>Convert</span>
            </button>
            <button onClick={() => setShowInvoiceStatusSheet(true)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>💬</span></span>
              <span style={docActionBarStyles.label}>Status</span>
            </button>
            <button
              onClick={() => {
                showConfirm('Delete this invoice?', async () => {
                  const previous = invoices;
                  const deletedId = selectedInvoiceId;
                  persistInvoices(invoices.filter(inv => inv.id !== deletedId));
                  setQuotationSubView('invoiceList');
                  try {
                    await invoicesService.deleteInvoice(deletedId);
                  } catch (error) {
                    console.error('Error deleting invoice:', error);
                    persistInvoices(previous);
                    showAlert('Could not delete the invoice. Please try again.');
                  }
                });
              }}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          <DocumentStatusSheet
            open={showInvoiceStatusSheet}
            title="Invoice Status"
            options={INVOICE_STATUS_OPTIONS}
            onSelect={handleSetInvoiceStatus}
            onClose={() => setShowInvoiceStatusSheet(false)}
          />

          {/* CONVERSION BOTTOM SHEET (Convert click) */}
          {showInvoiceConvertSheet && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowInvoiceConvertSheet(false)}>
              <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '12px 20px 30px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#E2E8F0', margin: '4px auto 20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px' }}>Do you want to convert this Invoice to...</h3>

                <button
                  onClick={async () => {
                    setShowInvoiceConvertSheet(false);
                    if (!loggedInUser?.userId) {
                      showAlert('You need to be signed in to convert this invoice.');
                      return;
                    }
                    const payload = {
                      deliveryNoteNo: getNextDeliveryNoteNumber(),
                      date: formatQuotationDate(new Date()),
                      refNo: currentInvoice.invoiceNo || '',
                      otherInfo: currentInvoice.otherInfo || '',
                      customerId: currentInvoice.customerId,
                      products: currentInvoice.products || [],
                      otherCharges: [],
                      termsIds: [],
                      customerName: currentInvoice.customerName,
                      customerCompany: currentInvoice.customerCompany,
                      customerMobile: currentInvoice.customerMobile,
                      customerEmail: currentInvoice.customerEmail,
                      customerAddressLine1: currentInvoice.customerAddressLine1,
                      customerAddressLine2: currentInvoice.customerAddressLine2,
                      customerAddressLine3: currentInvoice.customerAddressLine3,
                      customerBillingAddress: currentInvoice.customerBillingAddress,
                      customerShippingAddress: currentInvoice.customerShippingAddress,
                      docSnapshot: JSON.stringify(buildDocSettingsSnapshot(deliveryNoteSettings)),
                    };
                    try {
                      // Convert always creates a brand-new, independently deletable Delivery
                      // Note on the server; the source Invoice is left untouched.
                      const created = await deliveryNotesService.createDeliveryNote(loggedInUser.userId, payload);
                      const parsedCreated = { ...created, docSnapshot: created.docSnapshot ? JSON.parse(created.docSnapshot) : null };
                      persistDeliveryNotes([...deliveryNotes, parsedCreated]);
                      showSuccess('Converted to Delivery Note successfully.');
                      setSelectedDeliveryNoteId(created.id);
                      setQuotationSubView('deliveryNoteDetail');
                    } catch (error) {
                      console.error('Error converting invoice to delivery note:', error);
                      showAlert('Could not convert to Delivery Note. Please try again.');
                    }
                  }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '14px 0', borderBottom: '1px solid #F1F5F9', fontSize: '17px', color: '#0F172A', cursor: 'pointer' }}
                >
                  Convert To Delivery Note
                </button>
                <button onClick={() => setShowInvoiceConvertSheet(false)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 0 0', fontSize: '17px', color: '#64748B', cursor: 'pointer', marginTop: '8px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Select Customer sub-screen (used from Make Receipt) -----
    if (quotationSubView === 'selectCustomerForReceipt') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeReceipt')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Select Customer</h1>
            {renderNameSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by Name OR Company Name"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p style={customerModuleStyles.emptyText}>
                {customers.length === 0 ? 'No customers added yet. Tap "Add Customer" to create one.' : 'No customers match your search.'}
              </p>
            ) : (
              sortByName(filteredCustomers, (c) => c.name).map((customer) => (
                <div key={customer.id} style={customerModuleStyles.customerCard}>
                  <button type="button" onClick={() => handleSelectCustomerForReceipt(customer)} style={customerModuleStyles.selectRowBtn}>
                    <span style={customerModuleStyles.customerName}>{customer.name}</span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button type="button" onClick={() => openEditCustomer(customer, 'selectCustomerForReceipt')} style={{ ...customerModuleStyles.rowActionBtn, color: '#475569' }} aria-label="Edit customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><HiOutlinePencil size={18} color="#475569" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Edit</span>
                    </button>
                    <button type="button" onClick={() => handleDeleteCustomer(customer)} style={{ ...customerModuleStyles.rowActionBtn, color: '#DC2626' }} aria-label="Delete customer">
                      <span style={customerModuleStyles.rowActionIconWrap}><FiTrash2 size={18} color="#DC2626" /></span>
                      <span style={customerModuleStyles.rowActionLabel}>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" onClick={() => openAddCustomer('selectCustomerForReceipt')} style={customerModuleStyles.fab}>
            <FiPlus size={14} color="#ffffff" />
            <span>ADD<br />CUSTOMER</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Receipt Payment Info sub-screen (Matches Screenshot 3) -----
    if (quotationSubView === 'receiptPaymentInfo') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView('makeReceipt')} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Receipt Payment Info</h1>
            <span style={customerModuleStyles.headerIconBtn} />
          </div>

          <div style={customerModuleStyles.formBody}>
            <p style={customerModuleStyles.sheetSmallLabel}>PAYMENT MODE</p>
            <div style={{ position: 'relative' }}>
              <select
                value={receiptPaymentDraft.paymentMode}
                onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paymentMode: e.target.value }))}
                style={{ ...customerModuleStyles.fieldInput, appearance: 'none', WebkitAppearance: 'none', color: receiptPaymentDraft.paymentMode ? '#0F172A' : '#64748B', paddingRight: '40px' }}
              >
                <option value="">Select Payment Mode</option>
                {RECEIPT_PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              <FiChevronDown size={18} color="#64748B" style={{ position: 'absolute', right: '16px', top: '18px', pointerEvents: 'none' }} />
            </div>

            <input
              type="text"
              value={receiptPaymentDraft.referenceNo}
              onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, referenceNo: e.target.value }))}
              placeholder="Payment Reference Number"
              style={customerModuleStyles.fieldInput}
            />

            <input
              type="number"
              value={receiptPaymentDraft.paidAmount}
              onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paidAmount: e.target.value }))}
              placeholder="Total Amount Paid"
              style={customerModuleStyles.fieldInput}
            />

            <textarea
              value={receiptPaymentDraft.paymentFor}
              onChange={(e) => setReceiptPaymentDraft((prev) => ({ ...prev, paymentFor: e.target.value }))}
              placeholder="Payment For"
              style={{ ...customerModuleStyles.descriptionTextarea, marginBottom: '20px' }}
            />

            <button type="button" onClick={handleSaveReceiptPaymentInfo} style={customerModuleStyles.addBtn}>Save</button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Make Receipt sub-screen (Matches Screenshot 2) -----
    if (quotationSubView === 'makeReceipt') {
      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button
              type="button"
              onClick={() => {
                requestQuotationLeave();
              }}
              aria-label="Back"
              style={customerModuleStyles.headerIconBtn}
            >
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>{editingReceiptId ? 'Update Receipt' : 'Make Receipt'}</h1>
            <button
              type="button"
              onClick={() => { setSettingsReturnView('makeReceipt'); setQuotationSubView('receiptSettingsDetail'); }}
              aria-label="Receipt Settings"
              style={customerModuleStyles.headerIconBtn}
            >
              <HiOutlineCog6Tooth size={19} color="#ffffff" />
            </button>
          </div>

          <div style={{ ...customerModuleStyles.body, paddingBottom: '110px' }}>
            <div style={makeQuotationStyles.infoPanel}>
              <div style={{ ...makeQuotationStyles.infoRow, marginBottom: 0 }}>
                <div>
                  <span style={makeQuotationStyles.infoLabel}>Receipt Date</span>
                  <div style={makeQuotationStyles.infoValue}>{receiptForm.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={makeQuotationStyles.infoLabel}>Receipt No</span>
                  <div style={makeQuotationStyles.infoValue}>{receiptForm.receiptNo || '-'}</div>
                </div>
              </div>
            </div>

            <button type="button" onClick={openSelectCustomerForReceipt} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>RECEIVED FROM (CUSTOMER)</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {selectedReceiptCustomer && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{selectedReceiptCustomer.name}</p>
                  {selectedReceiptCustomer.companyName && <p style={makeQuotationStyles.sectionCardSubLine}>{selectedReceiptCustomer.companyName}</p>}
                </div>
              )}
            </button>

            <button type="button" onClick={openReceiptPaymentInfo} style={makeQuotationStyles.sectionCard}>
              <div style={makeQuotationStyles.sectionCardTopRow}>
                <span style={makeQuotationStyles.sectionCardLabel}>PAYMENT INFO</span>
                <span style={makeQuotationStyles.plusBadge}><FiPlus size={17} color="#ffffff" /></span>
              </div>
              {receiptForm.paidAmount && (
                <div style={makeQuotationStyles.sectionCardBody}>
                  <p style={makeQuotationStyles.sectionCardLine}>{receiptForm.paymentMode || 'Payment'}{receiptForm.referenceNo ? ` \u2014 ${receiptForm.referenceNo}` : ''}</p>
                  <p style={makeQuotationStyles.sectionCardSubLine}>{'\u20B9'}{receiptForm.paidAmount}</p>
                </div>
              )}
            </button>

            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px 18px', boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)' }}>
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Payment Mode</p>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.paymentMode || '\u2014'}</p>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Reference No</p>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.referenceNo || '\u2014'}</p>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Total Paid</p>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>{receiptForm.paidAmount ? `\u20B9${receiptForm.paidAmount}` : '\u2014'}</p>
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '0 0 8px' }}>Payment For</p>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>{receiptForm.paymentFor || '\u2014'}</p>
              </div>
            </div>
          </div>

          <div style={makeQuotationStyles.bottomBar}>
            <div>
              <span style={makeQuotationStyles.bottomBarLabel}>Paid Amount</span>
              <div style={makeQuotationStyles.bottomBarAmount}>{'\u20B9'}{receiptPaidAmount}</div>
            </div>
            <button type="button" onClick={handleGenerateReceipt} disabled={isSavingReceipt} style={{ ...makeQuotationStyles.generateBtn, cursor: isSavingReceipt ? 'default' : 'pointer', opacity: isSavingReceipt ? 0.7 : 1 }}>{isSavingReceipt ? 'Saving...' : (editingReceiptId ? 'Update' : 'Generate')}</button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Receipt List sub-screen (Matches Screenshot 1) -----
    if (quotationSubView === 'receiptList') {
      const searchReceipt = (r) => {
        const qs = receiptSearchQuery.trim().toLowerCase();
        if (!qs) return true;
        return (r.customerName || '').toLowerCase().includes(qs) ||
               (r.customerCompany || '').toLowerCase().includes(qs) ||
               (r.receiptNo || '').toLowerCase().includes(qs);
      };

      return (
        <div style={customerModuleStyles.screen}>
          <div style={customerModuleStyles.header}>
            <button type="button" onClick={() => setQuotationSubView(null)} aria-label="Back" style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={19} color="#ffffff" />
            </button>
            <h1 style={customerModuleStyles.headerTitle}>Receipt</h1>
            {renderSortMenu()}
          </div>

          <div style={customerModuleStyles.body}>
            {/* Search Bar */}
            <div style={customerModuleStyles.searchBox}>
              <FiSearch size={17} color="#94A3B8" />
              <input
                type="text"
                value={receiptSearchQuery}
                onChange={(e) => setReceiptSearchQuery(e.target.value)}
                placeholder="Search by Name, Company OR Receipt#"
                style={customerModuleStyles.searchInput}
              />
            </div>

            {/* List */}
            {receipts.length === 0 ? (
              <p style={{ ...customerModuleStyles.emptyText, marginTop: '160px' }}>You don't have any receipt</p>
            ) : (
              sortDocumentsByCreated(receipts.filter(searchReceipt)).map((r) => (
                <DocumentListCard
                  key={r.id}
                  onClick={() => { setSelectedReceiptId(r.id); setQuotationSubView('receiptDetail'); }}
                  name={r.customerName}
                  docNumber={r.receiptNo || 'RECEIPT-' + r.id.slice(0, 4)}
                  date={r.date}
                  amount={r.paidAmount}
                />
              ))
            )}
          </div>

          <button type="button" onClick={openMakeReceipt} style={customerModuleStyles.fabCompact}>
            <FiPlus size={14} color="#ffffff" />
            <span>New<br />Receipt</span>
          </button>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    // ----- Receipt Detail sub-screen -----
    if (quotationSubView === 'receiptDetail') {
      const currentReceipt = receipts.find(r => r.id === selectedReceiptId);
      if (!currentReceipt) {
        setQuotationSubView('receiptList');
        return null;
      }
      // Frozen Business Info / Receipt Settings from when this receipt was created or
      // last edited-and-updated; falls back to live values only for receipts saved
      // before this snapshot existed.
      const receiptSnap = currentReceipt.docSnapshot || buildDocSettingsSnapshot(receiptSettings);

      return (
        <div style={{ width: '100%', height: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: '#0F766E', padding: '14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button type="button" onClick={() => setQuotationSubView('receiptList')} style={customerModuleStyles.headerIconBtn}>
              <FiArrowLeft size={24} color="#ffffff" />
            </button>
            <h1 style={{ ...customerModuleStyles.headerTitle, margin: 0 }}>Receipt Detail</h1>
            <button type="button" onClick={() => handleShareReceipt(currentReceipt)} aria-label="Share receipt" style={customerModuleStyles.headerIconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
          </div>

          {/* DOCUMENT PREVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: '100%', padding: '18px 14px 26px', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...docStyles.page, flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Header: Receipt # (top, centered), then Business info + logo below - matches Quotation Detail */}
              <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
                <p style={{ ...docStyles.docTypeLabel, textTransform: 'none', textAlign: 'center', margin: '0 0 12px' }}>
                  Receipt
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={docStyles.businessName}>{receiptSnap.businessName || 'Manufacturer'}</h2>
                    {receiptSnap.businessPhone && <p style={docStyles.contactLine}>{receiptSnap.businessPhone}</p>}
                    {receiptSnap.businessEmail && <p style={docStyles.contactLine}>{receiptSnap.businessEmail}</p>}
                  </div>
                  {receiptSnap.logoImg && (
                    <img src={receiptSnap.logoImg} alt="Business Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }} />
                  )}
                </div>
              </div>

              {/* To, (left) | Date (right) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...docStyles.sectionLabel, textTransform: 'none' }}>To,</p>
                  <p style={docStyles.toName}>
                    {(currentReceipt.customerCompany && currentReceipt.customerName)
                      ? `${currentReceipt.customerCompany} -> ${currentReceipt.customerName}`
                      : (currentReceipt.customerCompany || currentReceipt.customerName)}
                  </p>
                  {(currentReceipt.customerBillingAddress || [currentReceipt.customerAddressLine1, currentReceipt.customerAddressLine2, currentReceipt.customerAddressLine3].filter(Boolean).join(', ')) && (
                    <p style={docStyles.contactLine}>
                      {currentReceipt.customerBillingAddress || [currentReceipt.customerAddressLine1, currentReceipt.customerAddressLine2, currentReceipt.customerAddressLine3].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {currentReceipt.customerMobile && (
                    <p style={docStyles.contactLine}>Mobile: {currentReceipt.customerMobile}</p>
                  )}
                  {currentReceipt.customerEmail && (
                    <p style={docStyles.contactLine}>Email: {currentReceipt.customerEmail}</p>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={docStyles.docMetaLine}>Date: {currentReceipt.date}</p>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <p style={docStyles.sectionLabel}>Payment Details</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                  <span>Payment Mode</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.paymentMode || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                  <span>Reference No</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.referenceNo || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', padding: '7px 0', borderBottom: '1px solid #EEF1F5' }}>
                  <span>Payment For</span><span style={{ fontWeight: '600', color: '#0F172A' }}>{currentReceipt.paymentFor || '-'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '14px', borderTop: '1.5px solid #0F172A', paddingTop: '10px' }}>
                <span style={docStyles.grandTotalLabel}>Total Paid </span>
                <span style={docStyles.grandTotalValue}>₹{Number(currentReceipt.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>

              {receiptSnap.showSignature !== 'No' && (
                <div style={{ textAlign: 'right', marginTop: '30px' }}>
                  <p style={docStyles.signatureLabel}>For, {receiptSnap.businessName || 'Manufacturer'}</p>
                  {receiptSnap.signatureImg ? (
                    <img src={receiptSnap.signatureImg} alt="Authorized Signature" style={{ height: '34px', maxWidth: '160px', objectFit: 'contain', marginLeft: 'auto', display: 'block' }} />
                  ) : (
                    <div style={{ height: '34px' }}></div>
                  )}
                  <p style={docStyles.signatureCaption}>Authorized Signature</p>
                </div>
              )}

              {/* Generated with SmartManage - brand footer */}
              <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={smartpayLogo} alt="SmartManage" style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'cover', display: 'block' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.2px' }}>Generated with SmartManage</span>
              </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR (Duplicate, Edit, Delete) */}
          <div style={docActionBarStyles.bar}>
            <button onClick={() => handleDuplicateReceipt(currentReceipt)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>📄</span></span>
              <span style={docActionBarStyles.label}>Duplicate</span>
            </button>
            <button onClick={() => openEditReceipt(currentReceipt)} style={docActionBarStyles.btn}>
              <span style={docActionBarStyles.iconWrap}><span style={{ fontSize: '22px', lineHeight: 1 }}>✏️</span></span>
              <span style={docActionBarStyles.label}>Edit</span>
            </button>
            <button
              onClick={() => {
showConfirm('Delete this receipt?', async () => {
  const previous = receipts;
  const deletedId = selectedReceiptId;
  persistReceipts(receipts.filter(r => r.id !== deletedId));
  setQuotationSubView('receiptList');
  try {
    await receiptsService.deleteReceipt(deletedId);
  } catch (error) {
    console.error('Error deleting receipt:', error);
    persistReceipts(previous);
    showAlert('Could not delete the receipt. Please try again.');
  }
});
}}
              style={{ ...docActionBarStyles.btn, color: '#DC2626' }}
            >
              <span style={docActionBarStyles.iconWrap}><FiTrash2 size={20} color="#DC2626" /></span>
              <span style={docActionBarStyles.label}>Delete</span>
            </button>
          </div>

          <AppPopup
            open={!!appPopup?.open}
            tone={appPopup?.tone}
            title={appPopup?.title}
            message={appPopup?.message}
            confirmLabel={appPopup?.confirmLabel}
            cancelLabel={appPopup?.cancelLabel}
            onConfirm={appPopup?.onConfirm || closeAppPopup}
            onCancel={closeAppPopup}
            onClose={closeAppPopup}
          />
        </div>
      );
    }

    const manageItems = [
      { key: 'business', label: 'BUSINESS', icon: HiOutlineBuildingOffice2 },
      { key: 'customer', label: 'CUSTOMER', icon: FiUser },
      { key: 'product', label: 'PRODUCT', icon: FiBox },
    ];
    const discoverTiles = [
      { key: 'quotationList', title: 'Quotation' },
      { key: 'purchaseOrder', title: 'Purchase Order' },
      { key: 'invoiceList', title: 'Invoice' },
      { key: 'proformaInvoice', title: 'Proforma Invoice' },
      { key: 'receipt', title: 'Receipt' },
      { key: 'deliveryNote', title: 'Delivery Note' },
    ];
    // TODO: remaining tiles (terms as a Discover tile, quotationList, and the other 6 Discover tiles) still no-op —
    // wire these up once the destination screens are defined.
    const handleManageTap = (key) => {
      if (key === 'business') { setQuotationSubView('business'); return; }
      if (key === 'customer') { setCustomerSearchQuery(''); setQuotationSubView('customerList'); return; }
      if (key === 'product') { setProductSearchQuery(''); setQuotationSubView('productList'); return; }
    };
    const handleDiscoverTap = (key) => {
      if (key === 'makeQuotation') { openMakeQuotation(); return; }
      if (key === 'quotationList') { setQuotationSearchQuery(''); setQuotationSubView('quotationList'); return; }
      if (key === 'makeInvoice') { openMakeInvoice(); return; }
      if (key === 'invoiceList') { setInvoiceSearchQuery(''); setQuotationSubView('invoiceList'); return; }
      if (key === 'purchaseOrder') { setPurchaseOrderSearchQuery(''); setQuotationSubView('purchaseOrderList'); return; }
      if (key === 'proformaInvoice') { setProformaInvoiceSearchQuery(''); setQuotationSubView('proformaInvoiceList'); return; }
      if (key === 'deliveryNote') { setDeliveryNoteSearchQuery(''); setQuotationSubView('deliveryNoteList'); return; }
      if (key === 'receipt') { setReceiptSearchQuery(''); setQuotationSubView('receiptList'); return; }
    };

    return (
      <div style={quotationModuleStyles.screen}>
        <div style={{ ...themeStyles.authHeader, backgroundColor: '#0F766E', padding: '14px 14px', height: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              aria-label="Back to main page"
              style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: '10px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
            >
              <FiArrowLeft size={16} color="#ffffff" />
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', flexShrink: 0 }}>
              {profileImg ? (
                <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(loggedInUser?.fullName) || 'GS'
              )}
            </div>
            <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
              {loggedInUser?.fullName ? loggedInUser.fullName.replace(/[^a-zA-Z0-9 ]/g, '') : 'Guest'}
            </span>
          </div>
          {/* Settings moved to each individual document's own header (Make Quotation, Make
              Invoice, etc.) - this spacer just keeps the profile row centered/balanced. */}
          <span style={{ width: '32px', height: '32px', flexShrink: 0 }} />
        </div>

        <div style={quotationModuleStyles.bodyRow}>
          <div style={quotationModuleStyles.bodyInner}>
            <div style={quotationModuleStyles.manageSection}>
              <h2 style={quotationModuleStyles.sectionLabel}>Manage</h2>
              <div style={quotationModuleStyles.manageRow}>
                {manageItems.map((item) => (
                  <button type="button" key={item.key} onClick={() => handleManageTap(item.key)} style={quotationModuleStyles.manageItemHorizontal}>
                    <span style={quotationModuleStyles.manageIconCircle}>
                      <item.icon size={20} color="#0F766E" />
                    </span>
                    <span style={quotationModuleStyles.manageLabelHorizontal}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={quotationModuleStyles.discoverSection}>
              <h2 style={quotationModuleStyles.sectionLabel}>Discover</h2>
              <div style={quotationModuleStyles.discoverGrid}>
                {discoverTiles.map((tile) => (
                  <button type="button" key={tile.key} onClick={() => handleDiscoverTap(tile.key)} style={quotationModuleStyles.discoverTile}>
                    <span style={quotationModuleStyles.discoverBadge}>
                      <FiFileText size={19} color="#ffffff" />
                    </span>
                    <span style={quotationModuleStyles.discoverTitle}>{tile.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AppPopup
          open={!!appPopup?.open}
          tone={appPopup?.tone}
          title={appPopup?.title}
          message={appPopup?.message}
          confirmLabel={appPopup?.confirmLabel}
          cancelLabel={appPopup?.cancelLabel}
          onConfirm={appPopup?.onConfirm || closeAppPopup}
          onCancel={closeAppPopup}
          onClose={closeAppPopup}
        />
        {renderProfileModal()}
        {renderImageCropperModal()}
      </div>
    );
  
}
