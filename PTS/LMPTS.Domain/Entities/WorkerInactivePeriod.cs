using System;

namespace LMPTS.Domain.Entities
{
    // One row per deactivate/reactivate cycle for a worker. ReactivatedOn is null
    // while the worker is still deactivated (an "open" period); it's filled in
    // when they're reactivated. A worker can accumulate several of these over
    // time (e.g. seasonal leave, multiple stints), so this is a history, not a
    // single flag.
    public class WorkerInactivePeriod
    {
        public int InactivePeriodId { get; set; }

        public int WorkerId { get; set; }
        public Worker Worker { get; set; }

        public DateTime DeactivatedOn { get; set; }
        public DateTime? ReactivatedOn { get; set; }
    }
}
