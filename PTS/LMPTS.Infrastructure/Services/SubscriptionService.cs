using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LMPTS.Infrastructure.Services
{
    // Field names are exactly what the React Subscription Page reads (camelCased by System.Text.Json).
    public class SubscriptionStatusDto
    {
        public string State { get; set; } = "";            // trial | trial_expired | active | expired
        public bool AccessAllowed { get; set; }
        public DateTime ServerTime { get; set; }
        public DateTime TrialStartAt { get; set; }
        public DateTime TrialEndsAt { get; set; }
        public int DaysRemaining { get; set; }
        public DateTime? SubscriptionStartAt { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal? PaidAmount { get; set; }
        public string? PaymentReference { get; set; }
    }

    public class SubscriptionService
    {
        public const int TrialDays = 30, PeriodDays = 30;
        public const decimal Price = 99m;

        private readonly ApplicationDbContext _db;
        public SubscriptionService(ApplicationDbContext db) => _db = db;

        // EF returns datetime2 as Kind=Unspecified; mark as UTC so JSON gets a "Z" and the app converts correctly.
        private static DateTime Utc(DateTime d) => DateTime.SpecifyKind(d, DateTimeKind.Utc);
        private static DateTime? Utc(DateTime? d) => d.HasValue ? Utc(d.Value) : null;

        /// Call from login (and register-complete). Idempotent: the unique index allows one trial row per user.
        public async Task EnsureTrialStartedAsync(int userId)
        {
            if (await _db.Subscriptions.AnyAsync(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Trial)) return;
            var now = DateTime.UtcNow;
            _db.Subscriptions.Add(new Subscription
            {
                UserId = userId, PlanType = SubscriptionPlan.Trial,
                StartDate = now, EndDate = now.AddDays(TrialDays),
                PricePaid = 0, Note = "30-day free trial", IsActive = true
            });
            try { await _db.SaveChangesAsync(); }
            catch (DbUpdateException) { /* concurrent first login created it; unique index keeps it to one */ }
        }

        public async Task<SubscriptionStatusDto> GetStatusAsync(int userId)
        {
            await EnsureTrialStartedAsync(userId);
            var now = DateTime.UtcNow;

            var trial = await _db.Subscriptions.AsNoTracking()
                .FirstAsync(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Trial);
            var paid = await _db.Subscriptions.AsNoTracking()
                .Where(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Monthly && s.IsActive)
                .OrderByDescending(s => s.EndDate).ToListAsync();

            var current = paid.FirstOrDefault(s => s.StartDate <= now && s.EndDate > now);
            var latestPaid = paid.FirstOrDefault();   // for showing payment info
            var trialEnds = trial.EndDate ?? trial.StartDate.AddDays(TrialDays);

            string state; bool allowed; DateTime? endForDays;
            if (current != null) { state = "active"; allowed = true; endForDays = current.EndDate; }
            else if (latestPaid != null && latestPaid.EndDate > now) { state = "active"; allowed = true; endForDays = latestPaid.EndDate; }
            else if (latestPaid == null && now < trialEnds) { state = "trial"; allowed = true; endForDays = trialEnds; }
            else if (latestPaid == null) { state = "trial_expired"; allowed = false; endForDays = null; }
            else { state = "expired"; allowed = false; endForDays = null; }

            var shown = current ?? latestPaid;
            return new SubscriptionStatusDto
            {
                State = state, AccessAllowed = allowed, ServerTime = now,
                TrialStartAt = Utc(trial.StartDate), TrialEndsAt = Utc(trialEnds),
                DaysRemaining = endForDays == null ? 0 : (int)Math.Ceiling((endForDays.Value - now).TotalDays),
                SubscriptionStartAt = Utc(shown?.StartDate), SubscriptionEndsAt = Utc(shown?.EndDate),
                PaymentDate = Utc(shown?.PaidAt), PaidAmount = shown?.PricePaid,
                PaymentReference = shown?.PaymentReference ?? shown?.ProviderPaymentId
            };
        }

        public async Task<bool> HasAccessAsync(int userId) => (await GetStatusAsync(userId)).AccessAllowed;

        /// Called ONLY from the verified webhook. Creates a 30-day "monthly" row starting at verification time
        /// (or right after the current period if the user renews early). Order update + new row save atomically;
        /// the unique index on ProviderPaymentId rejects a payment that was already used.
        public async Task ActivateAsync(SubscriptionPayment order, string providerPaymentId, string? upiReference)
        {
            var now = DateTime.UtcNow;
            var lastEnd = await _db.Subscriptions
                .Where(s => s.UserId == order.UserId && s.PlanType == SubscriptionPlan.Monthly && s.IsActive)
                .MaxAsync(s => (DateTime?)s.EndDate);
            var start = lastEnd.HasValue && lastEnd.Value > now ? lastEnd.Value : now;

            order.Status = "paid";
            _db.Subscriptions.Add(new Subscription
            {
                UserId = order.UserId, PlanType = SubscriptionPlan.Monthly,
                StartDate = start, EndDate = start.AddDays(PeriodDays),
                PricePaid = order.Amount, PaymentMethod = "UPI",
                ProviderPaymentId = providerPaymentId, PaymentReference = upiReference, PaidAt = now,
                Note = "30-day subscription", IsActive = true
            });
            await _db.SaveChangesAsync();   // throws DbUpdateException if providerPaymentId was already used
        }
    }
}
