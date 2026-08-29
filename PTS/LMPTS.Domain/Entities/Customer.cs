using System;

namespace LMPTS.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        // Basic Info
        public string Name { get; set; }
        public string? CompanyName { get; set; }
        public string? Email { get; set; }
        public string? Mobile { get; set; }

        // Billing Address
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? OtherInfo { get; set; }
        public string? Gstin { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }

        // Shipping Address
        public string? ShippingAddressLine1 { get; set; }
        public string? ShippingAddressLine2 { get; set; }
        public string? ShippingCity { get; set; }
        public string? ShippingState { get; set; }
        public string? ShippingPincode { get; set; }
        public bool ShippingSameAsBilling { get; set; }

        // Combined address strings
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }

        // Navigation property
        public virtual User? User { get; set; }  // Add this line

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}