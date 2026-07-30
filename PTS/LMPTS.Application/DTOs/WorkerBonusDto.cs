using System;
using System.Collections.Generic;
using System.Text;

namespace LMPTS.Application.DTOs
{
    
    public class WorkerBonusDto
    {
        public int BonusId { get; set; }
        public decimal Amount { get; set; }
        public string BonusDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Note { get; set; }
    }
    
}
