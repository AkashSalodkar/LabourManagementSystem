using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("Customers")]
    public class Customer
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? CompanyName { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(10)]
        public string? Mobile { get; set; }

        [MaxLength(200)]
        public string? AddressLine1 { get; set; }

        [MaxLength(200)]
        public string? AddressLine2 { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        public string? OtherInfo { get; set; }

        [MaxLength(50)]
        public string? Gstin { get; set; }

        [MaxLength(50)]
        public string? State { get; set; }

        public string? ShippingAddress { get; set; }

        public string? BillingAddress { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}