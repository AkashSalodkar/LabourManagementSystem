using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] int userId)
        {
            try
            {
                var products = await _context.Products
                    .Where(p => p.UserId == userId)
                    .OrderBy(p => p.Name)
                    .ToListAsync();

                return Ok(products.Select(p => MapToResponse(p)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting products for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching products." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found." });
                }

                return Ok(MapToResponse(product));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the product." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] ProductRequestDto request, [FromQuery] int userId)
        {
            try
            {
                // Log the incoming request for debugging
                _logger.LogInformation("Creating product for user {UserId}. Name: {Name}, Price: {Price}, GST: {Gst}",
                    userId, request.Name, request.Price, request.Gst);

                // Validate the request
                if (request == null)
                {
                    return BadRequest(new { message = "Product data is required." });
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Product name is required." });
                }

                // Create the product with proper values
                var product = new Product
                {
                    UserId = userId,
                    Name = request.Name.Trim(),
                    Price = request.Price > 0 ? request.Price : 0,
                    Gst = request.Gst >= 0 ? request.Gst : 0,
                    Description = request.Description ?? string.Empty,
                    Unit = request.Unit ?? string.Empty,
                    Hsn = request.Hsn ?? string.Empty
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                var response = MapToResponse(product);
                _logger.LogInformation("Product created successfully with ID {ProductId}", response.Id);

                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating product for user {UserId}", userId);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product for user {UserId}", userId);
                return StatusCode(500, new { message = "Error creating product: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductRequestDto request)
        {
            try
            {
                _logger.LogInformation("Updating product {ProductId}", id);

                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found." });
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Product name is required." });
                }

                product.Name = request.Name.Trim();
                product.Price = request.Price > 0 ? request.Price : 0;
                product.Gst = request.Gst >= 0 ? request.Gst : 0;
                product.Description = request.Description ?? string.Empty;
                product.Unit = request.Unit ?? string.Empty;
                product.Hsn = request.Hsn ?? string.Empty;
                product.UpdatedAt = DateTime.UtcNow;

                _context.Products.Update(product);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Product {ProductId} updated successfully", id);
                return Ok(MapToResponse(product));
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error updating product {ProductId}", id);
                return StatusCode(500, new { message = "Database error: " + dbEx.InnerException?.Message ?? dbEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, new { message = "Error updating product: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found." });
                }

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Product deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the product." });
            }
        }

        private ProductResponseDto MapToResponse(Product product)
        {
            return new ProductResponseDto
            {
                Id = product.Id,
                UserId = product.UserId,
                Name = product.Name,
                Price = product.Price,
                Gst = product.Gst,
                Description = product.Description,
                Unit = product.Unit,
                Hsn = product.Hsn,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            };
        }
    }
}