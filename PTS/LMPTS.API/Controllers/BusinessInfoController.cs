using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LMPTS.Application.DTOs;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;

namespace LMPTS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BusinessInfoController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BusinessInfoController> _logger;

        public BusinessInfoController(ApplicationDbContext context, ILogger<BusinessInfoController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetBusinessInfo([FromQuery] int userId)
        {
            try
            {
                var info = await _context.BusinessInfos
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                if (info == null)
                {
                    return Ok(new BusinessInfoResponseDto { UserId = userId });
                }

                return Ok(MapToResponse(info));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting business info for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while fetching business info." });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateBusinessInfo([FromBody] BusinessInfoRequestDto request, [FromQuery] int userId)
        {
            try
            {
                var info = await _context.BusinessInfos
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                if (info == null)
                {
                    info = new BusinessInfo { UserId = userId };
                    _context.BusinessInfos.Add(info);
                }

                MapToEntity(request, info);
                info.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(MapToResponse(info));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating business info for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while updating business info." });
            }
        }

        private BusinessInfoResponseDto MapToResponse(BusinessInfo info)
        {
            return new BusinessInfoResponseDto
            {
                Id = info.Id,
                UserId = info.UserId,
                LogoImg = info.LogoImg,
                SignatureImg = info.SignatureImg,
                QrCodeImg = info.QrCodeImg,
                BusinessName = info.BusinessName,
                ContactName = info.ContactName,
                Email = info.Email,
                Phone = info.Phone,
                AddressLine1 = info.AddressLine1,
                AddressLine2 = info.AddressLine2,
                City = info.City,
                OtherInfo = info.OtherInfo,
                BusinessCategory = info.BusinessCategory,
                TaxLabel = info.TaxLabel,
                TaxNumber = info.TaxNumber,
                State = info.State,
                BankAccountName = info.BankAccountName,
                BankAccountNumber = info.BankAccountNumber,
                BankName = info.BankName,
                IfscCode = info.IfscCode,
                UpiId = info.UpiId,
                CreatedAt = info.CreatedAt,
                UpdatedAt = info.UpdatedAt
            };
        }

        private void MapToEntity(BusinessInfoRequestDto dto, BusinessInfo entity)
        {
            if (!string.IsNullOrEmpty(dto.LogoImg)) entity.LogoImg = dto.LogoImg;
            if (!string.IsNullOrEmpty(dto.SignatureImg)) entity.SignatureImg = dto.SignatureImg;
            if (!string.IsNullOrEmpty(dto.QrCodeImg)) entity.QrCodeImg = dto.QrCodeImg;
            entity.BusinessName = dto.BusinessName;
            entity.ContactName = dto.ContactName;
            entity.Email = dto.Email;
            entity.Phone = dto.Phone;
            entity.AddressLine1 = dto.AddressLine1;
            entity.AddressLine2 = dto.AddressLine2;
            entity.City = dto.City;
            entity.OtherInfo = dto.OtherInfo;
            entity.BusinessCategory = dto.BusinessCategory;
            entity.TaxLabel = dto.TaxLabel;
            entity.TaxNumber = dto.TaxNumber;
            entity.State = dto.State;
            entity.BankAccountName = dto.BankAccountName;
            entity.BankAccountNumber = dto.BankAccountNumber;
            entity.BankName = dto.BankName;
            entity.IfscCode = dto.IfscCode;
            entity.UpiId = dto.UpiId;
        }
    }
}