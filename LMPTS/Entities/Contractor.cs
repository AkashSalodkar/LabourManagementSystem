using System.ComponentModel.DataAnnotations.Schema;

namespace LMPTS.Entities
{
    public class Contractor
    {
        public int ContractorId { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty ;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int? BuilderSupervisorId { get; set; }
        public BuilderSupervisor? BuilderSupervisors { get; set; }

        public ICollection<ContractorSupervisor> ContractorSupervisors { get; set; }
            = new List<ContractorSupervisor>();

        public ICollection<Labor> Labors { get; set; }
            = new List<Labor>();

        public ICollection<BuilderContractor> BuilderContractors { get; set; }
            = new List<BuilderContractor>();
    }
}
