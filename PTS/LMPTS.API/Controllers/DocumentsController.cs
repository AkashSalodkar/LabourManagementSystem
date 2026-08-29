using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(ApplicationDbContext context, ILogger<DocumentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================================
        // QUOTATIONS
        // ============================================================

        [HttpGet("quotations")]
        public async Task<IActionResult> GetQuotations([FromQuery] int userId)
        {
            try
            {
                var quotations = await _context.Quotations
                    .Where(q => q.UserId == userId)
                    .OrderByDescending(q => q.CreatedAt)
                    .ToListAsync();

                var ids = quotations.Select(q => q.Id).ToList();
                var productsMap = await GetProductsMapAsync("Quotation", ids);
                var chargesMap = await GetOtherChargesMapAsync("Quotation", ids);
                var termsMap = await GetTermSelectionsMapAsync("Quotation", ids);

                return Ok(quotations.Select(q => MapQuotationToResponse(q, productsMap[q.Id], chargesMap[q.Id], termsMap[q.Id])));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quotations for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching quotations." });
            }
        }

        [HttpGet("quotations/{id}")]
        public async Task<IActionResult> GetQuotation(int id)
        {
            try
            {
                var quotation = await _context.Quotations
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                var products = await GetProductsAsync("Quotation", id);
                var charges = await GetOtherChargesAsync("Quotation", id);
                var terms = await GetTermSelectionsAsync("Quotation", id);

                return Ok(MapQuotationToResponse(quotation, products, charges, terms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting quotation {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the quotation." });
            }
        }

        [HttpPost("quotations")]
        public async Task<IActionResult> CreateQuotation([FromBody] QuotationRequestDto request, [FromQuery] int userId)
        {
            try
            {
                // Add detailed logging
                _logger.LogInformation("Creating quotation for user {UserId}. Date: {Date}, QuotationNo: {QuotationNo}",
                    userId, request.Date, request.QuotationNo);

                // Validate request
                if (request == null)
                {
                    return BadRequest(new { message = "Quotation data is required." });
                }

                // Validate date
                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date}", request.Date);
                    return BadRequest(new { message = $"Invalid date format: {request.Date}. Please use DD/MM/YYYY." });
                }

                var quotation = new Quotation { UserId = userId };
                MapQuotationRequestToEntity(request, quotation);
                quotation.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                quotation.Status = "In-Progress";

                _context.Quotations.Add(quotation);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(quotation.Id, "Quotation", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("Quotation", quotation.Id);
                var newCharges = await GetOtherChargesAsync("Quotation", quotation.Id);
                var newTerms = await GetTermSelectionsAsync("Quotation", quotation.Id);

                return CreatedAtAction(nameof(GetQuotation), new { id = quotation.Id }, MapQuotationToResponse(quotation, newProducts, newCharges, newTerms));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating quotation for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating quotation for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating quotation: " + ex.Message });
            }
        }

        [HttpPut("quotations/{id}")]
        public async Task<IActionResult> UpdateQuotation(int id, [FromBody] QuotationRequestDto request)
        {
            try
            {
                var quotation = await _context.Quotations
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                MapQuotationRequestToEntity(request, quotation);
                quotation.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                quotation.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                var existingProducts = await GetProductsAsync("Quotation", id);
                var existingCharges = await GetOtherChargesAsync("Quotation", id);
                var existingTerms = await GetTermSelectionsAsync("Quotation", id);
                _context.DocumentProducts.RemoveRange(existingProducts);
                _context.DocumentOtherCharges.RemoveRange(existingCharges);
                _context.DocumentTermSelections.RemoveRange(existingTerms);

                await SaveDocumentChildren(quotation.Id, "Quotation", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("Quotation", id);
                var newCharges = await GetOtherChargesAsync("Quotation", id);
                var newTerms = await GetTermSelectionsAsync("Quotation", id);

                return Ok(MapQuotationToResponse(quotation, newProducts, newCharges, newTerms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quotation {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the quotation." });
            }
        }

        [HttpPatch("quotations/{id}/status")]
        public async Task<IActionResult> UpdateQuotationStatus(int id, [FromBody] string status)
        {
            try
            {
                var quotation = await _context.Quotations.FindAsync(id);
                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                quotation.Status = status;
                quotation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quotation status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("quotations/{id}")]
        public async Task<IActionResult> DeleteQuotation(int id)
        {
            try
            {
                var quotation = await _context.Quotations
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                var products = await GetProductsAsync("Quotation", id);
                var charges = await GetOtherChargesAsync("Quotation", id);
                var terms = await GetTermSelectionsAsync("Quotation", id);
                _context.DocumentProducts.RemoveRange(products);
                _context.DocumentOtherCharges.RemoveRange(charges);
                _context.DocumentTermSelections.RemoveRange(terms);
                _context.Quotations.Remove(quotation);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Quotation deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting quotation {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the quotation." });
            }
        }

        // ============================================================
        // INVOICES
        // ============================================================

        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices([FromQuery] int userId)
        {
            try
            {
                var invoices = await _context.Invoices
                    .Where(i => i.UserId == userId)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();

                var ids = invoices.Select(i => i.Id).ToList();
                var productsMap = await GetProductsMapAsync("Invoice", ids);
                var chargesMap = await GetOtherChargesMapAsync("Invoice", ids);
                var termsMap = await GetTermSelectionsMapAsync("Invoice", ids);
                var paidInfosMap = await GetPaidInfosMapAsync("Invoice", ids);

                return Ok(invoices.Select(i => MapInvoiceToResponse(i, productsMap[i.Id], chargesMap[i.Id], termsMap[i.Id], paidInfosMap[i.Id])));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoices for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching invoices." });
            }
        }

        [HttpGet("invoices/{id}")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                var products = await GetProductsAsync("Invoice", id);
                var charges = await GetOtherChargesAsync("Invoice", id);
                var terms = await GetTermSelectionsAsync("Invoice", id);
                var paidInfos = await GetPaidInfosAsync("Invoice", id);

                return Ok(MapInvoiceToResponse(invoice, products, charges, terms, paidInfos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the invoice." });
            }
        }

        [HttpPost("invoices")]
        public async Task<IActionResult> CreateInvoice([FromBody] InvoiceRequestDto request, [FromQuery] int userId)
        {
            try
            {
                _logger.LogInformation("Creating invoice for user {UserId}. Date: {Date}, InvoiceNo: {InvoiceNo}",
                    userId, request.Date, request.InvoiceNo);

                if (request == null)
                {
                    return BadRequest(new { message = "Invoice data is required." });
                }

                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date}", request.Date);
                    return BadRequest(new { message = $"Invalid date format: {request.Date}. Please use DD/MM/YYYY." });
                }

                var invoice = new Invoice { UserId = userId };
                MapInvoiceRequestToEntity(request, invoice);
                invoice.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                invoice.PaidTotal = request.PaidInfo?.Sum(p => p.Amount) ?? 0;
                invoice.BalanceDue = invoice.GrandTotal - invoice.PaidTotal;
                invoice.Status = "In-Progress";

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(invoice.Id, "Invoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("Invoice", invoice.Id);
                var newCharges = await GetOtherChargesAsync("Invoice", invoice.Id);
                var newTerms = await GetTermSelectionsAsync("Invoice", invoice.Id);
                var newPaidInfos = await GetPaidInfosAsync("Invoice", invoice.Id);

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, MapInvoiceToResponse(invoice, newProducts, newCharges, newTerms, newPaidInfos));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating invoice: " + ex.Message });
            }
        }

        [HttpPut("invoices/{id}")]
        public async Task<IActionResult> UpdateInvoice(int id, [FromBody] InvoiceRequestDto request)
        {
            try
            {
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                MapInvoiceRequestToEntity(request, invoice);
                invoice.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                invoice.PaidTotal = request.PaidInfo?.Sum(p => p.Amount) ?? 0;
                invoice.BalanceDue = invoice.GrandTotal - invoice.PaidTotal;
                invoice.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                var existingProducts = await GetProductsAsync("Invoice", id);
                var existingCharges = await GetOtherChargesAsync("Invoice", id);
                var existingTerms = await GetTermSelectionsAsync("Invoice", id);
                var existingPaidInfos = await GetPaidInfosAsync("Invoice", id);
                _context.DocumentProducts.RemoveRange(existingProducts);
                _context.DocumentOtherCharges.RemoveRange(existingCharges);
                _context.DocumentTermSelections.RemoveRange(existingTerms);
                _context.DocumentPaidInfos.RemoveRange(existingPaidInfos);

                await SaveDocumentChildren(invoice.Id, "Invoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("Invoice", id);
                var newCharges = await GetOtherChargesAsync("Invoice", id);
                var newTerms = await GetTermSelectionsAsync("Invoice", id);
                var newPaidInfos = await GetPaidInfosAsync("Invoice", id);

                return Ok(MapInvoiceToResponse(invoice, newProducts, newCharges, newTerms, newPaidInfos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the invoice." });
            }
        }

        [HttpPatch("invoices/{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] string status)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                invoice.Status = status;
                invoice.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("invoices/{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                var products = await GetProductsAsync("Invoice", id);
                var charges = await GetOtherChargesAsync("Invoice", id);
                var terms = await GetTermSelectionsAsync("Invoice", id);
                var paidInfos = await GetPaidInfosAsync("Invoice", id);
                _context.DocumentProducts.RemoveRange(products);
                _context.DocumentOtherCharges.RemoveRange(charges);
                _context.DocumentTermSelections.RemoveRange(terms);
                _context.DocumentPaidInfos.RemoveRange(paidInfos);
                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Invoice deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the invoice." });
            }
        }

        // ============================================================
        // PURCHASE ORDERS
        // ============================================================

        [HttpGet("purchaseorders")]
        public async Task<IActionResult> GetPurchaseOrders([FromQuery] int userId)
        {
            try
            {
                var purchaseOrders = await _context.PurchaseOrders
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var ids = purchaseOrders.Select(p => p.Id).ToList();
                var productsMap = await GetProductsMapAsync("PurchaseOrder", ids);
                var chargesMap = await GetOtherChargesMapAsync("PurchaseOrder", ids);
                var termsMap = await GetTermSelectionsMapAsync("PurchaseOrder", ids);

                return Ok(purchaseOrders.Select(p => MapPurchaseOrderToResponse(p, productsMap[p.Id], chargesMap[p.Id], termsMap[p.Id])));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchase orders for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching purchase orders." });
            }
        }

        [HttpGet("purchaseorders/{id}")]
        public async Task<IActionResult> GetPurchaseOrder(int id)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                var products = await GetProductsAsync("PurchaseOrder", id);
                var charges = await GetOtherChargesAsync("PurchaseOrder", id);
                var terms = await GetTermSelectionsAsync("PurchaseOrder", id);

                return Ok(MapPurchaseOrderToResponse(purchaseOrder, products, charges, terms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting purchase order {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the purchase order." });
            }
        }

        [HttpPost("purchaseorders")]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderRequestDto request, [FromQuery] int userId)
        {
            try
            {
                _logger.LogInformation("Creating purchase order for user {UserId}. Date: {Date}, PO No: {PONo}",
                    userId, request.Date, request.PurchaseOrderNo);

                // Validate request
                if (request == null)
                {
                    return BadRequest(new { message = "Purchase order data is required." });
                }

                // Validate Purchase Order Number
                if (string.IsNullOrWhiteSpace(request.PurchaseOrderNo))
                {
                    return BadRequest(new { message = "Purchase Order number is required." });
                }

                // Validate and parse date
                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date} for user {UserId}", request.Date, userId);
                    return BadRequest(new { message = $"Invalid date format: '{request.Date}'. Please use DD/MM/YYYY format." });
                }

                // Validate products
                if (request.Products == null || request.Products.Count == 0)
                {
                    return BadRequest(new { message = "At least one product is required." });
                }

                // Validate customer
                if (request.CustomerId == null || request.CustomerId <= 0)
                {
                    return BadRequest(new { message = "Customer selection is required." });
                }

                // Create the purchase order entity
                var purchaseOrder = new PurchaseOrder { UserId = userId };
                MapPurchaseOrderRequestToEntity(request, purchaseOrder);
                purchaseOrder.Date = date; // Ensure date is set
                purchaseOrder.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                purchaseOrder.Status = "In-Progress";
                purchaseOrder.CreatedAt = DateTime.UtcNow;
                purchaseOrder.UpdatedAt = DateTime.UtcNow;

                _context.PurchaseOrders.Add(purchaseOrder);
                await _context.SaveChangesAsync();

                // Save child entities (products, other charges, terms)
                await SaveDocumentChildren(purchaseOrder.Id, "PurchaseOrder", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Purchase Order created successfully with ID {PurchaseOrderId} for user {UserId}",
                    purchaseOrder.Id, userId);

                var newProducts = await GetProductsAsync("PurchaseOrder", purchaseOrder.Id);
                var newCharges = await GetOtherChargesAsync("PurchaseOrder", purchaseOrder.Id);
                var newTerms = await GetTermSelectionsAsync("PurchaseOrder", purchaseOrder.Id);

                return CreatedAtAction(nameof(GetPurchaseOrder), new { id = purchaseOrder.Id }, MapPurchaseOrderToResponse(purchaseOrder, newProducts, newCharges, newTerms));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating purchase order for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating purchase order: " + ex.Message });
            }
        }

        [HttpPut("purchaseorders/{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(int id, [FromBody] PurchaseOrderRequestDto request)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                MapPurchaseOrderRequestToEntity(request, purchaseOrder);
                purchaseOrder.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                purchaseOrder.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                var existingProducts = await GetProductsAsync("PurchaseOrder", id);
                var existingCharges = await GetOtherChargesAsync("PurchaseOrder", id);
                var existingTerms = await GetTermSelectionsAsync("PurchaseOrder", id);
                _context.DocumentProducts.RemoveRange(existingProducts);
                _context.DocumentOtherCharges.RemoveRange(existingCharges);
                _context.DocumentTermSelections.RemoveRange(existingTerms);

                await SaveDocumentChildren(purchaseOrder.Id, "PurchaseOrder", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("PurchaseOrder", id);
                var newCharges = await GetOtherChargesAsync("PurchaseOrder", id);
                var newTerms = await GetTermSelectionsAsync("PurchaseOrder", id);

                return Ok(MapPurchaseOrderToResponse(purchaseOrder, newProducts, newCharges, newTerms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the purchase order." });
            }
        }

        [HttpPatch("purchaseorders/{id}/status")]
        public async Task<IActionResult> UpdatePurchaseOrderStatus(int id, [FromBody] string status)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrders.FindAsync(id);
                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                purchaseOrder.Status = status;
                purchaseOrder.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("purchaseorders/{id}")]
        public async Task<IActionResult> DeletePurchaseOrder(int id)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrders
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                var products = await GetProductsAsync("PurchaseOrder", id);
                var charges = await GetOtherChargesAsync("PurchaseOrder", id);
                var terms = await GetTermSelectionsAsync("PurchaseOrder", id);
                _context.DocumentProducts.RemoveRange(products);
                _context.DocumentOtherCharges.RemoveRange(charges);
                _context.DocumentTermSelections.RemoveRange(terms);
                _context.PurchaseOrders.Remove(purchaseOrder);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Purchase order deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase order {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the purchase order." });
            }
        }

        // ============================================================
        // PROFORMA INVOICES
        // ============================================================

        [HttpGet("proformainvoices")]
        public async Task<IActionResult> GetProformaInvoices([FromQuery] int userId)
        {
            try
            {
                var proformaInvoices = await _context.ProformaInvoices
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var ids = proformaInvoices.Select(p => p.Id).ToList();
                var productsMap = await GetProductsMapAsync("ProformaInvoice", ids);
                var chargesMap = await GetOtherChargesMapAsync("ProformaInvoice", ids);
                var termsMap = await GetTermSelectionsMapAsync("ProformaInvoice", ids);
                var paidInfosMap = await GetPaidInfosMapAsync("ProformaInvoice", ids);

                return Ok(proformaInvoices.Select(p => MapProformaInvoiceToResponse(p, productsMap[p.Id], chargesMap[p.Id], termsMap[p.Id], paidInfosMap[p.Id])));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting proforma invoices for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching proforma invoices." });
            }
        }

        [HttpGet("proformainvoices/{id}")]
        public async Task<IActionResult> GetProformaInvoice(int id)
        {
            try
            {
                var proformaInvoice = await _context.ProformaInvoices
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                var products = await GetProductsAsync("ProformaInvoice", id);
                var charges = await GetOtherChargesAsync("ProformaInvoice", id);
                var terms = await GetTermSelectionsAsync("ProformaInvoice", id);
                var paidInfos = await GetPaidInfosAsync("ProformaInvoice", id);

                return Ok(MapProformaInvoiceToResponse(proformaInvoice, products, charges, terms, paidInfos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting proforma invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the proforma invoice." });
            }
        }

        [HttpPost("proformainvoices")]
        public async Task<IActionResult> CreateProformaInvoice([FromBody] ProformaInvoiceRequestDto request, [FromQuery] int userId)
        {
            try
            {
                _logger.LogInformation("Creating proforma invoice for user {UserId}. Date: {Date}, PI No: {PINo}",
                    userId, request.Date, request.ProformaInvoiceNo);

                // Validate request
                if (request == null)
                {
                    return BadRequest(new { message = "Proforma invoice data is required." });
                }

                // Validate Proforma Invoice Number
                if (string.IsNullOrWhiteSpace(request.ProformaInvoiceNo))
                {
                    return BadRequest(new { message = "Proforma Invoice number is required." });
                }

                // Validate and parse date
                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date} for user {UserId}", request.Date, userId);
                    return BadRequest(new { message = $"Invalid date format: '{request.Date}'. Please use DD/MM/YYYY format." });
                }

                // Validate products
                if (request.Products == null || request.Products.Count == 0)
                {
                    return BadRequest(new { message = "At least one product is required." });
                }

                // Validate customer
                if (request.CustomerId == null || request.CustomerId <= 0)
                {
                    return BadRequest(new { message = "Customer selection is required." });
                }

                // Create the proforma invoice entity
                var proformaInvoice = new ProformaInvoice { UserId = userId };
                MapProformaInvoiceRequestToEntity(request, proformaInvoice);
                proformaInvoice.Date = date; // Ensure date is set
                proformaInvoice.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                proformaInvoice.PaidTotal = request.PaidInfo?.Sum(p => p.Amount) ?? 0;
                proformaInvoice.BalanceDue = proformaInvoice.GrandTotal - proformaInvoice.PaidTotal;
                proformaInvoice.Status = "In-Progress";
                proformaInvoice.CreatedAt = DateTime.UtcNow;
                proformaInvoice.UpdatedAt = DateTime.UtcNow;

                // Validate and parse DueDate if provided
                if (!string.IsNullOrWhiteSpace(request.DueDate))
                {
                    if (TryParseDocumentDate(request.DueDate, out DateTime dueDate))
                    {
                        proformaInvoice.DueDate = dueDate;
                    }
                    else
                    {
                        _logger.LogWarning("Failed to parse DueDate: {DueDate} for user {UserId}", request.DueDate, userId);
                        // Don't fail the request, just log the warning
                    }
                }

                _context.ProformaInvoices.Add(proformaInvoice);
                await _context.SaveChangesAsync();

                // Save child entities (products, other charges, terms, paid info)
                await SaveDocumentChildren(proformaInvoice.Id, "ProformaInvoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Proforma Invoice created successfully with ID {ProformaInvoiceId} for user {UserId}",
                    proformaInvoice.Id, userId);

                var newProducts = await GetProductsAsync("ProformaInvoice", proformaInvoice.Id);
                var newCharges = await GetOtherChargesAsync("ProformaInvoice", proformaInvoice.Id);
                var newTerms = await GetTermSelectionsAsync("ProformaInvoice", proformaInvoice.Id);
                var newPaidInfos = await GetPaidInfosAsync("ProformaInvoice", proformaInvoice.Id);

                return CreatedAtAction(nameof(GetProformaInvoice), new { id = proformaInvoice.Id }, MapProformaInvoiceToResponse(proformaInvoice, newProducts, newCharges, newTerms, newPaidInfos));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating proforma invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating proforma invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating proforma invoice: " + ex.Message });
            }
        }

        [HttpPut("proformainvoices/{id}")]
        public async Task<IActionResult> UpdateProformaInvoice(int id, [FromBody] ProformaInvoiceRequestDto request)
        {
            try
            {
                var proformaInvoice = await _context.ProformaInvoices
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                MapProformaInvoiceRequestToEntity(request, proformaInvoice);
                proformaInvoice.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                proformaInvoice.PaidTotal = request.PaidInfo?.Sum(p => p.Amount) ?? 0;
                proformaInvoice.BalanceDue = proformaInvoice.GrandTotal - proformaInvoice.PaidTotal;
                proformaInvoice.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                var existingProducts = await GetProductsAsync("ProformaInvoice", id);
                var existingCharges = await GetOtherChargesAsync("ProformaInvoice", id);
                var existingTerms = await GetTermSelectionsAsync("ProformaInvoice", id);
                var existingPaidInfos = await GetPaidInfosAsync("ProformaInvoice", id);
                _context.DocumentProducts.RemoveRange(existingProducts);
                _context.DocumentOtherCharges.RemoveRange(existingCharges);
                _context.DocumentTermSelections.RemoveRange(existingTerms);
                _context.DocumentPaidInfos.RemoveRange(existingPaidInfos);

                await SaveDocumentChildren(proformaInvoice.Id, "ProformaInvoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("ProformaInvoice", id);
                var newCharges = await GetOtherChargesAsync("ProformaInvoice", id);
                var newTerms = await GetTermSelectionsAsync("ProformaInvoice", id);
                var newPaidInfos = await GetPaidInfosAsync("ProformaInvoice", id);

                return Ok(MapProformaInvoiceToResponse(proformaInvoice, newProducts, newCharges, newTerms, newPaidInfos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating proforma invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the proforma invoice." });
            }
        }

        [HttpPatch("proformainvoices/{id}/status")]
        public async Task<IActionResult> UpdateProformaInvoiceStatus(int id, [FromBody] string status)
        {
            try
            {
                var proformaInvoice = await _context.ProformaInvoices.FindAsync(id);
                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                proformaInvoice.Status = status;
                proformaInvoice.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating proforma invoice status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("proformainvoices/{id}")]
        public async Task<IActionResult> DeleteProformaInvoice(int id)
        {
            try
            {
                var proformaInvoice = await _context.ProformaInvoices
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                var products = await GetProductsAsync("ProformaInvoice", id);
                var charges = await GetOtherChargesAsync("ProformaInvoice", id);
                var terms = await GetTermSelectionsAsync("ProformaInvoice", id);
                var paidInfos = await GetPaidInfosAsync("ProformaInvoice", id);
                _context.DocumentProducts.RemoveRange(products);
                _context.DocumentOtherCharges.RemoveRange(charges);
                _context.DocumentTermSelections.RemoveRange(terms);
                _context.DocumentPaidInfos.RemoveRange(paidInfos);
                _context.ProformaInvoices.Remove(proformaInvoice);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Proforma invoice deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting proforma invoice {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the proforma invoice." });
            }
        }

        // ============================================================
        // DELIVERY NOTES
        // ============================================================

        [HttpGet("deliverynotes")]
        public async Task<IActionResult> GetDeliveryNotes([FromQuery] int userId)
        {
            try
            {
                var deliveryNotes = await _context.DeliveryNotes
                    .Where(d => d.UserId == userId)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();

                var ids = deliveryNotes.Select(d => d.Id).ToList();
                var productsMap = await GetProductsMapAsync("DeliveryNote", ids);
                var chargesMap = await GetOtherChargesMapAsync("DeliveryNote", ids);
                var termsMap = await GetTermSelectionsMapAsync("DeliveryNote", ids);

                return Ok(deliveryNotes.Select(d => MapDeliveryNoteToResponse(d, productsMap[d.Id], chargesMap[d.Id], termsMap[d.Id])));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting delivery notes for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching delivery notes." });
            }
        }

        [HttpGet("deliverynotes/{id}")]
        public async Task<IActionResult> GetDeliveryNote(int id)
        {
            try
            {
                var deliveryNote = await _context.DeliveryNotes
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                var products = await GetProductsAsync("DeliveryNote", id);
                var charges = await GetOtherChargesAsync("DeliveryNote", id);
                var terms = await GetTermSelectionsAsync("DeliveryNote", id);

                return Ok(MapDeliveryNoteToResponse(deliveryNote, products, charges, terms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting delivery note {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the delivery note." });
            }
        }

        [HttpPost("deliverynotes")]
        public async Task<IActionResult> CreateDeliveryNote([FromBody] DeliveryNoteRequestDto request, [FromQuery] int userId)
        {
            try
            {
                _logger.LogInformation("Creating delivery note for user {UserId}. Date: {Date}, DN No: {DNNo}",
                    userId, request.Date, request.DeliveryNoteNo);

                if (request == null)
                {
                    return BadRequest(new { message = "Delivery note data is required." });
                }

                if (string.IsNullOrWhiteSpace(request.DeliveryNoteNo))
                {
                    return BadRequest(new { message = "Delivery Note number is required." });
                }

                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date} for user {UserId}", request.Date, userId);
                    return BadRequest(new { message = $"Invalid date format: '{request.Date}'. Please use DD/MM/YYYY format." });
                }

                // Validate products
                if (request.Products == null || request.Products.Count == 0)
                {
                    return BadRequest(new { message = "At least one product is required." });
                }

                // Validate customer
                if (request.CustomerId == null || request.CustomerId <= 0)
                {
                    return BadRequest(new { message = "Customer selection is required." });
                }

                // Create the delivery note entity
                var deliveryNote = new DeliveryNote
                {
                    UserId = userId,
                    Date = date,
                    DeliveryNoteNo = request.DeliveryNoteNo,
                    RefNo = request.RefNo,
                    OtherInfo = request.OtherInfo,
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    CustomerCompany = request.CustomerCompany,
                    CustomerMobile = request.CustomerMobile,
                    CustomerEmail = request.CustomerEmail,
                    CustomerAddressLine1 = request.CustomerAddressLine1,
                    CustomerAddressLine2 = request.CustomerAddressLine2,
                    CustomerAddressLine3 = request.CustomerAddressLine3,
                    CustomerBillingAddress = request.CustomerBillingAddress,
                    CustomerShippingAddress = request.CustomerShippingAddress,
                    Status = "In-Progress",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.DeliveryNotes.Add(deliveryNote);

                // IMPORTANT: Save changes BEFORE adding child records
                await _context.SaveChangesAsync();

                // Now save child entities with the correct DocumentId
                await SaveDocumentChildren(
                    deliveryNote.Id,
                    "DeliveryNote",
                    request.Products,
                    request.OtherCharges ?? new List<DocumentOtherChargeDto>(),
                    request.TermsIds,
                    null
                );

                await _context.SaveChangesAsync();

                _logger.LogInformation("Delivery Note created successfully with ID {DeliveryNoteId} for user {UserId}",
                    deliveryNote.Id, userId);

                var newProducts = await GetProductsAsync("DeliveryNote", deliveryNote.Id);
                var newCharges = await GetOtherChargesAsync("DeliveryNote", deliveryNote.Id);
                var newTerms = await GetTermSelectionsAsync("DeliveryNote", deliveryNote.Id);

                return CreatedAtAction(nameof(GetDeliveryNote), new { id = deliveryNote.Id }, MapDeliveryNoteToResponse(deliveryNote, newProducts, newCharges, newTerms));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating delivery note for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating delivery note for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating delivery note: " + ex.Message });
            }
        }

        [HttpPut("deliverynotes/{id}")]
        public async Task<IActionResult> UpdateDeliveryNote(int id, [FromBody] DeliveryNoteRequestDto request)
        {
            try
            {
                var deliveryNote = await _context.DeliveryNotes
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                MapDeliveryNoteRequestToEntity(request, deliveryNote);
                deliveryNote.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                var existingProducts = await GetProductsAsync("DeliveryNote", id);
                var existingCharges = await GetOtherChargesAsync("DeliveryNote", id);
                var existingTerms = await GetTermSelectionsAsync("DeliveryNote", id);
                _context.DocumentProducts.RemoveRange(existingProducts);
                _context.DocumentOtherCharges.RemoveRange(existingCharges);
                _context.DocumentTermSelections.RemoveRange(existingTerms);

                await SaveDocumentChildren(deliveryNote.Id, "DeliveryNote", request.Products, request.OtherCharges ?? new List<DocumentOtherChargeDto>(), request.TermsIds, null);
                await _context.SaveChangesAsync();

                var newProducts = await GetProductsAsync("DeliveryNote", id);
                var newCharges = await GetOtherChargesAsync("DeliveryNote", id);
                var newTerms = await GetTermSelectionsAsync("DeliveryNote", id);

                return Ok(MapDeliveryNoteToResponse(deliveryNote, newProducts, newCharges, newTerms));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating delivery note {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the delivery note." });
            }
        }

        [HttpPatch("deliverynotes/{id}/status")]
        public async Task<IActionResult> UpdateDeliveryNoteStatus(int id, [FromBody] string status)
        {
            try
            {
                var deliveryNote = await _context.DeliveryNotes.FindAsync(id);
                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                deliveryNote.Status = status;
                deliveryNote.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating delivery note status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("deliverynotes/{id}")]
        public async Task<IActionResult> DeleteDeliveryNote(int id)
        {
            try
            {
                var deliveryNote = await _context.DeliveryNotes
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                var products = await GetProductsAsync("DeliveryNote", id);
                var charges = await GetOtherChargesAsync("DeliveryNote", id);
                var terms = await GetTermSelectionsAsync("DeliveryNote", id);
                _context.DocumentProducts.RemoveRange(products);
                _context.DocumentOtherCharges.RemoveRange(charges);
                _context.DocumentTermSelections.RemoveRange(terms);
                _context.DeliveryNotes.Remove(deliveryNote);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Delivery note deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting delivery note {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the delivery note." });
            }
        }

        // ============================================================
        // RECEIPTS
        // ============================================================

        [HttpGet("receipts")]
        public async Task<IActionResult> GetReceipts([FromQuery] int userId)
        {
            try
            {
                var receipts = await _context.Receipts
                    .Where(r => r.UserId == userId)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(receipts.Select(r => MapReceiptToResponse(r)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting receipts for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching receipts." });
            }
        }

        [HttpGet("receipts/{id}")]
        public async Task<IActionResult> GetReceipt(int id)
        {
            try
            {
                var receipt = await _context.Receipts
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (receipt == null)
                {
                    return NotFound(new { message = "Receipt not found." });
                }

                return Ok(MapReceiptToResponse(receipt));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting receipt {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the receipt." });
            }
        }

        [HttpPost("receipts")]
        public async Task<IActionResult> CreateReceipt([FromBody] ReceiptRequestDto request, [FromQuery] int userId)
        {
            try
            {
                _logger.LogInformation("Creating receipt for user {UserId}. Date: {Date}, ReceiptNo: {ReceiptNo}",
                    userId, request.Date, request.ReceiptNo);

                if (request == null)
                {
                    return BadRequest(new { message = "Receipt data is required." });
                }

                if (string.IsNullOrWhiteSpace(request.ReceiptNo))
                {
                    return BadRequest(new { message = "Receipt number is required." });
                }

                if (!TryParseDocumentDate(request.Date, out DateTime date))
                {
                    _logger.LogWarning("Failed to parse date: {Date} for user {UserId}", request.Date, userId);
                    return BadRequest(new { message = $"Invalid date format: '{request.Date}'. Please use DD/MM/YYYY format." });
                }

                if (request.CustomerId == null || request.CustomerId <= 0)
                {
                    return BadRequest(new { message = "Customer selection is required." });
                }

                if (request.PaidAmount == null || request.PaidAmount <= 0)
                {
                    return BadRequest(new { message = "Paid amount is required and must be greater than 0." });
                }

                // Create the receipt entity (Receipt doesn't have child records)
                var receipt = new Receipt
                {
                    UserId = userId,
                    Date = date,
                    ReceiptNo = request.ReceiptNo,
                    CustomerId = request.CustomerId,
                    CustomerName = request.CustomerName,
                    CustomerCompany = request.CustomerCompany,
                    CustomerMobile = request.CustomerMobile,
                    CustomerEmail = request.CustomerEmail,
                    CustomerAddressLine1 = request.CustomerAddressLine1,
                    CustomerAddressLine2 = request.CustomerAddressLine2,
                    CustomerAddressLine3 = request.CustomerAddressLine3,
                    CustomerBillingAddress = request.CustomerBillingAddress,
                    CustomerShippingAddress = request.CustomerShippingAddress,
                    PaymentMode = request.PaymentMode,
                    ReferenceNo = request.ReferenceNo,
                    PaidAmount = request.PaidAmount ?? 0,
                    PaymentFor = request.PaymentFor,
                    Status = "In-Progress",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Receipts.Add(receipt);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Receipt created successfully with ID {ReceiptId} for user {UserId}",
                    receipt.Id, userId);

                return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, MapReceiptToResponse(receipt));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating receipt for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating receipt for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating receipt: " + ex.Message });
            }
        }

        [HttpPut("receipts/{id}")]
        public async Task<IActionResult> UpdateReceipt(int id, [FromBody] ReceiptRequestDto request)
        {
            try
            {
                var receipt = await _context.Receipts
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (receipt == null)
                {
                    return NotFound(new { message = "Receipt not found." });
                }

                MapReceiptRequestToEntity(request, receipt);
                receipt.UpdatedAt = DateTime.UtcNow;

                _context.Receipts.Update(receipt);
                await _context.SaveChangesAsync();

                return Ok(MapReceiptToResponse(receipt));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating receipt {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the receipt." });
            }
        }

        [HttpPatch("receipts/{id}/status")]
        public async Task<IActionResult> UpdateReceiptStatus(int id, [FromBody] string status)
        {
            try
            {
                var receipt = await _context.Receipts.FindAsync(id);
                if (receipt == null)
                {
                    return NotFound(new { message = "Receipt not found." });
                }

                receipt.Status = status;
                receipt.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Status updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating receipt status {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the status." });
            }
        }

        [HttpDelete("receipts/{id}")]
        public async Task<IActionResult> DeleteReceipt(int id)
        {
            try
            {
                var receipt = await _context.Receipts.FindAsync(id);
                if (receipt == null)
                {
                    return NotFound(new { message = "Receipt not found." });
                }

                _context.Receipts.Remove(receipt);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Receipt deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting receipt {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the receipt." });
            }
        }

        // ============================================================
        // TERMS & CONDITIONS
        // ============================================================

        [HttpGet("terms")]
        public async Task<IActionResult> GetTerms([FromQuery] int userId, [FromQuery] string documentType)
        {
            try
            {
                var terms = await _context.DocumentTerms
                    .Where(t => t.UserId == userId && t.DocumentType == documentType)
                    .OrderBy(t => t.Text)
                    .ToListAsync();

                return Ok(terms.Select(t => new DocumentTermDto
                {
                    Id = t.Id.ToString(),
                    Text = t.Text
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting terms for user {UserId}, type {DocumentType}", userId, documentType);
                return StatusCode(500, new { message = "An error occurred while fetching terms." });
            }
        }

        [HttpPost("terms")]
        public async Task<IActionResult> CreateTerm([FromBody] DocumentTermDto request, [FromQuery] int userId, [FromQuery] string documentType)
        {
            try
            {
                var term = new DocumentTerm
                {
                    UserId = userId,
                    DocumentType = documentType,
                    Text = request.Text
                };

                _context.DocumentTerms.Add(term);
                await _context.SaveChangesAsync();

                return Ok(new DocumentTermDto { Id = term.Id.ToString(), Text = term.Text });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating term for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the term." });
            }
        }

        [HttpDelete("terms/{id}")]
        public async Task<IActionResult> DeleteTerm(int id)
        {
            try
            {
                var term = await _context.DocumentTerms.FindAsync(id);
                if (term == null)
                {
                    return NotFound(new { message = "Term not found." });
                }

                _context.DocumentTerms.Remove(term);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Term deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting term {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the term." });
            }
        }

        // ============================================================
        // SETTINGS
        // ============================================================

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings([FromQuery] int userId)
        {
            try
            {
                var quotationSettings = await _context.QuotationSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var invoiceSettings = await _context.InvoiceSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var purchaseOrderSettings = await _context.PurchaseOrderSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var proformaInvoiceSettings = await _context.ProformaInvoiceSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var deliveryNoteSettings = await _context.DeliveryNoteSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var receiptSettings = await _context.ReceiptSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                var columnHeadingSettings = await _context.ColumnHeadingSettings.FirstOrDefaultAsync(s => s.UserId == userId);

                return Ok(new
                {
                    quotation = MapQuotationSettingsToDto(quotationSettings ?? new QuotationSetting { UserId = userId }),
                    invoice = MapInvoiceSettingsToDto(invoiceSettings ?? new InvoiceSetting { UserId = userId }),
                    purchaseOrder = MapPurchaseOrderSettingsToDto(purchaseOrderSettings ?? new PurchaseOrderSetting { UserId = userId }),
                    proformaInvoice = MapProformaInvoiceSettingsToDto(proformaInvoiceSettings ?? new ProformaInvoiceSetting { UserId = userId }),
                    deliveryNote = MapDeliveryNoteSettingsToDto(deliveryNoteSettings ?? new DeliveryNoteSetting { UserId = userId }),
                    receipt = MapReceiptSettingsToDto(receiptSettings ?? new ReceiptSetting { UserId = userId }),
                    columnHeading = MapColumnHeadingSettingsToDto(columnHeadingSettings ?? new ColumnHeadingSetting { UserId = userId })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching settings." });
            }
        }

        [HttpPut("settings/quotation")]
        public async Task<IActionResult> UpdateQuotationSettings([FromBody] QuotationSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.QuotationSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new QuotationSetting { UserId = userId };
                    _context.QuotationSettings.Add(settings);
                }

                MapQuotationSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Quotation settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quotation settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating quotation settings." });
            }
        }

        [HttpPut("settings/invoice")]
        public async Task<IActionResult> UpdateInvoiceSettings([FromBody] InvoiceSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.InvoiceSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new InvoiceSetting { UserId = userId };
                    _context.InvoiceSettings.Add(settings);
                }

                MapInvoiceSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Invoice settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating invoice settings." });
            }
        }

        [HttpPut("settings/purchaseorder")]
        public async Task<IActionResult> UpdatePurchaseOrderSettings([FromBody] PurchaseOrderSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.PurchaseOrderSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new PurchaseOrderSetting { UserId = userId };
                    _context.PurchaseOrderSettings.Add(settings);
                }

                MapPurchaseOrderSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Purchase order settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating purchase order settings." });
            }
        }

        [HttpPut("settings/proformainvoice")]
        public async Task<IActionResult> UpdateProformaInvoiceSettings([FromBody] ProformaInvoiceSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.ProformaInvoiceSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new ProformaInvoiceSetting { UserId = userId };
                    _context.ProformaInvoiceSettings.Add(settings);
                }

                MapProformaInvoiceSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Proforma invoice settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating proforma invoice settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating proforma invoice settings." });
            }
        }

        [HttpPut("settings/deliverynote")]
        public async Task<IActionResult> UpdateDeliveryNoteSettings([FromBody] DeliveryNoteSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.DeliveryNoteSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new DeliveryNoteSetting { UserId = userId };
                    _context.DeliveryNoteSettings.Add(settings);
                }

                MapDeliveryNoteSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Delivery note settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating delivery note settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating delivery note settings." });
            }
        }

        [HttpPut("settings/receipt")]
        public async Task<IActionResult> UpdateReceiptSettings([FromBody] ReceiptSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.ReceiptSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new ReceiptSetting { UserId = userId };
                    _context.ReceiptSettings.Add(settings);
                }

                MapReceiptSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Receipt settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating receipt settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating receipt settings." });
            }
        }

        [HttpPut("settings/columnheading")]
        public async Task<IActionResult> UpdateColumnHeadingSettings([FromBody] ColumnHeadingSettingsDto request, [FromQuery] int userId)
        {
            try
            {
                var settings = await _context.ColumnHeadingSettings.FirstOrDefaultAsync(s => s.UserId == userId);
                if (settings == null)
                {
                    settings = new ColumnHeadingSetting { UserId = userId };
                    _context.ColumnHeadingSettings.Add(settings);
                }

                MapColumnHeadingSettingsToEntity(request, settings);
                settings.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Column heading settings updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating column heading settings for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating column heading settings." });
            }
        }

        // ============================================================
        // HELPER METHODS
        // ============================================================

        private decimal CalculateGrandTotal(List<DocumentProductDto> products, List<DocumentOtherChargeDto> otherCharges)
        {
            decimal productTotal = products.Sum(p => p.Price * p.Qty * (1 + p.Gst / 100));
            decimal chargesTotal = otherCharges.Sum(c => c.Amount);
            return Math.Round(productTotal + chargesTotal, 2);
        }

        // Dates coming from the frontend are always formatted as "dd/MM/yyyy"
        // (see formatQuotationDate in App.jsx). Using the culture-dependent
        // DateTime.TryParse here previously meant that on a server running an
        // en-US (or similar) culture, any date like "25/08/2026" - where the
        // "day" segment isn't a valid month - would silently fail to parse and
        // leave the Date field unset. Parsing explicitly against the known
        // "dd/MM/yyyy" format with InvariantCulture removes that ambiguity.
        // A couple of fallback formats are also accepted (ISO 8601 and the
        // culture-dependent parse as a last resort) so any date the client
        // might send in another shape still has a chance to parse correctly.
        private static readonly string[] DocumentDateFormats = {
            "dd/MM/yyyy",
            "dd-MM-yyyy",
            "yyyy-MM-dd",
            "yyyy-MM-ddTHH:mm:ss",
            "MM/dd/yyyy"  // Added as fallback
        };

        private static bool TryParseDocumentDate(string? value, out DateTime date)
        {
            date = default;
            if (string.IsNullOrWhiteSpace(value)) return false;

            // Try exact formats first
            foreach (var format in DocumentDateFormats)
            {
                if (DateTime.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                    return true;
            }

            // Last-resort fallback
            return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
        }

        private async Task SaveDocumentChildren(int documentId, string documentType, List<DocumentProductDto> products, List<DocumentOtherChargeDto> charges, List<string> termIds, List<DocumentPaidInfoDto>? paidInfos)
        {
            // Only save products if the document type supports them
            // DeliveryNote, Receipt, and other types might not have products table
            var documentTypesWithProducts = new[] { "Quotation", "Invoice", "PurchaseOrder", "ProformaInvoice", "DeliveryNote" };

            if (products != null && documentTypesWithProducts.Contains(documentType))
            {
                foreach (var p in products)
                {
                    _context.DocumentProducts.Add(new DocumentProduct
                    {
                        DocumentType = documentType,
                        DocumentId = documentId,
                        ProductId = p.ProductId,
                        ProductName = p.Name ?? string.Empty,
                        Price = p.Price > 0 ? p.Price : 0,
                        Gst = p.Gst >= 0 ? p.Gst : 0,
                        Qty = p.Qty > 0 ? p.Qty : 1,
                        Unit = p.Unit ?? string.Empty,
                        Hsn = p.Hsn ?? string.Empty,
                        Description = p.Description ?? string.Empty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            // Only save other charges if the document type supports them
            if (charges != null && documentTypesWithProducts.Contains(documentType))
            {
                foreach (var c in charges)
                {
                    _context.DocumentOtherCharges.Add(new DocumentOtherCharge
                    {
                        DocumentType = documentType,
                        DocumentId = documentId,
                        Label = c.Label ?? "Other Charges",
                        Amount = c.Amount > 0 ? c.Amount : 0,
                        IsTaxable = c.Taxable,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            // Save term selections for all document types
            if (termIds != null)
            {
                foreach (var termId in termIds)
                {
                    if (int.TryParse(termId, out int id))
                    {
                        _context.DocumentTermSelections.Add(new DocumentTermSelection
                        {
                            DocumentType = documentType,
                            DocumentId = documentId,
                            TermId = id,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            // Only save paid info for Invoice and ProformaInvoice
            if (paidInfos != null && (documentType == "Invoice" || documentType == "ProformaInvoice"))
            {
                foreach (var p in paidInfos)
                {
                    if (TryParseDocumentDate(p.Date, out DateTime date))
                    {
                        _context.DocumentPaidInfos.Add(new DocumentPaidInfo
                        {
                            DocumentType = documentType,
                            DocumentId = documentId,
                            Date = date,
                            Amount = p.Amount > 0 ? p.Amount : 0,
                            Note = p.Note ?? string.Empty,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }
        }

        // ============================================================
        // CHILD LOADING HELPERS
        // Products / OtherCharges / TermSelections / PaidInfos live in
        // shared tables keyed by (DocumentType, DocumentId) rather than
        // a real foreign key to a specific document table, so Quotation,
        // Invoice, PurchaseOrder, ProformaInvoice and DeliveryNote have
        // no "Products"/"OtherCharges"/"TermSelections" navigation
        // property for EF to .Include(). They must be queried explicitly.
        // ============================================================

        private Task<List<DocumentProduct>> GetProductsAsync(string documentType, int documentId) =>
            _context.DocumentProducts
                .Where(p => p.DocumentType == documentType && p.DocumentId == documentId)
                .ToListAsync();

        private Task<List<DocumentOtherCharge>> GetOtherChargesAsync(string documentType, int documentId) =>
            _context.DocumentOtherCharges
                .Where(c => c.DocumentType == documentType && c.DocumentId == documentId)
                .ToListAsync();

        private Task<List<DocumentTermSelection>> GetTermSelectionsAsync(string documentType, int documentId) =>
            _context.DocumentTermSelections
                .Where(t => t.DocumentType == documentType && t.DocumentId == documentId)
                .ToListAsync();

        private Task<List<DocumentPaidInfo>> GetPaidInfosAsync(string documentType, int documentId) =>
            _context.DocumentPaidInfos
                .Where(p => p.DocumentType == documentType && p.DocumentId == documentId)
                .ToListAsync();

        // Bulk variants for list endpoints, so we issue one query per
        // child table instead of one per document (avoids N+1 queries).
        private async Task<ILookup<int, DocumentProduct>> GetProductsMapAsync(string documentType, IEnumerable<int> documentIds)
        {
            var ids = documentIds.ToList();
            var items = await _context.DocumentProducts
                .Where(p => p.DocumentType == documentType && ids.Contains(p.DocumentId))
                .ToListAsync();
            return items.ToLookup(p => p.DocumentId);
        }

        private async Task<ILookup<int, DocumentOtherCharge>> GetOtherChargesMapAsync(string documentType, IEnumerable<int> documentIds)
        {
            var ids = documentIds.ToList();
            var items = await _context.DocumentOtherCharges
                .Where(c => c.DocumentType == documentType && ids.Contains(c.DocumentId))
                .ToListAsync();
            return items.ToLookup(c => c.DocumentId);
        }

        private async Task<ILookup<int, DocumentTermSelection>> GetTermSelectionsMapAsync(string documentType, IEnumerable<int> documentIds)
        {
            var ids = documentIds.ToList();
            var items = await _context.DocumentTermSelections
                .Where(t => t.DocumentType == documentType && ids.Contains(t.DocumentId))
                .ToListAsync();
            return items.ToLookup(t => t.DocumentId);
        }

        private async Task<ILookup<int, DocumentPaidInfo>> GetPaidInfosMapAsync(string documentType, IEnumerable<int> documentIds)
        {
            var ids = documentIds.ToList();
            var items = await _context.DocumentPaidInfos
                .Where(p => p.DocumentType == documentType && ids.Contains(p.DocumentId))
                .ToListAsync();
            return items.ToLookup(p => p.DocumentId);
        }

        // ============================================================
        // MAPPING METHODS - QUOTATION
        // ============================================================

        private QuotationResponseDto MapQuotationToResponse(Quotation q, IEnumerable<DocumentProduct> qProducts, IEnumerable<DocumentOtherCharge> qCharges, IEnumerable<DocumentTermSelection> qTerms)
        {
            return new QuotationResponseDto
            {
                Id = q.Id,
                UserId = q.UserId,
                Date = q.Date.ToString("dd/MM/yyyy"),
                QuotationNo = q.QuotationNo,
                OtherInfo = q.OtherInfo,
                CustomerId = q.CustomerId,
                CustomerName = q.CustomerName,
                CustomerCompany = q.CustomerCompany,
                CustomerMobile = q.CustomerMobile,
                CustomerEmail = q.CustomerEmail,
                CustomerAddressLine1 = q.CustomerAddressLine1,
                CustomerAddressLine2 = q.CustomerAddressLine2,
                CustomerAddressLine3 = q.CustomerAddressLine3,
                CustomerBillingAddress = q.CustomerBillingAddress,
                CustomerShippingAddress = q.CustomerShippingAddress,
                Products = qProducts.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = qCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = qTerms.Select(t => t.TermId.ToString()).ToList(),
                GrandTotal = q.GrandTotal,
                Status = q.Status,
                CreatedAt = q.CreatedAt,
                UpdatedAt = q.UpdatedAt
            };
        }

        private void MapQuotationRequestToEntity(QuotationRequestDto dto, Quotation entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            else
                entity.Date = DateTime.UtcNow;
            entity.QuotationNo = dto.QuotationNo;
            entity.OtherInfo = dto.OtherInfo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
        }

        // ============================================================
        // MAPPING METHODS - INVOICE
        // ============================================================

        private InvoiceResponseDto MapInvoiceToResponse(Invoice inv, IEnumerable<DocumentProduct> invProducts, IEnumerable<DocumentOtherCharge> invCharges, IEnumerable<DocumentTermSelection> invTerms, IEnumerable<DocumentPaidInfo> invPaidInfos)
        {
            return new InvoiceResponseDto
            {
                Id = inv.Id,
                UserId = inv.UserId,
                Date = inv.Date.ToString("dd/MM/yyyy"),
                InvoiceNo = inv.InvoiceNo,
                DueDate = inv.DueDate?.ToString("dd/MM/yyyy"),
                PoNo = inv.PoNo,
                OtherInfo = inv.OtherInfo,
                CustomerId = inv.CustomerId,
                CustomerName = inv.CustomerName,
                CustomerCompany = inv.CustomerCompany,
                CustomerMobile = inv.CustomerMobile,
                CustomerEmail = inv.CustomerEmail,
                CustomerAddressLine1 = inv.CustomerAddressLine1,
                CustomerAddressLine2 = inv.CustomerAddressLine2,
                CustomerAddressLine3 = inv.CustomerAddressLine3,
                CustomerBillingAddress = inv.CustomerBillingAddress,
                CustomerShippingAddress = inv.CustomerShippingAddress,
                Products = invProducts.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = invCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = invTerms.Select(t => t.TermId.ToString()).ToList(),
                PaidInfo = invPaidInfos.Select(p => new DocumentPaidInfoDto
                {
                    Id = p.Id.ToString(),
                    Date = p.Date.ToString("dd/MM/yyyy"),
                    Amount = p.Amount,
                    Note = p.Note
                }).ToList(),
                GrandTotal = inv.GrandTotal,
                PaidTotal = inv.PaidTotal,
                BalanceDue = inv.BalanceDue,
                Status = inv.Status,
                CreatedAt = inv.CreatedAt,
                UpdatedAt = inv.UpdatedAt
            };
        }

        private void MapInvoiceRequestToEntity(InvoiceRequestDto dto, Invoice entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            else
                entity.Date = DateTime.UtcNow;
            entity.InvoiceNo = dto.InvoiceNo;
            if (TryParseDocumentDate(dto.DueDate, out DateTime dueDate))
                entity.DueDate = dueDate;
            entity.PoNo = dto.PoNo;
            entity.OtherInfo = dto.OtherInfo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
        }

        // ============================================================
        // MAPPING METHODS - PURCHASE ORDER
        // ============================================================

        private PurchaseOrderResponseDto MapPurchaseOrderToResponse(PurchaseOrder po, IEnumerable<DocumentProduct> poProducts, IEnumerable<DocumentOtherCharge> poCharges, IEnumerable<DocumentTermSelection> poTerms)
        {
            return new PurchaseOrderResponseDto
            {
                Id = po.Id,
                UserId = po.UserId,
                Date = po.Date.ToString("dd/MM/yyyy"),
                PurchaseOrderNo = po.PurchaseOrderNo,
                OtherInfo = po.OtherInfo,
                CustomerId = po.CustomerId,
                CustomerName = po.CustomerName,
                CustomerCompany = po.CustomerCompany,
                CustomerMobile = po.CustomerMobile,
                CustomerEmail = po.CustomerEmail,
                CustomerAddressLine1 = po.CustomerAddressLine1,
                CustomerAddressLine2 = po.CustomerAddressLine2,
                CustomerAddressLine3 = po.CustomerAddressLine3,
                CustomerBillingAddress = po.CustomerBillingAddress,
                CustomerShippingAddress = po.CustomerShippingAddress,
                Products = poProducts.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = poCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = poTerms.Select(t => t.TermId.ToString()).ToList(),
                GrandTotal = po.GrandTotal,
                Status = po.Status,
                CreatedAt = po.CreatedAt,
                UpdatedAt = po.UpdatedAt
            };
        }

        private void MapPurchaseOrderRequestToEntity(PurchaseOrderRequestDto dto, PurchaseOrder entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            entity.PurchaseOrderNo = dto.PurchaseOrderNo;
            entity.OtherInfo = dto.OtherInfo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
        }

        // ============================================================
        // MAPPING METHODS - PROFORMA INVOICE
        // ============================================================

        private ProformaInvoiceResponseDto MapProformaInvoiceToResponse(ProformaInvoice pi, IEnumerable<DocumentProduct> piProducts, IEnumerable<DocumentOtherCharge> piCharges, IEnumerable<DocumentTermSelection> piTerms, IEnumerable<DocumentPaidInfo> piPaidInfos)
        {
            return new ProformaInvoiceResponseDto
            {
                Id = pi.Id,
                UserId = pi.UserId,
                Date = pi.Date.ToString("dd/MM/yyyy"),
                ProformaInvoiceNo = pi.ProformaInvoiceNo,
                DueDate = pi.DueDate?.ToString("dd/MM/yyyy"),
                PoNo = pi.PoNo,
                OtherInfo = pi.OtherInfo,
                CustomerId = pi.CustomerId,
                CustomerName = pi.CustomerName,
                CustomerCompany = pi.CustomerCompany,
                CustomerMobile = pi.CustomerMobile,
                CustomerEmail = pi.CustomerEmail,
                CustomerAddressLine1 = pi.CustomerAddressLine1,
                CustomerAddressLine2 = pi.CustomerAddressLine2,
                CustomerAddressLine3 = pi.CustomerAddressLine3,
                CustomerBillingAddress = pi.CustomerBillingAddress,
                CustomerShippingAddress = pi.CustomerShippingAddress,
                Products = piProducts.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = piCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = piTerms.Select(t => t.TermId.ToString()).ToList(),
                PaidInfo = piPaidInfos.Select(p => new DocumentPaidInfoDto
                {
                    Id = p.Id.ToString(),
                    Date = p.Date.ToString("dd/MM/yyyy"),
                    Amount = p.Amount,
                    Note = p.Note
                }).ToList(),
                GrandTotal = pi.GrandTotal,
                PaidTotal = pi.PaidTotal,
                BalanceDue = pi.BalanceDue,
                Status = pi.Status,
                CreatedAt = pi.CreatedAt,
                UpdatedAt = pi.UpdatedAt
            };
        }

        private void MapProformaInvoiceRequestToEntity(ProformaInvoiceRequestDto dto, ProformaInvoice entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            entity.ProformaInvoiceNo = dto.ProformaInvoiceNo;
            if (TryParseDocumentDate(dto.DueDate, out DateTime dueDate))
                entity.DueDate = dueDate;
            entity.PoNo = dto.PoNo;
            entity.OtherInfo = dto.OtherInfo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
        }

        // ============================================================
        // MAPPING METHODS - DELIVERY NOTE
        // ============================================================

        private DeliveryNoteResponseDto MapDeliveryNoteToResponse(DeliveryNote dn, IEnumerable<DocumentProduct> dnProducts, IEnumerable<DocumentOtherCharge> dnCharges, IEnumerable<DocumentTermSelection> dnTerms)
        {
            return new DeliveryNoteResponseDto
            {
                Id = dn.Id,
                UserId = dn.UserId,
                Date = dn.Date.ToString("dd/MM/yyyy"),
                DeliveryNoteNo = dn.DeliveryNoteNo,
                RefNo = dn.RefNo,
                OtherInfo = dn.OtherInfo,
                CustomerId = dn.CustomerId,
                CustomerName = dn.CustomerName,
                CustomerCompany = dn.CustomerCompany,
                CustomerMobile = dn.CustomerMobile,
                CustomerEmail = dn.CustomerEmail,
                CustomerAddressLine1 = dn.CustomerAddressLine1,
                CustomerAddressLine2 = dn.CustomerAddressLine2,
                CustomerAddressLine3 = dn.CustomerAddressLine3,
                CustomerBillingAddress = dn.CustomerBillingAddress,
                CustomerShippingAddress = dn.CustomerShippingAddress,
                Products = dnProducts.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = dnCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = dnTerms.Select(t => t.TermId.ToString()).ToList(),
                Status = dn.Status,
                CreatedAt = dn.CreatedAt,
                UpdatedAt = dn.UpdatedAt
            };
        }

        private void MapDeliveryNoteRequestToEntity(DeliveryNoteRequestDto dto, DeliveryNote entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            entity.DeliveryNoteNo = dto.DeliveryNoteNo;
            entity.RefNo = dto.RefNo;
            entity.OtherInfo = dto.OtherInfo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
        }

        // ============================================================
        // MAPPING METHODS - RECEIPT
        // ============================================================

        private ReceiptResponseDto MapReceiptToResponse(Receipt r)
        {
            return new ReceiptResponseDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Date = r.Date.ToString("dd/MM/yyyy"),
                ReceiptNo = r.ReceiptNo,
                CustomerId = r.CustomerId,
                CustomerName = r.CustomerName,
                CustomerCompany = r.CustomerCompany,
                CustomerMobile = r.CustomerMobile,
                CustomerEmail = r.CustomerEmail,
                CustomerAddressLine1 = r.CustomerAddressLine1,
                CustomerAddressLine2 = r.CustomerAddressLine2,
                CustomerAddressLine3 = r.CustomerAddressLine3,
                CustomerBillingAddress = r.CustomerBillingAddress,
                CustomerShippingAddress = r.CustomerShippingAddress,
                PaymentMode = r.PaymentMode,
                ReferenceNo = r.ReferenceNo,
                PaidAmount = r.PaidAmount,
                PaymentFor = r.PaymentFor,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            };
        }

        private void MapReceiptRequestToEntity(ReceiptRequestDto dto, Receipt entity)
        {
            if (TryParseDocumentDate(dto.Date, out DateTime date))
                entity.Date = date;
            else
                entity.Date = DateTime.UtcNow;

            entity.ReceiptNo = dto.ReceiptNo;
            entity.CustomerId = dto.CustomerId;
            entity.CustomerName = dto.CustomerName;
            entity.CustomerCompany = dto.CustomerCompany;
            entity.CustomerMobile = dto.CustomerMobile;
            entity.CustomerEmail = dto.CustomerEmail;
            entity.CustomerAddressLine1 = dto.CustomerAddressLine1;
            entity.CustomerAddressLine2 = dto.CustomerAddressLine2;
            entity.CustomerAddressLine3 = dto.CustomerAddressLine3;
            entity.CustomerBillingAddress = dto.CustomerBillingAddress;
            entity.CustomerShippingAddress = dto.CustomerShippingAddress;
            entity.PaymentMode = dto.PaymentMode;
            entity.ReferenceNo = dto.ReferenceNo;
            // FIX: Handle nullable decimal properly
            entity.PaidAmount = dto.PaidAmount ?? 0; // Use null-coalescing operator
            entity.PaymentFor = dto.PaymentFor;
        }

        // ============================================================
        // MAPPING METHODS - SETTINGS
        // ============================================================

        private QuotationSettingsDto MapQuotationSettingsToDto(QuotationSetting s)
        {
            return new QuotationSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                DiscountType = s.DiscountType,
                TaxType = s.TaxType,
                ShowProductHSN = s.ShowProductHSN,
                ShowShippingAddress = s.ShowShippingAddress,
                TopMessage = s.TopMessage,
                BottomMessage = s.BottomMessage,
                ShowBankInfo = s.ShowBankInfo,
                ShowUpiInfo = s.ShowUpiInfo,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapQuotationSettingsToEntity(QuotationSettingsDto dto, QuotationSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.DiscountType = dto.DiscountType;
            entity.TaxType = dto.TaxType;
            entity.ShowProductHSN = dto.ShowProductHSN;
            entity.ShowShippingAddress = dto.ShowShippingAddress;
            entity.TopMessage = dto.TopMessage;
            entity.BottomMessage = dto.BottomMessage;
            entity.ShowBankInfo = dto.ShowBankInfo;
            entity.ShowUpiInfo = dto.ShowUpiInfo;
            entity.ShowSignature = dto.ShowSignature;
        }

        private InvoiceSettingsDto MapInvoiceSettingsToDto(InvoiceSetting s)
        {
            return new InvoiceSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                DiscountType = s.DiscountType,
                TaxType = s.TaxType,
                ShowProductHSN = s.ShowProductHSN,
                TopMessage = s.TopMessage,
                BottomMessage = s.BottomMessage,
                ShowBankInfo = s.ShowBankInfo,
                ShowUpiInfo = s.ShowUpiInfo,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapInvoiceSettingsToEntity(InvoiceSettingsDto dto, InvoiceSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.DiscountType = dto.DiscountType;
            entity.TaxType = dto.TaxType;
            entity.ShowProductHSN = dto.ShowProductHSN;
            entity.TopMessage = dto.TopMessage;
            entity.BottomMessage = dto.BottomMessage;
            entity.ShowBankInfo = dto.ShowBankInfo;
            entity.ShowUpiInfo = dto.ShowUpiInfo;
            entity.ShowSignature = dto.ShowSignature;
        }

        private PurchaseOrderSettingsDto MapPurchaseOrderSettingsToDto(PurchaseOrderSetting s)
        {
            return new PurchaseOrderSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                DiscountType = s.DiscountType,
                TaxType = s.TaxType,
                ShowProductHSN = s.ShowProductHSN,
                TopMessage = s.TopMessage,
                BottomMessage = s.BottomMessage,
                ShowBankInfo = s.ShowBankInfo,
                ShowUpiInfo = s.ShowUpiInfo,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapPurchaseOrderSettingsToEntity(PurchaseOrderSettingsDto dto, PurchaseOrderSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.DiscountType = dto.DiscountType;
            entity.TaxType = dto.TaxType;
            entity.ShowProductHSN = dto.ShowProductHSN;
            entity.TopMessage = dto.TopMessage;
            entity.BottomMessage = dto.BottomMessage;
            entity.ShowBankInfo = dto.ShowBankInfo;
            entity.ShowUpiInfo = dto.ShowUpiInfo;
            entity.ShowSignature = dto.ShowSignature;
        }

        private ProformaInvoiceSettingsDto MapProformaInvoiceSettingsToDto(ProformaInvoiceSetting s)
        {
            return new ProformaInvoiceSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                DiscountType = s.DiscountType,
                TaxType = s.TaxType,
                ShowProductHSN = s.ShowProductHSN,
                TopMessage = s.TopMessage,
                BottomMessage = s.BottomMessage,
                ShowBankInfo = s.ShowBankInfo,
                ShowUpiInfo = s.ShowUpiInfo,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapProformaInvoiceSettingsToEntity(ProformaInvoiceSettingsDto dto, ProformaInvoiceSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.DiscountType = dto.DiscountType;
            entity.TaxType = dto.TaxType;
            entity.ShowProductHSN = dto.ShowProductHSN;
            entity.TopMessage = dto.TopMessage;
            entity.BottomMessage = dto.BottomMessage;
            entity.ShowBankInfo = dto.ShowBankInfo;
            entity.ShowUpiInfo = dto.ShowUpiInfo;
            entity.ShowSignature = dto.ShowSignature;
        }

        private DeliveryNoteSettingsDto MapDeliveryNoteSettingsToDto(DeliveryNoteSetting s)
        {
            return new DeliveryNoteSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                ShowProductHSN = s.ShowProductHSN,
                TopMessage = s.TopMessage,
                BottomMessage = s.BottomMessage,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapDeliveryNoteSettingsToEntity(DeliveryNoteSettingsDto dto, DeliveryNoteSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.ShowProductHSN = dto.ShowProductHSN;
            entity.TopMessage = dto.TopMessage;
            entity.BottomMessage = dto.BottomMessage;
            entity.ShowSignature = dto.ShowSignature;
        }

        private ReceiptSettingsDto MapReceiptSettingsToDto(ReceiptSetting s)
        {
            return new ReceiptSettingsDto
            {
                NumberPrefix = s.NumberPrefix,
                SerialNumber = s.SerialNumber,
                ReceiptType = s.ReceiptType,
                ShowSignature = s.ShowSignature
            };
        }

        private void MapReceiptSettingsToEntity(ReceiptSettingsDto dto, ReceiptSetting entity)
        {
            entity.NumberPrefix = dto.NumberPrefix;
            entity.SerialNumber = dto.SerialNumber;
            entity.ReceiptType = dto.ReceiptType;
            entity.ShowSignature = dto.ShowSignature;
        }

        private ColumnHeadingSettingsDto MapColumnHeadingSettingsToDto(ColumnHeadingSetting s)
        {
            return new ColumnHeadingSettingsDto
            {
                TaxLabel = s.TaxLabel,
                HsnLabel = s.HsnLabel,
                OtherChargesLabel = s.OtherChargesLabel,
                ShowQty2Column = s.ShowQty2Column
            };
        }

        private void MapColumnHeadingSettingsToEntity(ColumnHeadingSettingsDto dto, ColumnHeadingSetting entity)
        {
            entity.TaxLabel = dto.TaxLabel;
            entity.HsnLabel = dto.HsnLabel;
            entity.OtherChargesLabel = dto.OtherChargesLabel;
            entity.ShowQty2Column = dto.ShowQty2Column;
        }
    }
}