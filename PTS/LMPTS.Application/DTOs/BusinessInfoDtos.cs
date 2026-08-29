using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class BusinessInfoRequestDto
    {
        public string? LogoImg { get; set; }
        public string? SignatureImg { get; set; }
        public string? QrCodeImg { get; set; }
        public string? BusinessName { get; set; }
        public string? ContactName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? OtherInfo { get; set; }
        public string? BusinessCategory { get; set; }
        public string? TaxLabel { get; set; }
        public string? TaxNumber { get; set; }
        public string? State { get; set; }
        public string? BankAccountName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? IfscCode { get; set; }
        public string? UpiId { get; set; }
    }

    public class BusinessInfoResponseDto : BusinessInfoRequestDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}