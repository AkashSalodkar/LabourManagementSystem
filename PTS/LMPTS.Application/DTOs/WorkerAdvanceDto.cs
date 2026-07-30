using System;
using System.Collections.Generic;
using System.Text;

namespace LMPTS.Application.DTOs
{
    
    public class WorkerAdvanceDto
    {
        public int AdvanceId { get; set; }
        public decimal Amount { get; set; }
        public string AdvanceDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Note { get; set; }
    }
    
}
