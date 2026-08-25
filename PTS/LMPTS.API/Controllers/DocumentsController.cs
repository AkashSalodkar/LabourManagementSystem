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
                    .Include(q => q.Products)
                    .Include(q => q.OtherCharges)
                    .Include(q => q.TermSelections)
                    .OrderByDescending(q => q.CreatedAt)
                    .ToListAsync();

                return Ok(quotations.Select(q => MapQuotationToResponse(q)));
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
                    .Include(q => q.Products)
                    .Include(q => q.OtherCharges)
                    .Include(q => q.TermSelections)
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                return Ok(MapQuotationToResponse(quotation));
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
                var quotation = new Quotation { UserId = userId };
                MapQuotationRequestToEntity(request, quotation);
                quotation.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                quotation.Status = "In-Progress";

                _context.Quotations.Add(quotation);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(quotation.Id, "Quotation", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetQuotation), new { id = quotation.Id }, MapQuotationToResponse(quotation));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating quotation for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the quotation." });
            }
        }

        [HttpPut("quotations/{id}")]
        public async Task<IActionResult> UpdateQuotation(int id, [FromBody] QuotationRequestDto request)
        {
            try
            {
                var quotation = await _context.Quotations
                    .Include(q => q.Products)
                    .Include(q => q.OtherCharges)
                    .Include(q => q.TermSelections)
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                MapQuotationRequestToEntity(request, quotation);
                quotation.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                quotation.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                _context.DocumentProducts.RemoveRange(quotation.Products);
                _context.DocumentOtherCharges.RemoveRange(quotation.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(quotation.TermSelections);

                await SaveDocumentChildren(quotation.Id, "Quotation", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                return Ok(MapQuotationToResponse(quotation));
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
                    .Include(q => q.Products)
                    .Include(q => q.OtherCharges)
                    .Include(q => q.TermSelections)
                    .FirstOrDefaultAsync(q => q.Id == id);

                if (quotation == null)
                {
                    return NotFound(new { message = "Quotation not found." });
                }

                _context.DocumentProducts.RemoveRange(quotation.Products);
                _context.DocumentOtherCharges.RemoveRange(quotation.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(quotation.TermSelections);
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
                    .Include(i => i.Products)
                    .Include(i => i.OtherCharges)
                    .Include(i => i.TermSelections)
                    .Include(i => i.PaidInfos)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();

                return Ok(invoices.Select(i => MapInvoiceToResponse(i)));
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
                    .Include(i => i.Products)
                    .Include(i => i.OtherCharges)
                    .Include(i => i.TermSelections)
                    .Include(i => i.PaidInfos)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                return Ok(MapInvoiceToResponse(invoice));
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

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, MapInvoiceToResponse(invoice));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the invoice." });
            }
        }

        [HttpPut("invoices/{id}")]
        public async Task<IActionResult> UpdateInvoice(int id, [FromBody] InvoiceRequestDto request)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Products)
                    .Include(i => i.OtherCharges)
                    .Include(i => i.TermSelections)
                    .Include(i => i.PaidInfos)
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
                _context.DocumentProducts.RemoveRange(invoice.Products);
                _context.DocumentOtherCharges.RemoveRange(invoice.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(invoice.TermSelections);
                _context.DocumentPaidInfos.RemoveRange(invoice.PaidInfos);

                await SaveDocumentChildren(invoice.Id, "Invoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                return Ok(MapInvoiceToResponse(invoice));
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
                    .Include(i => i.Products)
                    .Include(i => i.OtherCharges)
                    .Include(i => i.TermSelections)
                    .Include(i => i.PaidInfos)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                _context.DocumentProducts.RemoveRange(invoice.Products);
                _context.DocumentOtherCharges.RemoveRange(invoice.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(invoice.TermSelections);
                _context.DocumentPaidInfos.RemoveRange(invoice.PaidInfos);
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                return Ok(purchaseOrders.Select(p => MapPurchaseOrderToResponse(p)));
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                return Ok(MapPurchaseOrderToResponse(purchaseOrder));
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
                var purchaseOrder = new PurchaseOrder { UserId = userId };
                MapPurchaseOrderRequestToEntity(request, purchaseOrder);
                purchaseOrder.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                purchaseOrder.Status = "In-Progress";

                _context.PurchaseOrders.Add(purchaseOrder);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(purchaseOrder.Id, "PurchaseOrder", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPurchaseOrder), new { id = purchaseOrder.Id }, MapPurchaseOrderToResponse(purchaseOrder));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the purchase order." });
            }
        }

        [HttpPut("purchaseorders/{id}")]
        public async Task<IActionResult> UpdatePurchaseOrder(int id, [FromBody] PurchaseOrderRequestDto request)
        {
            try
            {
                var purchaseOrder = await _context.PurchaseOrders
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                MapPurchaseOrderRequestToEntity(request, purchaseOrder);
                purchaseOrder.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                purchaseOrder.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                _context.DocumentProducts.RemoveRange(purchaseOrder.Products);
                _context.DocumentOtherCharges.RemoveRange(purchaseOrder.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(purchaseOrder.TermSelections);

                await SaveDocumentChildren(purchaseOrder.Id, "PurchaseOrder", request.Products, request.OtherCharges, request.TermsIds, null);
                await _context.SaveChangesAsync();

                return Ok(MapPurchaseOrderToResponse(purchaseOrder));
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (purchaseOrder == null)
                {
                    return NotFound(new { message = "Purchase order not found." });
                }

                _context.DocumentProducts.RemoveRange(purchaseOrder.Products);
                _context.DocumentOtherCharges.RemoveRange(purchaseOrder.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(purchaseOrder.TermSelections);
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .Include(p => p.PaidInfos)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                return Ok(proformaInvoices.Select(p => MapProformaInvoiceToResponse(p)));
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .Include(p => p.PaidInfos)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                return Ok(MapProformaInvoiceToResponse(proformaInvoice));
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
                var proformaInvoice = new ProformaInvoice { UserId = userId };
                MapProformaInvoiceRequestToEntity(request, proformaInvoice);
                proformaInvoice.GrandTotal = CalculateGrandTotal(request.Products, request.OtherCharges);
                proformaInvoice.PaidTotal = request.PaidInfo?.Sum(p => p.Amount) ?? 0;
                proformaInvoice.BalanceDue = proformaInvoice.GrandTotal - proformaInvoice.PaidTotal;
                proformaInvoice.Status = "In-Progress";

                _context.ProformaInvoices.Add(proformaInvoice);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(proformaInvoice.Id, "ProformaInvoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProformaInvoice), new { id = proformaInvoice.Id }, MapProformaInvoiceToResponse(proformaInvoice));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating proforma invoice for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the proforma invoice." });
            }
        }

        [HttpPut("proformainvoices/{id}")]
        public async Task<IActionResult> UpdateProformaInvoice(int id, [FromBody] ProformaInvoiceRequestDto request)
        {
            try
            {
                var proformaInvoice = await _context.ProformaInvoices
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .Include(p => p.PaidInfos)
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
                _context.DocumentProducts.RemoveRange(proformaInvoice.Products);
                _context.DocumentOtherCharges.RemoveRange(proformaInvoice.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(proformaInvoice.TermSelections);
                _context.DocumentPaidInfos.RemoveRange(proformaInvoice.PaidInfos);

                await SaveDocumentChildren(proformaInvoice.Id, "ProformaInvoice", request.Products, request.OtherCharges, request.TermsIds, request.PaidInfo);
                await _context.SaveChangesAsync();

                return Ok(MapProformaInvoiceToResponse(proformaInvoice));
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
                    .Include(p => p.Products)
                    .Include(p => p.OtherCharges)
                    .Include(p => p.TermSelections)
                    .Include(p => p.PaidInfos)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (proformaInvoice == null)
                {
                    return NotFound(new { message = "Proforma invoice not found." });
                }

                _context.DocumentProducts.RemoveRange(proformaInvoice.Products);
                _context.DocumentOtherCharges.RemoveRange(proformaInvoice.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(proformaInvoice.TermSelections);
                _context.DocumentPaidInfos.RemoveRange(proformaInvoice.PaidInfos);
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
                    .Include(d => d.Products)
                    .Include(d => d.OtherCharges)
                    .Include(d => d.TermSelections)
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();

                return Ok(deliveryNotes.Select(d => MapDeliveryNoteToResponse(d)));
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
                    .Include(d => d.Products)
                    .Include(d => d.OtherCharges)
                    .Include(d => d.TermSelections)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                return Ok(MapDeliveryNoteToResponse(deliveryNote));
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
                var deliveryNote = new DeliveryNote { UserId = userId };
                MapDeliveryNoteRequestToEntity(request, deliveryNote);
                deliveryNote.Status = "In-Progress";

                _context.DeliveryNotes.Add(deliveryNote);
                await _context.SaveChangesAsync();

                await SaveDocumentChildren(deliveryNote.Id, "DeliveryNote", request.Products, request.OtherCharges ?? new List<DocumentOtherChargeDto>(), request.TermsIds, null);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetDeliveryNote), new { id = deliveryNote.Id }, MapDeliveryNoteToResponse(deliveryNote));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating delivery note for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the delivery note." });
            }
        }

        [HttpPut("deliverynotes/{id}")]
        public async Task<IActionResult> UpdateDeliveryNote(int id, [FromBody] DeliveryNoteRequestDto request)
        {
            try
            {
                var deliveryNote = await _context.DeliveryNotes
                    .Include(d => d.Products)
                    .Include(d => d.OtherCharges)
                    .Include(d => d.TermSelections)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                MapDeliveryNoteRequestToEntity(request, deliveryNote);
                deliveryNote.UpdatedAt = DateTime.UtcNow;

                // Remove existing children
                _context.DocumentProducts.RemoveRange(deliveryNote.Products);
                _context.DocumentOtherCharges.RemoveRange(deliveryNote.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(deliveryNote.TermSelections);

                await SaveDocumentChildren(deliveryNote.Id, "DeliveryNote", request.Products, request.OtherCharges ?? new List<DocumentOtherChargeDto>(), request.TermsIds, null);
                await _context.SaveChangesAsync();

                return Ok(MapDeliveryNoteToResponse(deliveryNote));
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
                    .Include(d => d.Products)
                    .Include(d => d.OtherCharges)
                    .Include(d => d.TermSelections)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliveryNote == null)
                {
                    return NotFound(new { message = "Delivery note not found." });
                }

                _context.DocumentProducts.RemoveRange(deliveryNote.Products);
                _context.DocumentOtherCharges.RemoveRange(deliveryNote.OtherCharges);
                _context.DocumentTermSelections.RemoveRange(deliveryNote.TermSelections);
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
                var receipt = new Receipt { UserId = userId };
                MapReceiptRequestToEntity(request, receipt);
                receipt.Status = "In-Progress";

                _context.Receipts.Add(receipt);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, MapReceiptToResponse(receipt));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating receipt for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the receipt." });
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
        private static readonly string[] DocumentDateFormats = { "dd/MM/yyyy", "yyyy-MM-dd", "yyyy-MM-ddTHH:mm:ss" };

        private static bool TryParseDocumentDate(string? value, out DateTime date)
        {
            date = default;
            if (string.IsNullOrWhiteSpace(value)) return false;

            if (DateTime.TryParseExact(value, DocumentDateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                return true;

            // Last-resort fallback for any format not covered above.
            return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
        }

        private async Task SaveDocumentChildren(int documentId, string documentType, List<DocumentProductDto> products, List<DocumentOtherChargeDto> charges, List<string> termIds, List<DocumentPaidInfoDto>? paidInfos)
        {
            if (products != null)
            {
                foreach (var p in products)
                {
                    // Parse ProductId when present so the line item stays linked back
                    // to its catalog Product row (this was previously dropped here,
                    // so every saved document line lost its ProductId even though the
                    // request DTO carried one).
                    int? productId = int.TryParse(p.ProductId, out int parsedProductId) ? parsedProductId : (int?)null;

                    _context.DocumentProducts.Add(new DocumentProduct
                    {
                        DocumentType = documentType,
                        DocumentId = documentId,
                        ProductId = productId,
                        ProductName = p.Name,
                        Price = p.Price,
                        Gst = p.Gst,
                        Qty = p.Qty,
                        Unit = p.Unit,
                        Hsn = p.Hsn,
                        Description = p.Description
                    });
                }
            }

            if (charges != null)
            {
                foreach (var c in charges)
                {
                    _context.DocumentOtherCharges.Add(new DocumentOtherCharge
                    {
                        DocumentType = documentType,
                        DocumentId = documentId,
                        Label = c.Label,
                        Amount = c.Amount,
                        IsTaxable = c.Taxable
                    });
                }
            }

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
                            TermId = id
                        });
                    }
                }
            }

            if (paidInfos != null)
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
                            Amount = p.Amount,
                            Note = p.Note
                        });
                    }
                }
            }
        }

        // ============================================================
        // MAPPING METHODS - QUOTATION
        // ============================================================

        private QuotationResponseDto MapQuotationToResponse(Quotation q)
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
                Products = q.Products.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId?.ToString(),
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = q.OtherCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = q.TermSelections.Select(t => t.TermId.ToString()).ToList(),
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

        private InvoiceResponseDto MapInvoiceToResponse(Invoice inv)
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
                Products = inv.Products.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId?.ToString(),
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = inv.OtherCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = inv.TermSelections.Select(t => t.TermId.ToString()).ToList(),
                PaidInfo = inv.PaidInfos.Select(p => new DocumentPaidInfoDto
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

        private PurchaseOrderResponseDto MapPurchaseOrderToResponse(PurchaseOrder po)
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
                Products = po.Products.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId?.ToString(),
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = po.OtherCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = po.TermSelections.Select(t => t.TermId.ToString()).ToList(),
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

        private ProformaInvoiceResponseDto MapProformaInvoiceToResponse(ProformaInvoice pi)
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
                Products = pi.Products.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId?.ToString(),
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = pi.OtherCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = pi.TermSelections.Select(t => t.TermId.ToString()).ToList(),
                PaidInfo = pi.PaidInfos.Select(p => new DocumentPaidInfoDto
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

        private DeliveryNoteResponseDto MapDeliveryNoteToResponse(DeliveryNote dn)
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
                Products = dn.Products.Select(p => new DocumentProductDto
                {
                    ProductId = p.ProductId?.ToString(),
                    Name = p.ProductName,
                    Price = p.Price,
                    Gst = p.Gst,
                    Qty = p.Qty,
                    Unit = p.Unit,
                    Hsn = p.Hsn,
                    Description = p.Description
                }).ToList(),
                OtherCharges = dn.OtherCharges.Select(c => new DocumentOtherChargeDto
                {
                    Id = c.Id.ToString(),
                    Label = c.Label,
                    Amount = c.Amount,
                    Taxable = c.IsTaxable
                }).ToList(),
                TermsIds = dn.TermSelections.Select(t => t.TermId.ToString()).ToList(),
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
            entity.PaidAmount = dto.PaidAmount;
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