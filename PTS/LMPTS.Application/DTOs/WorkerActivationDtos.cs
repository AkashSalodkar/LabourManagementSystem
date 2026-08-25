using System;

namespace LMPTS.Application.DTOs
{
    public class DeactivateWorkerRequestDto
    {
        public DateTime DeactivationDate { get; set; }
    }

    public class ActivateWorkerRequestDto
    {
        public DateTime ActivationDate { get; set; }
    }

    public class InactivePeriodDto
    {
        public string DeactivatedOn { get; set; }
        public string? ReactivatedOn { get; set; }
    }
}
