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
                    .Select(p => MapToResponse(p))
                    .ToListAsync();

                return Ok(products);
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
                var product = new Product { UserId = userId };
                MapToEntity(request, product);

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, MapToResponse(product));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the product." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductRequestDto request)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found." });
                }

                MapToEntity(request, product);
                product.UpdatedAt = DateTime.UtcNow;

                _context.Products.Update(product);
                await _context.SaveChangesAsync();

                return Ok(MapToResponse(product));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product." });
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
                _logger.LogError(ex, "Error deleting product {Id}", id);
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

        private void MapToEntity(ProductRequestDto dto, Product entity)
        {
            entity.Name = dto.Name;
            entity.Price = dto.Price;
            entity.Gst = dto.Gst;
            entity.Description = dto.Description;
            entity.Unit = dto.Unit;
            entity.Hsn = dto.Hsn;
        }
    }
}