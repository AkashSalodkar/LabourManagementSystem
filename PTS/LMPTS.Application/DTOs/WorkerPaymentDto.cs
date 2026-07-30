using System;
using System.Collections.Generic;
using System.Text;

namespace LMPTS.Application.DTOs
{
    public class WorkerPaymentDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Note { get; set; }
    }
}
