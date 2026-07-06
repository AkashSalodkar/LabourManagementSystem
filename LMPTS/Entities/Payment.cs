namespace LMPTS.Entities
{ 
 public class Payment
        {
            public int PaymentId { get; set; }

            // Labor who is being paid
            public int LaborId { get; set; }
            public Labor Labor { get; set; } = null!;

            // Salary period
            public int Month { get; set; }
            public int Year { get; set; }

            // Attendance Summary
            public int PresentDays { get; set; }
            public int HalfDays { get; set; }
            public int AbsentDays { get; set; }

            // Work Details
            public decimal TotalHoursWorked { get; set; }
            public decimal OvertimeHours { get; set; }

            // Earnings
            public decimal DailyRate { get; set; }
            public decimal OvertimeRate { get; set; }

            public decimal GrossAmount { get; set; }

            // Adjustments
            public decimal Bonus { get; set; }
            public decimal Deduction { get; set; }
            public decimal AdvancePaid { get; set; }

            // Final Amount
            public decimal NetAmount { get; set; }

            // Payment Information
            public DateTime PaymentDate { get; set; }

            public PaymentStatus PaymentStatus { get; set; }

            public PaymentMode PaymentMode { get; set; }

            public string? TransactionReference { get; set; }

            public string? Remarks { get; set; }

            // Audit
            public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

            public DateTime? UpdatedOn { get; set; }
        }

        public enum PaymentStatus
        {
            Pending = 0,
            Paid = 1,
            Cancelled = 2
        }

        public enum PaymentMode
        {
            Cash = 0,
            BankTransfer = 1,
            UPI = 2,
            Cheque = 3
        }
    
}
