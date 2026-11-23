using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace LMPTS.Infrastructure.Services
{
    public class SubscriptionService
    {
        public const decimal Price = 99m;      // ₹99
        public const int TrialDays = 45;
        public const int MonthlyDays = 30;
        // Keep rewarded/interstitial ad support dormant until the product is ready to show ads.
        // Set to true to re-enable the existing ad-supported expired-access flow.
        public const bool AdsEnabled = false;
        public const string AdsAccessMode = "ads";
        public const string ReadOnlyAccessMode = "readOnly";

        private readonly ApplicationDbContext _db;
        public SubscriptionService(ApplicationDbContext db) => _db = db;

        public async Task<Subscription> EnsureTrialAsync(int userId)
        {
            var existing = await _db.Subscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Trial);
            if (existing != null) return existing;

            var now = DateTime.UtcNow;
            var trial = new Subscription
            {
                UserId = userId,
                PlanType = SubscriptionPlan.Trial,
                StartDate = now,
                EndDate = now.AddDays(TrialDays),
                PricePaid = 0,
                PaymentMethod = null,
                IsActive = true,
                Note = "45-day free trial",
                CreatedAt = now,
                UpdatedAt = now,
            };
            _db.Subscriptions.Add(trial);
            await _db.SaveChangesAsync();
            return trial;
        }

        public async Task<SubscriptionStatusDto> GetStatusAsync(int userId)
        {
            await EnsureTrialAsync(userId);
            var now = DateTime.UtcNow;

            var trial = await _db.Subscriptions
                .Where(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Trial)
                .OrderByDescending(s => s.SubscriptionId)
                .FirstOrDefaultAsync();

            var activeMonthly = await _db.Subscriptions
                .Where(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Monthly
                         && s.IsActive && s.EndDate != null && s.EndDate > now)
                .OrderBy(s => s.StartDate)
                .ToListAsync();

            var latestPaid = await _db.Subscriptions
                .Where(s => s.UserId == userId && s.PlanType == SubscriptionPlan.Monthly)
                .OrderByDescending(s => s.PaidAt)
                .FirstOrDefaultAsync();

            var dto = new SubscriptionStatusDto
            {
                TrialStartAt = AsUtc(trial?.StartDate),
                TrialEndsAt = AsUtc(trial?.EndDate),
            };

            if (activeMonthly.Count > 0)
            {
                dto.State = "active";
                dto.AccessAllowed = true;
                dto.SubscriptionStartAt = AsUtc(activeMonthly.Min(s => s.StartDate));
                dto.SubscriptionEndsAt = AsUtc(activeMonthly.Max(s => s.EndDate!.Value));
                dto.DaysRemaining = Math.Max(0, (int)Math.Ceiling((activeMonthly.Max(s => s.EndDate!.Value) - now).TotalDays));
                dto.PaymentDate = AsUtc(activeMonthly.Last().PaidAt);
                dto.PaidAmount = activeMonthly.Last().PricePaid;
                dto.PaymentReference = activeMonthly.Last().PaymentReference;
            }
            else if (trial != null && trial.EndDate > now)
            {
                dto.State = "trial";
                dto.AccessAllowed = true;
                dto.DaysRemaining = Math.Max(0, (int)Math.Ceiling((trial.EndDate!.Value - now).TotalDays));
            }
            else
            {
                dto.State = "expired";
                dto.DaysRemaining = 0;
                dto.ExpiredAccessMode = await _db.Users
                    .AsNoTracking()
                    .Where(user => user.Id == userId)
                    .Select(user => user.ExpiredAccessMode)
                    .FirstOrDefaultAsync();
                dto.AdsEnabled = AdsEnabled;
                dto.ReadOnlyAccess = true;
                dto.AccessAllowed = true;
                if (latestPaid != null)
                {
                    dto.SubscriptionStartAt = AsUtc(latestPaid.StartDate);
                    dto.SubscriptionEndsAt = AsUtc(latestPaid.EndDate);
                    dto.PaymentDate = AsUtc(latestPaid.PaidAt);
                    dto.PaidAmount = latestPaid.PricePaid;
                    dto.PaymentReference = latestPaid.PaymentReference;
                }
            }
            return dto;
        }

        public async Task<SubscriptionStatusDto> SetExpiredAccessModeAsync(int userId, string mode)
        {
            if (mode != AdsAccessMode && mode != ReadOnlyAccessMode)
                throw new ArgumentOutOfRangeException(nameof(mode), "Unsupported expired access mode.");

            var status = await GetStatusAsync(userId);
            if (status.State != "expired")
                throw new InvalidOperationException("Free access modes are only available after the trial or subscription expires.");

            var user = await _db.Users.FirstOrDefaultAsync(user => user.Id == userId);
            if (user == null) throw new KeyNotFoundException("User not found.");

            user.ExpiredAccessMode = mode;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return await GetStatusAsync(userId);
        }

        public async Task<bool> HasAccessAsync(int userId)
            => (await GetStatusAsync(userId)).AccessAllowed;

        public async Task<RewardedAdAccess?> ConsumeRewardedWriteCreditAsync(int userId)
        {
            var strategy = _db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
                var now = DateTime.UtcNow;
                var credit = await _db.RewardedAdAccesses
                    .Where(access => access.UserId == userId
                        && access.TransactionId != null
                        && access.UsedAt == null
                        && access.ExpiresAt > now)
                    .OrderBy(access => access.CreatedAt)
                    .FirstOrDefaultAsync();

                if (credit == null)
                {
                    await transaction.CommitAsync();
                    return null;
                }

                credit.UsedAt = now;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                return credit;
            });
        }

        public async Task ReleaseRewardedWriteCreditAsync(int accessId)
        {
            var credit = await _db.RewardedAdAccesses
                .FirstOrDefaultAsync(access => access.RewardedAdAccessId == accessId);
            if (credit == null)
                throw new InvalidOperationException($"Rewarded access credit {accessId} was not found.");

            credit.UsedAt = null;
            await _db.SaveChangesAsync();
        }

        public async Task<bool> RecordExpiredWriteActionAsync(int userId)
        {
            var strategy = _db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
                var user = await _db.Users.FirstOrDefaultAsync(candidate => candidate.Id == userId);
                if (user == null)
                    throw new KeyNotFoundException($"User {userId} was not found while recording an expired-account action.");

                user.ExpiredWriteActionCount = (user.ExpiredWriteActionCount + 1) % 2;
                var interstitialDue = user.ExpiredWriteActionCount == 0;
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
                return interstitialDue;
            });
        }

        public async Task ActivateAsync(SubscriptionPayment order, string providerPaymentId, string? paymentReference)
        {
            if (order.Status == "paid") return;
            var now = DateTime.UtcNow;

            var currentEnd = await _db.Subscriptions
                .Where(s => s.UserId == order.UserId && s.PlanType == SubscriptionPlan.Monthly
                         && s.IsActive && s.EndDate != null)
                .OrderByDescending(s => s.EndDate)
                .Select(s => s.EndDate)
                .FirstOrDefaultAsync();

            var startFrom = (currentEnd.HasValue && currentEnd.Value > now) ? currentEnd.Value : now;
            var newEnd = startFrom.AddDays(MonthlyDays);

            _db.Subscriptions.Add(new Subscription
            {
                UserId = order.UserId,
                PlanType = SubscriptionPlan.Monthly,
                StartDate = startFrom,
                EndDate = newEnd,
                PricePaid = order.Amount,
                PaymentMethod = "UPI",
                IsActive = true,
                Note = "Paid subscription via Razorpay Checkout",
                ProviderPaymentId = providerPaymentId,
                PaymentReference = paymentReference,
                PaidAt = now,
                CreatedAt = now,
                UpdatedAt = now,
            });

            order.Status = "paid";
            var user = await _db.Users.FirstOrDefaultAsync(candidate => candidate.Id == order.UserId);
            if (user == null)
                throw new KeyNotFoundException($"User {order.UserId} was not found while activating a subscription.");
            user.ExpiredWriteActionCount = 0;
            await _db.SaveChangesAsync();
        }

        private static DateTime? AsUtc(DateTime? d)
            => d.HasValue ? DateTime.SpecifyKind(d.Value, DateTimeKind.Utc) : null;
    }
}