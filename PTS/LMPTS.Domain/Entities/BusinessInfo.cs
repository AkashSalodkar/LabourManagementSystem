using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("BusinessInfos")]
    public class BusinessInfo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public string? LogoImg { get; set; }
        public string? SignatureImg { get; set; }

        [MaxLength(100)]
        public string? BusinessName { get; set; }

        [MaxLength(100)]
        public string? ContactName { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(15)]
        public string? Phone { get; set; }

        [MaxLength(200)]
        public string? AddressLine1 { get; set; }

        [MaxLength(200)]
        public string? AddressLine2 { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        public string? OtherInfo { get; set; }

        [MaxLength(100)]
        public string? BusinessCategory { get; set; }

        [MaxLength(20)]
        public string? TaxLabel { get; set; }

        [MaxLength(50)]
        public string? TaxNumber { get; set; }

        [MaxLength(50)]
        public string? State { get; set; }

        [MaxLength(100)]
        public string? BankAccountName { get; set; }

        [MaxLength(50)]
        public string? BankAccountNumber { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(20)]
        public string? IfscCode { get; set; }

        [MaxLength(100)]
        public string? UpiId { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}