namespace LMPTS.Infrastructure.Services
{
    public class SubscriptionStatusDto
    {
        public string State { get; set; } = "trial";  // trial | trial_expired | active | expired
        public bool AccessAllowed { get; set; }
        public int DaysRemaining { get; set; }
        public DateTime? TrialStartAt { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? SubscriptionStartAt { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal? PaidAmount { get; set; }
        public string? PaymentReference { get; set; }
    }
}