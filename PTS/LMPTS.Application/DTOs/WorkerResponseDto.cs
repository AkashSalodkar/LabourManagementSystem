using System.ComponentModel.DataAnnotations;

namespace LMPTS.Application.DTOs
{
    public class WorkerResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string MobileNumber { get; set; }
        public string JoiningDate { get; set; } // String, not DateTime
        public decimal DailyWage { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
        public List<InactivePeriodDto> InactivePeriods { get; set; }
        public decimal Advance { get; set; }
        public decimal Bonus { get; set; }
        public int ProjectId { get; set; }
        public Dictionary<string, AttendanceStatusDto> Attendance { get; set; }
        public List<WorkerPaymentDto> Payments { get; set; }
        public List<WorkerAdvanceDto> AdvancePayments { get; set; }
        public List<WorkerBonusDto> BonusPayments { get; set; }
        public List<WorkerWageOverrideDto> WageOverrides { get; set; }
        public string LastUpdatedAt { get; set; } // String, not DateTime
        public string PaymentStartDate { get; set; } // String, not DateTime
    }

    public class AttendanceRecordDto
    {
        public string Status { get; set; } // P, HD, A
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Date { get; set; }
        public string Method { get; set; }
        public string Note { get; set; }
    }

    public class AdvancePaymentDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Date { get; set; }
        public string Method { get; set; }
        public string Note { get; set; }
    }

    public class BonusPaymentDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Date { get; set; }
        public string Method { get; set; }
        public string Note { get; set; }
    }

    public class WageOverrideDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string From { get; set; }
        public string To { get; set; }
        public string Note { get; set; }
    }
}