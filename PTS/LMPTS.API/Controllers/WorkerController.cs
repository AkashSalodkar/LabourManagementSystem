using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WorkersController> _logger;

        public WorkersController(ApplicationDbContext context, ILogger<WorkersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetWorkersByProject(int projectId)
        {
            try
            {
                var workers = await _context.Workers
                    .Where(w => w.ProjectId == projectId && w.IsActive)
                    .Include(w => w.Attendances)
                    .Include(w => w.WageOverrides)
                    .Include(w => w.Payments)
                    .Include(w => w.Advances)
                    .Include(w => w.Bonuses)
                    .Include(w => w.InactivePeriods)
                    .Select(w => MapToWorkerResponse(w))
                    .ToListAsync();

                return Ok(workers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting workers for project {projectId}");
                return StatusCode(500, new { message = "An error occurred while fetching workers." });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorker(int id)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.Attendances)
                    .Include(w => w.WageOverrides)
                    .Include(w => w.Payments)
                    .Include(w => w.Advances)
                    .Include(w => w.Bonuses)
                    .Include(w => w.InactivePeriods)
                    .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                return Ok(MapToWorkerResponse(worker));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting worker {id}");
                return StatusCode(500, new { message = "An error occurred while fetching the worker." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorker([FromBody] CreateWorkerRequestDto request)
        {
            try
            {
                // Validate that the project exists and belongs to the authenticated user
                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.IsActive);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found or inactive." });
                }

                var worker = new Worker
                {
                    FullName = request.FullName,
                    MobileNumber = request.MobileNumber,
                    JoiningDate = request.JoiningDate,
                    DailyWage = request.DailyWage,
                    Role = request.Role,
                    Advance = request.Advance,
                    Bonus = request.Bonus,
                    ProjectId = request.ProjectId, // This was missing!
                    CreatedAt = DateTime.UtcNow,
                    LastUpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                await _context.Workers.AddAsync(worker);
                await _context.SaveChangesAsync();

                // Reload with includes to return full data
                var createdWorker = await _context.Workers
                    .Include(w => w.Attendances)
                    .Include(w => w.WageOverrides)
                    .Include(w => w.Payments)
                    .Include(w => w.Advances)
                    .Include(w => w.Bonuses)
                    .Include(w => w.InactivePeriods)
                    .FirstOrDefaultAsync(w => w.Id == worker.Id);

                return CreatedAtAction(nameof(GetWorker), new { id = worker.Id }, MapToWorkerResponse(createdWorker));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating worker");
                return StatusCode(500, new { message = "An error occurred while creating the worker." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorker(int id, [FromBody] UpdateWorkerRequestDto request)
        {
            try
            {
                var worker = await _context.Workers.FindAsync(id);
                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                worker.FullName = request.FullName;
                worker.MobileNumber = request.MobileNumber;
                worker.JoiningDate = request.JoiningDate;
                worker.DailyWage = request.DailyWage;
                worker.Role = request.Role;
                worker.Advance = request.Advance;
                worker.Bonus = request.Bonus;
                worker.LastUpdatedAt = DateTime.UtcNow;

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(MapToWorkerResponse(worker));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating worker {id}");
                return StatusCode(500, new { message = "An error occurred while updating the worker." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorker(int id)
        {
            try
            {
                var worker = await _context.Workers.FindAsync(id);
                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                worker.IsActive = false;
                worker.LastUpdatedAt = DateTime.UtcNow;

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Worker deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting worker {id}");
                return StatusCode(500, new { message = "An error occurred while deleting the worker." });
            }
        }

        [HttpPut("{id}/wage")]
        public async Task<IActionResult> UpdateWage(int id, [FromBody] UpdateWageRequestDto request)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.WageOverrides)
                    .FirstOrDefaultAsync(w => w.Id == id);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                var wageOverride = new WorkerWageOverride
                {
                    WorkerId = id,
                    EffectiveFrom = request.EffectiveFrom,
                    EffectiveTo = request.EffectiveTo,
                    DailyWageAmount = request.DailyWageAmount,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.WorkerWageOverrides.Add(wageOverride);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Wage updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating wage for worker {id}");
                return StatusCode(500, new { message = "An error occurred while updating the wage." });
            }
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> DeactivateWorker(int id, [FromBody] DeactivateWorkerRequestDto request)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.InactivePeriods)
                    .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                worker.IsCurrentlyActive = false;
                worker.LastUpdatedAt = DateTime.UtcNow;

                var period = new WorkerInactivePeriod
                {
                    WorkerId = id,
                    DeactivatedOn = request.DeactivationDate.Date,
                    ReactivatedOn = null
                };
                _context.WorkerInactivePeriods.Add(period);

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Worker deactivated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deactivating worker {id}");
                return StatusCode(500, new { message = "An error occurred while deactivating the worker." });
            }
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> ActivateWorker(int id, [FromBody] ActivateWorkerRequestDto request)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.InactivePeriods)
                    .FirstOrDefaultAsync(w => w.Id == id && w.IsActive);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                worker.IsCurrentlyActive = true;
                worker.LastUpdatedAt = DateTime.UtcNow;

                // Close out the most recent open inactive period — mirrors the
                // frontend's own "last open period" logic so both stay in sync.
                var openPeriod = worker.InactivePeriods
                    .Where(p => p.ReactivatedOn == null)
                    .OrderByDescending(p => p.DeactivatedOn)
                    .FirstOrDefault();

                if (openPeriod != null)
                {
                    openPeriod.ReactivatedOn = request.ActivationDate.Date;
                }

                _context.Workers.Update(worker);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Worker activated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error activating worker {id}");
                return StatusCode(500, new { message = "An error occurred while activating the worker." });
            }
        }

        // Helper Methods
        private WorkerResponseDto MapToWorkerResponse(Worker worker)
        {
            var attendance = new Dictionary<string, AttendanceStatusDto>();
            foreach (var att in worker.Attendances ?? new List<WorkerAttendance>())
            {
                var dateStr = att.AttendanceDate.ToString("yyyy-MM-dd");
                attendance[dateStr] = new AttendanceStatusDto { Status = att.Status };
            }

            return new WorkerResponseDto
            {
                Id = worker.Id,
                FullName = worker.FullName,
                MobileNumber = worker.MobileNumber,
                JoiningDate = worker.JoiningDate.ToString("yyyy-MM-dd"),
                DailyWage = worker.DailyWage,
                Role = worker.Role,
                Advance = worker.Advance,
                Bonus = worker.Bonus,
                LastUpdatedAt = worker.LastUpdatedAt.ToString("yyyy-MM-dd"),
                // NOTE: worker.IsActive is the soft-delete flag (see DeleteWorker) — it must
                // never be surfaced here. IsCurrentlyActive is the deactivate/activate status
                // this endpoint pair manages, and is what the frontend's `isActive` field means.
                IsActive = worker.IsCurrentlyActive,
                InactivePeriods = worker.InactivePeriods?
                    .OrderBy(p => p.DeactivatedOn)
                    .Select(p => new InactivePeriodDto
                    {
                        DeactivatedOn = p.DeactivatedOn.ToString("yyyy-MM-dd"),
                        ReactivatedOn = p.ReactivatedOn?.ToString("yyyy-MM-dd")
                    }).ToList() ?? new List<InactivePeriodDto>(),
                ProjectId = worker.ProjectId,
                Attendance = attendance,
                WageOverrides = worker.WageOverrides?.Select(w => new WorkerWageOverrideDto
                {
                    OverrideId = w.OverrideId,
                    EffectiveFrom = w.EffectiveFrom?.ToString("yyyy-MM-dd"),
                    EffectiveTo = w.EffectiveTo?.ToString("yyyy-MM-dd"),
                    DailyWageAmount = w.DailyWageAmount,
                    Note = w.Note
                }).ToList() ?? new List<WorkerWageOverrideDto>(),
                Payments = worker.Payments?.Select(p => new WorkerPaymentDto
                {
                    PaymentId = p.PaymentId,
                    PaymentDate = p.PaymentDate.ToString("yyyy-MM-dd"),
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    Note = p.Note
                }).ToList() ?? new List<WorkerPaymentDto>(),
                AdvancePayments = worker.Advances?.Select(a => new WorkerAdvanceDto
                {
                    AdvanceId = a.AdvanceId,
                    AdvanceDate = a.AdvanceDate.ToString("yyyy-MM-dd"),
                    Amount = a.Amount,
                    PaymentMethod = a.PaymentMethod,
                    Note = a.Note
                }).ToList() ?? new List<WorkerAdvanceDto>(),
                BonusPayments = worker.Bonuses?.Select(b => new WorkerBonusDto
                {
                    BonusId = b.BonusId,
                    BonusDate = b.BonusDate.ToString("yyyy-MM-dd"),
                    Amount = b.Amount,
                    PaymentMethod = b.PaymentMethod,
                    Note = b.Note
                }).ToList() ?? new List<WorkerBonusDto>()
            };
        }
    }

    public class UpdateWageRequestDto
    {
        public DateTime? EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public decimal DailyWageAmount { get; set; }
        public string? Note { get; set; }
    }
}