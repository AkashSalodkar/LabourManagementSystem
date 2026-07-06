using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    public class ContractorSupervisor
    {
        public int ContractorSupervisorId { get; set; }
        public string Address { get; set; } = string.Empty;

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        public int? ContractorId { get; set; }

        public Contractor? Contractors { get; set; } = null!;

        public ICollection<Labor> Labors { get; set; }
            = new List<Labor>();
    }
}
