using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class CustomerRequestDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? OtherInfo { get; set; }
        public string? Gstin { get; set; }
        public string? State { get; set; }
        public string? ShippingAddress { get; set; }
        public string? BillingAddress { get; set; }
    }

    public class CustomerResponseDto : CustomerRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}