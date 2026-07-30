using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(ApplicationDbContext context, ILogger<PaymentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("record")]
        public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentRequestDto request)
        {
            try
            {
                var worker = await _context.Workers.FindAsync(request.WorkerId);
                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                var payment = new WorkerPayment
                {
                    WorkerId = request.WorkerId,
                    PaymentDate = request.PaymentDate,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.WorkerPayments.AddAsync(payment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Payment recorded successfully.", paymentId = payment.PaymentId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording payment");
                return StatusCode(500, new { message = "An error occurred while recording the payment." });
            }
        }

        [HttpPost("advance")]
        public async Task<IActionResult> RecordAdvance([FromBody] RecordAdvanceRequestDto request)
        {
            try
            {
                var worker = await _context.Workers.FindAsync(request.WorkerId);
                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                var advance = new WorkerAdvance
                {
                    WorkerId = request.WorkerId,
                    AdvanceDate = request.AdvanceDate,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.WorkerAdvances.AddAsync(advance);

                // Update worker's total advance
                worker.Advance += request.Amount;
                worker.LastUpdatedAt = DateTime.UtcNow;

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Advance recorded successfully.", advanceId = advance.AdvanceId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording advance");
                return StatusCode(500, new { message = "An error occurred while recording the advance." });
            }
        }

        [HttpPost("bonus")]
        public async Task<IActionResult> RecordBonus([FromBody] RecordBonusRequestDto request)
        {
            try
            {
                var worker = await _context.Workers.FindAsync(request.WorkerId);
                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                var bonus = new WorkerBonus
                {
                    WorkerId = request.WorkerId,
                    BonusDate = request.BonusDate,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.WorkerBonuses.AddAsync(bonus);

                // Update worker's total bonus
                worker.Bonus += request.Amount;
                worker.LastUpdatedAt = DateTime.UtcNow;

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Bonus recorded successfully.", bonusId = bonus.BonusId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording bonus");
                return StatusCode(500, new { message = "An error occurred while recording the bonus." });
            }
        }

        [HttpGet("history/{workerId}")]
        public async Task<IActionResult> GetPaymentHistory(int workerId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var payments = await _context.WorkerPayments
                    .Where(p => p.WorkerId == workerId)
                    .ToListAsync();

                var advances = await _context.WorkerAdvances
                    .Where(a => a.WorkerId == workerId)
                    .ToListAsync();

                var bonuses = await _context.WorkerBonuses
                    .Where(b => b.WorkerId == workerId)
                    .ToListAsync();

                var allTransactions = new List<object>();

                foreach (var p in payments)
                {
                    allTransactions.Add(new
                    {
                        p.PaymentId,
                        p.PaymentDate,
                        p.Amount,
                        p.PaymentMethod,
                        p.Note,
                        Type = "payment",
                        CreatedAt = p.CreatedAt
                    });
                }

                foreach (var a in advances)
                {
                    allTransactions.Add(new
                    {
                        a.AdvanceId,
                        a.AdvanceDate,
                        a.Amount,
                        a.PaymentMethod,
                        a.Note,
                        Type = "advance",
                        CreatedAt = a.CreatedAt
                    });
                }

                foreach (var b in bonuses)
                {
                    allTransactions.Add(new
                    {
                        b.BonusId,
                        b.BonusDate,
                        b.Amount,
                        b.PaymentMethod,
                        b.Note,
                        Type = "bonus",
                        CreatedAt = b.CreatedAt
                    });
                }

                var sorted = allTransactions
                    .OrderByDescending(t => t.GetType().GetProperty("PaymentDate")?.GetValue(t) ??
                                             t.GetType().GetProperty("AdvanceDate")?.GetValue(t) ??
                                             t.GetType().GetProperty("BonusDate")?.GetValue(t))
                    .ToList();

                return Ok(sorted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting payment history for worker {workerId}");
                return StatusCode(500, new { message = "An error occurred while fetching payment history." });
            }
        }

        [HttpGet("worker/{workerId}/balance")]
        public async Task<IActionResult> GetWorkerBalance(int workerId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.Attendances)
                    .Include(w => w.Payments)
                    .Include(w => w.Advances)
                    .Include(w => w.Bonuses)
                    .FirstOrDefaultAsync(w => w.Id == workerId);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                var totalWages = worker.Attendances?.Sum(a => a.NetAmount) ?? 0;
                var totalPayments = worker.Payments?.Sum(p => p.Amount) ?? 0;
                var totalAdvances = worker.Advances?.Sum(a => a.Amount) ?? 0;
                var totalBonuses = worker.Bonuses?.Sum(b => b.Amount) ?? 0;

                var balance = totalWages + totalBonuses - totalAdvances - totalPayments;

                return Ok(new
                {
                    workerId = worker.Id,
                    workerName = worker.FullName,
                    totalWages,
                    totalPayments,
                    totalAdvances,
                    totalBonuses,
                    balance,
                    advance = worker.Advance,
                    bonus = worker.Bonus
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting balance for worker {workerId}");
                return StatusCode(500, new { message = "An error occurred while fetching worker balance." });
            }
        }

        [HttpPut("payment/{paymentId}")]
        public async Task<IActionResult> UpdatePayment(int paymentId, [FromBody] UpdatePaymentRequestDto request)
        {
            try
            {
                var payment = await _context.WorkerPayments.FindAsync(paymentId);
                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found." });
                }

                payment.Amount = request.Amount;
                payment.PaymentMethod = request.PaymentMethod;
                payment.Note = request.Note;
                payment.UpdatedAt = DateTime.UtcNow;

                _context.WorkerPayments.Update(payment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Payment updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating payment {paymentId}");
                return StatusCode(500, new { message = "An error occurred while updating the payment." });
            }
        }

        [HttpDelete("payment/{paymentId}")]
        public async Task<IActionResult> DeletePayment(int paymentId)
        {
            try
            {
                var payment = await _context.WorkerPayments.FindAsync(paymentId);
                if (payment == null)
                {
                    return NotFound(new { message = "Payment not found." });
                }

                _context.WorkerPayments.Remove(payment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Payment deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting payment {paymentId}");
                return StatusCode(500, new { message = "An error occurred while deleting the payment." });
            }
        }

        [HttpDelete("advance/{advanceId}")]
        public async Task<IActionResult> DeleteAdvance(int advanceId)
        {
            try
            {
                var advance = await _context.WorkerAdvances
                    .Include(a => a.Worker)
                    .FirstOrDefaultAsync(a => a.AdvanceId == advanceId);

                if (advance == null)
                {
                    return NotFound(new { message = "Advance not found." });
                }

                // Update worker's total advance
                if (advance.Worker != null)
                {
                    advance.Worker.Advance -= advance.Amount;
                    advance.Worker.LastUpdatedAt = DateTime.UtcNow;
                    _context.Workers.Update(advance.Worker);
                }

                _context.WorkerAdvances.Remove(advance);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Advance deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting advance {advanceId}");
                return StatusCode(500, new { message = "An error occurred while deleting the advance." });
            }
        }

        [HttpDelete("bonus/{bonusId}")]
        public async Task<IActionResult> DeleteBonus(int bonusId)
        {
            try
            {
                var bonus = await _context.WorkerBonuses
                    .Include(b => b.Worker)
                    .FirstOrDefaultAsync(b => b.BonusId == bonusId);

                if (bonus == null)
                {
                    return NotFound(new { message = "Bonus not found." });
                }

                // Update worker's total bonus
                if (bonus.Worker != null)
                {
                    bonus.Worker.Bonus -= bonus.Amount;
                    bonus.Worker.LastUpdatedAt = DateTime.UtcNow;
                    _context.Workers.Update(bonus.Worker);
                }

                _context.WorkerBonuses.Remove(bonus);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Bonus deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting bonus {bonusId}");
                return StatusCode(500, new { message = "An error occurred while deleting the bonus." });
            }
        }
    }

    // Request DTOs for Payments
    public class RecordPaymentRequestDto
    {
        public int WorkerId { get; set; }
        public DateTime PaymentDate { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Note { get; set; }
    }

    public class RecordAdvanceRequestDto
    {
        public int WorkerId { get; set; }
        public DateTime AdvanceDate { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Note { get; set; }
    }

    public class RecordBonusRequestDto
    {
        public int WorkerId { get; set; }
        public DateTime BonusDate { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Note { get; set; }
    }

    public class UpdatePaymentRequestDto
    {
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Note { get; set; }
    }
}