using System.ComponentModel.DataAnnotations;

namespace LMPTS.Entities
{
    public class User
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = "";

        public string MobileNumber { get; set; } = "";

        public string PasswordHash { get; set; } = "";

        public string Role { get; set; } = "";

        public Builder? Builder { get; set; }
        public BuilderSupervisor? BuilderSupervisor { get; set; }


        public Contractor? Contractor { get; set; }

        public ContractorSupervisor? ContractorSupervisor { get; set; }

        public Labor? Labor { get; set; }
    }
}
