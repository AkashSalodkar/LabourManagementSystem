using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LMPTS.Domain.Entities;
using LMPTS.Infrastructure.Data;
using LMPTS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LMPTS.Controllers
{
    // Provider: Razorpay "UPI QR Codes" (single-use, fixed-amount QR + signed webhook).
    // Verify the endpoints/payload against Razorpay's current docs before going live.
    [ApiController]
    [Route("api/subscription")]
    public class SubscriptionController : ControllerBase
    {
        private readonly ApplicationDbContext _db; private readonly SubscriptionService _svc;
        private readonly IConfiguration _cfg; private readonly IHttpClientFactory _http;
        private readonly ILogger<SubscriptionController> _log;
        public SubscriptionController(ApplicationDbContext db, SubscriptionService svc, IConfiguration cfg, IHttpClientFactory http, ILogger<SubscriptionController> log)
        { _db = db; _svc = svc; _cfg = cfg; _http = http; _log = log; }

        // Take the caller from the authenticated session. Adjust the claim to match your /auth/login cookie/JWT.
        private int? CallerId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
        private bool Forbidden(int userId) => CallerId != null && CallerId != userId;

        [HttpGet("status")]
        public async Task<IActionResult> Status([FromQuery] int userId)
            => Forbidden(userId) ? Forbid() : Ok(await _svc.GetStatusAsync(userId));

        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromQuery] int userId)
        {
            if (Forbidden(userId)) return Forbid();
            var st = await _svc.GetStatusAsync(userId);
            if (st.State == "trial") return BadRequest(new { message = "Your free trial is still active." });

            var orderRef = Guid.NewGuid().ToString("N");
            var expires = DateTime.UtcNow.AddMinutes(15);
            var http = _http.CreateClient();
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_cfg["Razorpay:KeyId"]}:{_cfg["Razorpay:KeySecret"]}")));
            var body = JsonSerializer.Serialize(new
            {
                type = "upi_qr", name = "Monthly Subscription", usage = "single_use",
                fixed_amount = true, payment_amount = (int)(SubscriptionService.Price * 100),
                description = "30-day subscription",
                close_by = new DateTimeOffset(expires).ToUnixTimeSeconds(),
                notes = new { orderRef, userId = userId.ToString() }
            });
            var res = await http.PostAsync("https://api.razorpay.com/v1/payments/qr_codes", new StringContent(body, Encoding.UTF8, "application/json"));
            var txt = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode) { _log.LogError("QR create failed: {T}", txt); return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." }); }
            var qr = JsonDocument.Parse(txt).RootElement;

            var p = new SubscriptionPayment
            {
                UserId = userId, OrderRef = orderRef, ProviderQrId = qr.GetProperty("id").GetString()!,
                QrImageUrl = qr.GetProperty("image_url").GetString()!, Amount = SubscriptionService.Price,
                Status = "pending", CreatedAt = DateTime.UtcNow, ExpiresAt = expires
            };
            _db.SubscriptionPayments.Add(p); await _db.SaveChangesAsync();
            return Ok(new { orderId = p.OrderRef, qrImage = p.QrImageUrl, upiUri = (string?)null, amount = p.Amount, expiresAt = DateTime.SpecifyKind(p.ExpiresAt, DateTimeKind.Utc) });
        }

        // The app polls this. It only READS what the webhook already verified.
        [HttpGet("orders/{orderId}")]
        public async Task<IActionResult> OrderStatus(string orderId, [FromQuery] int userId)
        {
            if (Forbidden(userId)) return Forbid();
            var p = await _db.SubscriptionPayments.FirstOrDefaultAsync(x => x.OrderRef == orderId && x.UserId == userId);
            if (p == null) return NotFound();
            if (p.Status == "pending" && DateTime.UtcNow > p.ExpiresAt.AddMinutes(2)) { p.Status = "expired"; await _db.SaveChangesAsync(); }
            return Ok(new { status = p.Status });
        }

        // ---- Gateway webhook: the ONLY thing that can activate a subscription ----
        [AllowAnonymous]
        [HttpPost("webhook/razorpay")]
        public async Task<IActionResult> Webhook()
        {
            using var reader = new StreamReader(Request.Body);
            var raw = await reader.ReadToEndAsync();

            // 1. Signature: HMAC-SHA256 of the RAW body with the webhook secret
            var sig = Request.Headers["X-Razorpay-Signature"].ToString();
            var expected = Convert.ToHexString(new HMACSHA256(Encoding.UTF8.GetBytes(_cfg["Razorpay:WebhookSecret"]!))
                .ComputeHash(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
            if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(sig)))
                return Unauthorized();

            var root = JsonDocument.Parse(raw).RootElement;
            if (root.GetProperty("event").GetString() != "qr_code.credited") return Ok();

            var payload = root.GetProperty("payload");
            var qrId = payload.GetProperty("qr_code").GetProperty("entity").GetProperty("id").GetString()!;
            var paymentId = payload.GetProperty("payment").GetProperty("entity").GetProperty("id").GetString()!;

            // 2. Re-fetch the payment from the gateway; don't trust the webhook body alone
            var http = _http.CreateClient();
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_cfg["Razorpay:KeyId"]}:{_cfg["Razorpay:KeySecret"]}")));
            var r = await http.GetAsync($"https://api.razorpay.com/v1/payments/{paymentId}");
            if (!r.IsSuccessStatusCode) return StatusCode(500);   // gateway retries the webhook
            var v = JsonDocument.Parse(await r.Content.ReadAsStringAsync()).RootElement;
            var ok = v.GetProperty("status").GetString() == "captured"
                  && v.GetProperty("amount").GetInt32() == (int)(SubscriptionService.Price * 100)
                  && v.GetProperty("currency").GetString() == "INR"
                  && v.GetProperty("method").GetString() == "upi";
            if (!ok) { _log.LogWarning("Rejected payment {P}", paymentId); return Ok(); }
            string? rrn = v.TryGetProperty("acquirer_data", out var aq) && aq.TryGetProperty("rrn", out var rr) ? rr.GetString() : null;

            // 3. Match our pending order (one QR = one order = one user), activate exactly once
            var order = await _db.SubscriptionPayments.FirstOrDefaultAsync(x => x.ProviderQrId == qrId);
            if (order == null) { _log.LogWarning("No order for QR {Q}", qrId); return Ok(); }
            if (order.Status == "paid") return Ok();   // duplicate webhook delivery
            try { await _svc.ActivateAsync(order, paymentId, rrn); }
            catch (DbUpdateException) { _log.LogWarning("Payment {P} already used", paymentId); }
            return Ok();
        }
    }

    // Server-side gate: once trial/subscription is over, data endpoints return 402.
    // IMPORTANT: it identifies the caller from the authenticated user's NameIdentifier claim. The API does not
    // issue authenticated sessions yet (login only returns userId), so until it does, requests have no claim
    // and this filter lets them through. See SETUP.md, "Make the backend gate real".
    public class SubscriptionRequiredFilter : IAsyncActionFilter
    {
        private readonly SubscriptionService _svc;
        public SubscriptionRequiredFilter(SubscriptionService svc) => _svc = svc;
        public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
        {
            var ctrl = ctx.RouteData.Values["controller"]?.ToString();
            if (ctrl is "Auth" or "Subscription") { await next(); return; }   // login, status, payment stay reachable
            if (!int.TryParse(ctx.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            { await next(); return; }                                          // unauthenticated: your existing auth handles it
            if (!await _svc.HasAccessAsync(userId))
            { ctx.Result = new ObjectResult(new { code = "SUBSCRIPTION_REQUIRED", message = "Your trial has ended. Please subscribe." }) { StatusCode = 402 }; return; }
            await next();
        }
    }
}
