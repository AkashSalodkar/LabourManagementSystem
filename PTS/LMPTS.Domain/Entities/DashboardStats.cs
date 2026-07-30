using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Domain.Entities
{
    [Table("DashboardStats")]
    public class DashboardStats
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int StatsId { get; set; }

        [Required]
        public int UserId { get; set; }

        public int TotalProjects { get; set; }
        public int TotalWorkers { get; set; }
        public int PresentToday { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalDue { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;
    }
}