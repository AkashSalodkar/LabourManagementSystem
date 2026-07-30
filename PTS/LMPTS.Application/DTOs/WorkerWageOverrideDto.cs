using System;
using System.Collections.Generic;
using System.Text;

namespace LMPTS.Application.DTOs
{
    
    public class WorkerWageOverrideDto
    {
        public int OverrideId { get; set; }
        public decimal DailyWageAmount { get; set; }
        public string EffectiveFrom { get; set; }
        public string EffectiveTo { get; set; }
        public string Note { get; set; }
    }
    
}
