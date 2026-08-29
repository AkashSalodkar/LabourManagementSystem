using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    
        public class CustomerRequestDto
        {
            public string Name { get; set; }
            public string CompanyName { get; set; }
            public string Email { get; set; }
            public string Mobile { get; set; }

            // Billing
            public string AddressLine1 { get; set; }
            public string AddressLine2 { get; set; }
            public string AddressLine3 { get; set; }  // This maps to City in the entity
            public string OtherInfo { get; set; }
            public string Gstin { get; set; }
            public string State { get; set; }
            public string Pincode { get; set; }

            // Shipping
            public string ShippingAddressLine1 { get; set; }
            public string ShippingAddressLine2 { get; set; }
            public string ShippingCity { get; set; }
            public string ShippingState { get; set; }
            public string ShippingPincode { get; set; }
            public bool ShippingSameAsBilling { get; set; }

            // Combined address strings
            public string BillingAddress { get; set; }
            public string ShippingAddress { get; set; }
        
    }

    public class CustomerResponseDto : CustomerRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}