using System;

namespace LMPTS.Application.DTOs
{
    public class DeactivateWorkerRequestDto
    {
        public DateTime DeactivationDate { get; set; }
    }

    // ActivateWorkerRequestDto removed - reactivation was intentionally removed
    // (see WorkerController.DeactivateWorker); there is no longer an activate endpoint.

    public class InactivePeriodDto
    {
        public string DeactivatedOn { get; set; }
        public string? ReactivatedOn { get; set; }
    }
}
