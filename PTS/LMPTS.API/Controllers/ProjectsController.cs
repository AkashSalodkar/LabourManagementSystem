using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(ApplicationDbContext context, ILogger<ProjectsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserProjects(int userId)
        {
            try
            {
                _logger.LogInformation($"Fetching projects for user: {userId}");

                // Get projects with all related data
                var projects = await _context.Projects
                    .Where(p => p.UserId == userId && p.IsActive)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Attendances)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Payments)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Advances)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Bonuses)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.InactivePeriods)
                    .ToListAsync();

                _logger.LogInformation($"Found {projects.Count} projects for user {userId}");

                // Map to DTOs - using client-side evaluation for calculations
                var response = new List<ProjectResponseDto>();
                foreach (var project in projects)
                {
                    var projectDto = new ProjectResponseDto
                    {
                        Id = project.Id,
                        ProjectName = project.ProjectName ?? "Unnamed Project",
                        ProjectAddress = project.ProjectAddress,
                        WorkerCount = project.Workers?.Count(w => w.IsActive) ?? 0,
                        PresentToday = project.Workers?.Count(w => w.Attendances != null && w.Attendances.Any(a =>
                            a.AttendanceDate.Date == DateTime.UtcNow.Date &&
                            (a.Status == "P" || a.Status == "HD"))) ?? 0,
                        TotalDue = project.Workers?.Sum(w => CalculateTotalDue(w)) ?? 0,
                        LastModifiedAt = project.LastModifiedAt,
                        IsActive = project.IsActive,
                        Employees = project.Workers?.Where(w => w.IsActive)
                            .Select(w => MapToWorkerResponse(w)).ToList() ?? new List<WorkerResponseDto>()
                    };
                    response.Add(projectDto);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting projects for user {userId}");
                // Return empty array on error
                return Ok(new List<ProjectResponseDto>());
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            try
            {
                var project = await _context.Projects
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Attendances)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.WageOverrides)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Payments)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Advances)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.Bonuses)
                    .Include(p => p.Workers)
                        .ThenInclude(w => w.InactivePeriods)
                    .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found." });
                }

                var response = new ProjectResponseDto
                {
                    Id = project.Id,
                    ProjectName = project.ProjectName,
                    ProjectAddress = project.ProjectAddress,
                    WorkerCount = project.Workers.Count(w => w.IsActive),
                    PresentToday = project.Workers.Count(w => w.Attendances.Any(a =>
                        a.AttendanceDate.Date == DateTime.UtcNow.Date &&
                        (a.Status == "P" || a.Status == "HD"))),
                    TotalDue = project.Workers.Sum(w => CalculateTotalDue(w)),
                    LastModifiedAt = project.LastModifiedAt,
                    IsActive = project.IsActive,
                    Employees = project.Workers.Where(w => w.IsActive)
                        .Select(w => MapToWorkerResponse(w)).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting project {id}");
                return StatusCode(500, new { message = "An error occurred while fetching the project." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequestDto request)
        {
            try
            {
                if (request.UserId <= 0)
                    return BadRequest(new { message = "UserId is required." });

                var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
                if (!userExists)
                    return BadRequest(new { message = "Invalid user." });

                var project = new Project
                {
                    ProjectName = request.ProjectName,
                    ProjectAddress = request.ProjectAddress,
                    UserId = request.UserId,
                    CreatedAt = DateTime.UtcNow,
                    LastModifiedAt = DateTime.UtcNow,
                    IsActive = true
                };

                await _context.Projects.AddAsync(project);
                await _context.SaveChangesAsync();

                var response = new ProjectResponseDto
                {
                    Id = project.Id,
                    ProjectName = project.ProjectName,
                    ProjectAddress = project.ProjectAddress,
                    WorkerCount = 0,
                    PresentToday = 0,
                    TotalDue = 0,
                    LastModifiedAt = project.LastModifiedAt,
                    IsActive = project.IsActive,
                    Employees = new List<WorkerResponseDto>()
                };

                return CreatedAtAction(nameof(GetProject), new { id = project.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                return StatusCode(500, new { message = "An error occurred while creating the project." });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequestDto request)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                {
                    return NotFound(new { message = "Project not found." });
                }

                project.ProjectName = request.ProjectName;
                project.ProjectAddress = request.ProjectAddress;
                project.LastModifiedAt = DateTime.UtcNow;

                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Project updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating project {id}");
                return StatusCode(500, new { message = "An error occurred while updating the project." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);
                if (project == null)
                {
                    return NotFound(new { message = "Project not found." });
                }

                project.IsActive = false;
                project.LastModifiedAt = DateTime.UtcNow;

                _context.Projects.Update(project);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Project deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting project {id}");
                return StatusCode(500, new { message = "An error occurred while deleting the project." });
            }
        }

        // ==================== HELPER METHODS ====================

        private decimal CalculateTotalDue(Worker worker)
        {
            if (worker == null) return 0;

            // Calculate total wages from attendance
            var totalWages = worker.Attendances?.Sum(a => a.NetAmount) ?? 0;

            // Calculate total payments
            var totalPaid = worker.Payments?.Sum(p => p.Amount) ?? 0;

            // Total due = wages + bonus - advance - payments
            return totalWages + (worker.Bonus) - (worker.Advance) - totalPaid;
        }

        private WorkerResponseDto MapToWorkerResponse(Worker worker)
        {
            if (worker == null) return new WorkerResponseDto();

            var attendance = new Dictionary<string, AttendanceStatusDto>();
            if (worker.Attendances != null)
            {
                foreach (var att in worker.Attendances)
                {
                    var dateStr = att.AttendanceDate.ToString("yyyy-MM-dd");
                    attendance[dateStr] = new AttendanceStatusDto { Status = att.Status };
                }
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
                // NOTE: worker.IsActive is the soft-delete flag (see WorkerController.DeleteWorker)
                // — it must never be surfaced here. IsCurrentlyActive is the deactivate/activate
                // status managed by WorkerController's deactivate/activate endpoints, and is what
                // the frontend's `isActive` field means.
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
}