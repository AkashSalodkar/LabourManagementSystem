import { api } from '../../shared/services';

// ===== CUSTOMERS SERVICE ===== (Backed by CustomersController.cs)
export const customerService = {
  getCustomers: (userId) => api.get(`/customers?userId=${userId}`),
  createCustomer: (userId, data) => api.post(`/customers?userId=${userId}`, data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

// ===== DOCUMENTS SERVICE (Quotations, Invoices, Purchase Orders, Proforma =====
// ===== Invoices, Delivery Notes, Receipts, Terms & Settings) =====
// Backed by DocumentsController.cs. Field names in QuotationRequestDto /
// QuotationResponseDto already camelCase-match the local `quotationForm` /
// `quotations[]` shape used throughout the UI (date, quotationNo, otherInfo,
// customerId, products[], otherCharges[], termsIds[], grandTotal, status,
// createdAt, updatedAt, customer* snapshot fields) so API responses can be
// used directly as quotation objects without extra mapping.
export const documentService = {
  getQuotations: (userId) => api.get(`/documents/quotations?userId=${userId}`),
  getQuotation: (id) => api.get(`/documents/quotations/${id}`),
  createQuotation: (userId, data) => api.post(`/documents/quotations?userId=${userId}`, data),
  updateQuotation: (id, data) => api.put(`/documents/quotations/${id}`, data),
  updateQuotationStatus: (id, status) => api.patch(`/documents/quotations/${id}/status`, status),
  deleteQuotation: (id) => api.delete(`/documents/quotations/${id}`),
};

// ===== Add these service definitions after the existing services =====

// ===== BUSINESS INFO SERVICE =====
export const businessInfoService = {
  getBusinessInfo: (userId) => api.get(`/businessinfo?userId=${userId}`),
  updateBusinessInfo: (userId, data) => api.put(`/businessinfo?userId=${userId}`, data),
};

// ===== PRODUCTS SERVICE =====
export const productsService = {
  getProducts: (userId) => api.get(`/products?userId=${userId}`),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (userId, data) => api.post(`/products?userId=${userId}`, data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// ===== INVOICES SERVICE =====
export const invoicesService = {
  getInvoices: (userId) => api.get(`/documents/invoices?userId=${userId}`),
  getInvoice: (id) => api.get(`/documents/invoices/${id}`),
  createInvoice: (userId, data) => api.post(`/documents/invoices?userId=${userId}`, data),
  updateInvoice: (id, data) => api.put(`/documents/invoices/${id}`, data),
  updateInvoiceStatus: (id, status) => api.patch(`/documents/invoices/${id}/status`, status),
  deleteInvoice: (id) => api.delete(`/documents/invoices/${id}`),
};

// ===== PURCHASE ORDERS SERVICE =====
export const purchaseOrdersService = {
  getPurchaseOrders: (userId) => api.get(`/documents/purchaseorders?userId=${userId}`),
  getPurchaseOrder: (id) => api.get(`/documents/purchaseorders/${id}`),
  createPurchaseOrder: (userId, data) => api.post(`/documents/purchaseorders?userId=${userId}`, data),
  updatePurchaseOrder: (id, data) => api.put(`/documents/purchaseorders/${id}`, data),
  updatePurchaseOrderStatus: (id, status) => api.patch(`/documents/purchaseorders/${id}/status`, status),
  deletePurchaseOrder: (id) => api.delete(`/documents/purchaseorders/${id}`),
};

// ===== PROFORMA INVOICES SERVICE =====
export const proformaInvoicesService = {
  getProformaInvoices: (userId) => api.get(`/documents/proformainvoices?userId=${userId}`),
  getProformaInvoice: (id) => api.get(`/documents/proformainvoices/${id}`),
  createProformaInvoice: (userId, data) => api.post(`/documents/proformainvoices?userId=${userId}`, data),
  updateProformaInvoice: (id, data) => api.put(`/documents/proformainvoices/${id}`, data),
  updateProformaInvoiceStatus: (id, status) => api.patch(`/documents/proformainvoices/${id}/status`, status),
  deleteProformaInvoice: (id) => api.delete(`/documents/proformainvoices/${id}`),
};

// ===== DELIVERY NOTES SERVICE =====
export const deliveryNotesService = {
  getDeliveryNotes: (userId) => api.get(`/documents/deliverynotes?userId=${userId}`),
  getDeliveryNote: (id) => api.get(`/documents/deliverynotes/${id}`),
  createDeliveryNote: (userId, data) => api.post(`/documents/deliverynotes?userId=${userId}`, data),
  updateDeliveryNote: (id, data) => api.put(`/documents/deliverynotes/${id}`, data),
  updateDeliveryNoteStatus: (id, status) => api.patch(`/documents/deliverynotes/${id}/status`, status),
  deleteDeliveryNote: (id) => api.delete(`/documents/deliverynotes/${id}`),
};

// ===== RECEIPTS SERVICE =====
export const receiptsService = {
  getReceipts: (userId) => api.get(`/documents/receipts?userId=${userId}`),
  getReceipt: (id) => api.get(`/documents/receipts/${id}`),
  createReceipt: (userId, data) => api.post(`/documents/receipts?userId=${userId}`, data),
  updateReceipt: (id, data) => api.put(`/documents/receipts/${id}`, data),
  updateReceiptStatus: (id, status) => api.patch(`/documents/receipts/${id}/status`, status),
  deleteReceipt: (id) => api.delete(`/documents/receipts/${id}`),
};

// ===== SETTINGS SERVICE =====
export const settingsService = {
  // Get all settings in one call
  getSettings: (userId) => api.get(`/documents/settings?userId=${userId}`),
  // Individual settings updates
  updateQuotationSettings: (userId, data) => api.put(`/documents/settings/quotation?userId=${userId}`, data),
  updateInvoiceSettings: (userId, data) => api.put(`/documents/settings/invoice?userId=${userId}`, data),
  updatePurchaseOrderSettings: (userId, data) => api.put(`/documents/settings/purchaseorder?userId=${userId}`, data),
  updateProformaInvoiceSettings: (userId, data) => api.put(`/documents/settings/proformainvoice?userId=${userId}`, data),
  updateDeliveryNoteSettings: (userId, data) => api.put(`/documents/settings/deliverynote?userId=${userId}`, data),
  updateReceiptSettings: (userId, data) => api.put(`/documents/settings/receipt?userId=${userId}`, data),
  updateColumnHeadingSettings: (userId, data) => api.put(`/documents/settings/columnheading?userId=${userId}`, data),
};

// ===== TERMS SERVICE =====
export const termsService = {
  getTerms: (userId, documentType) => api.get(`/documents/terms?userId=${userId}&documentType=${documentType}`),
  createTerm: (userId, documentType, data) => api.post(`/documents/terms?userId=${userId}&documentType=${documentType}`, data),
  updateTerm: (id, data) => api.put(`/documents/terms/${id}`, data),
  deleteTerm: (id) => api.delete(`/documents/terms/${id}`),
};
