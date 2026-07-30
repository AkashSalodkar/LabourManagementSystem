using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AttendanceController> _logger;

        public AttendanceController(ApplicationDbContext context, ILogger<AttendanceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("mark")]
        public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceRequestDto request)
        {
            try
            {
                var worker = await _context.Workers
                    .Include(w => w.Attendances)
                    .FirstOrDefaultAsync(w => w.Id == request.WorkerId);

                if (worker == null)
                {
                    return NotFound(new { message = "Worker not found." });
                }

                // Check if attendance already exists for this date
                var existingAttendance = await _context.WorkerAttendances
                    .FirstOrDefaultAsync(a => a.WorkerId == request.WorkerId && a.AttendanceDate.Date == request.AttendanceDate.Date);

                var dailyRate = worker.DailyWage;
                var netAmount = CalculateNetAmount(dailyRate, request.Status);

                if (existingAttendance != null)
                {
                    existingAttendance.Status = request.Status;
                    existingAttendance.DailyRate = dailyRate;
                    existingAttendance.NetAmount = netAmount;
                    existingAttendance.UpdatedAt = DateTime.UtcNow;

                    _context.WorkerAttendances.Update(existingAttendance);
                }
                else
                {
                    var attendance = new WorkerAttendance
                    {
                        WorkerId = request.WorkerId,
                        AttendanceDate = request.AttendanceDate.Date,
                        Status = request.Status,
                        DailyRate = dailyRate,
                        NetAmount = netAmount,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _context.WorkerAttendances.AddAsync(attendance);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Attendance marked successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking attendance");
                return StatusCode(500, new { message = "An error occurred while marking attendance." });
            }
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> BulkMarkAttendance([FromBody] BulkMarkAttendanceRequestDto request)
        {
            try
            {
                var workers = await _context.Workers
                    .Where(w => w.ProjectId == request.ProjectId && w.IsActive)
                    .Include(w => w.Attendances)
                    .ToListAsync();

                if (workers == null || !workers.Any())
                {
                    return NotFound(new { message = "No workers found for this project." });
                }

                var attendances = new List<WorkerAttendance>();

                foreach (var worker in workers)
                {
                    foreach (var date in request.Dates)
                    {
                        // Skip if date is before joining date
                        if (date.Date < worker.JoiningDate.Date) continue;

                        var existingAttendance = await _context.WorkerAttendances
                            .FirstOrDefaultAsync(a => a.WorkerId == worker.Id && a.AttendanceDate.Date == date.Date);

                        var dailyRate = worker.DailyWage;
                        var netAmount = CalculateNetAmount(dailyRate, request.Status);

                        if (existingAttendance != null)
                        {
                            existingAttendance.Status = request.Status;
                            existingAttendance.DailyRate = dailyRate;
                            existingAttendance.NetAmount = netAmount;
                            existingAttendance.UpdatedAt = DateTime.UtcNow;
                            _context.WorkerAttendances.Update(existingAttendance);
                        }
                        else
                        {
                            var attendance = new WorkerAttendance
                            {
                                WorkerId = worker.Id,
                                AttendanceDate = date.Date,
                                Status = request.Status,
                                DailyRate = dailyRate,
                                NetAmount = netAmount,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            attendances.Add(attendance);
                        }
                    }
                }

                if (attendances.Any())
                {
                    await _context.WorkerAttendances.AddRangeAsync(attendances);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Bulk attendance marked successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking bulk attendance");
                return StatusCode(500, new { message = "An error occurred while marking bulk attendance." });
            }
        }

        [HttpGet("worker/{workerId}")]
        public async Task<IActionResult> GetWorkerAttendance(int workerId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var query = _context.WorkerAttendances
                    .Where(a => a.WorkerId == workerId);

                if (startDate.HasValue)
                {
                    query = query.Where(a => a.AttendanceDate.Date >= startDate.Value.Date);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(a => a.AttendanceDate.Date <= endDate.Value.Date);
                }

                var attendances = await query
                    .OrderByDescending(a => a.AttendanceDate)
                    .ToListAsync();

                return Ok(attendances.Select(a => new AttendanceResponseDto
                {
                    AttendanceId = a.AttendanceId,
                    WorkerId = a.WorkerId,
                    AttendanceDate = a.AttendanceDate,
                    Status = a.Status,
                    DailyRate = a.DailyRate,
                    NetAmount = a.NetAmount
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting attendance for worker {workerId}");
                return StatusCode(500, new { message = "An error occurred while fetching attendance." });
            }
        }

        [HttpDelete("{attendanceId}")]
        public async Task<IActionResult> DeleteAttendance(int attendanceId)
        {
            try
            {
                var attendance = await _context.WorkerAttendances.FindAsync(attendanceId);
                if (attendance == null)
                {
                    return NotFound(new { message = "Attendance record not found." });
                }

                _context.WorkerAttendances.Remove(attendance);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Attendance record deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting attendance {attendanceId}");
                return StatusCode(500, new { message = "An error occurred while deleting attendance." });
            }
        }

        [HttpDelete("date")]
        public async Task<IActionResult> DeleteAttendanceByDate([FromQuery] int projectId, [FromQuery] DateTime date)
        {
            try
            {
                var workers = await _context.Workers
                    .Where(w => w.ProjectId == projectId && w.IsActive)
                    .Select(w => w.Id)
                    .ToListAsync();

                var attendances = await _context.WorkerAttendances
                    .Where(a => workers.Contains(a.WorkerId) && a.AttendanceDate.Date == date.Date)
                    .ToListAsync();

                if (!attendances.Any())
                {
                    return Ok(new { message = "No attendance records found for this date." });
                }

                _context.WorkerAttendances.RemoveRange(attendances);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Deleted {attendances.Count} attendance records for {date:yyyy-MM-dd}." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting attendance for date {date}");
                return StatusCode(500, new { message = "An error occurred while deleting attendance." });
            }
        }

        private decimal CalculateNetAmount(decimal dailyRate, string status)
        {
            return status switch
            {
                "P" => dailyRate,
                "HD" => dailyRate / 2,
                "A" => 0,
                _ => 0
            };
        }
    }
}