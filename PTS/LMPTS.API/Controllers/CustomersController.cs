using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(ApplicationDbContext context, ILogger<CustomersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomers([FromQuery] int userId)
        {
            try
            {
                var customers = await _context.Customers
                    .Where(c => c.UserId == userId)
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                return Ok(customers.Select(c => MapToResponse(c)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customers for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching customers." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found." });
                }

                return Ok(MapToResponse(customer));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the customer." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] CustomerRequestDto request, [FromQuery] int userId)
        {
            try
            {
                var customer = new Customer { UserId = userId };
                MapToEntity(request, customer);

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, MapToResponse(customer));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating the customer." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] CustomerRequestDto request)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found." });
                }

                MapToEntity(request, customer);
                customer.UpdatedAt = DateTime.UtcNow;

                _context.Customers.Update(customer);
                await _context.SaveChangesAsync();

                return Ok(MapToResponse(customer));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the customer." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found." });
                }

                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Customer deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting customer {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the customer." });
            }
        }

        private CustomerResponseDto MapToResponse(Customer customer)
        {
            return new CustomerResponseDto
            {
                Id = customer.Id,
                UserId = customer.UserId,
                Name = customer.Name,
                CompanyName = customer.CompanyName,
                Email = customer.Email,
                Mobile = customer.Mobile,
                AddressLine1 = customer.AddressLine1,
                AddressLine2 = customer.AddressLine2,
                AddressLine3 = customer.City,  // Map City to AddressLine3 for frontend
                OtherInfo = customer.OtherInfo,
                Gstin = customer.Gstin,
                State = customer.State,
                Pincode = customer.Pincode,
                ShippingAddressLine1 = customer.ShippingAddressLine1,
                ShippingAddressLine2 = customer.ShippingAddressLine2,
                ShippingCity = customer.ShippingCity,
                ShippingState = customer.ShippingState,
                ShippingPincode = customer.ShippingPincode,
                BillingAddress = customer.BillingAddress,
                ShippingAddress = customer.ShippingAddress,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt
            };
        }

        private void MapToEntity(CustomerRequestDto dto, Customer entity)
        {
            entity.Name = dto.Name;
            entity.CompanyName = dto.CompanyName;
            entity.Email = dto.Email;
            entity.Mobile = dto.Mobile;
            entity.AddressLine1 = dto.AddressLine1;
            entity.AddressLine2 = dto.AddressLine2;
            entity.City = dto.AddressLine3;  // Map AddressLine3 to City
            entity.OtherInfo = dto.OtherInfo;
            entity.Gstin = dto.Gstin;
            entity.State = dto.State;
            entity.Pincode = dto.Pincode;
            entity.ShippingAddressLine1 = dto.ShippingAddressLine1;
            entity.ShippingAddressLine2 = dto.ShippingAddressLine2;
            entity.ShippingCity = dto.ShippingCity;
            entity.ShippingState = dto.ShippingState;
            entity.ShippingPincode = dto.ShippingPincode;
            entity.BillingAddress = dto.BillingAddress;
            entity.ShippingAddress = dto.ShippingAddress;
        }
    }
}