using System.Collections.Concurrent;
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
    //
    // Only SERVER-side, gateway-verified payments can activate a subscription:
    //   1. the signed webhook (qr_code.credited or payment.captured), and
    //   2. a throttled server-to-gateway check made while the app polls an order.
    // The app itself can never mark anything as paid.
    [ApiController]
    [Route("api/subscription")]
    public class SubscriptionController : ControllerBase
    {
        private const string RazorpayApi = "https://api.razorpay.com/v1";

        // Throttle for the gateway check done while the app polls (orderRef -> last check, UTC).
        private static readonly ConcurrentDictionary<string, DateTime> LastGatewayCheck = new();

        private readonly ApplicationDbContext _db; private readonly SubscriptionService _svc;
        private readonly IConfiguration _cfg; private readonly IHttpClientFactory _http;
        private readonly ILogger<SubscriptionController> _log;
        public SubscriptionController(ApplicationDbContext db, SubscriptionService svc, IConfiguration cfg, IHttpClientFactory http, ILogger<SubscriptionController> log)
        { _db = db; _svc = svc; _cfg = cfg; _http = http; _log = log; }

        // Take the caller from the authenticated session. Adjust the claim to match your /auth/login cookie/JWT.
        // NOTE: the API does not issue authenticated sessions yet, so CallerId is null and Forbidden() lets
        // every request through. Once login issues a cookie/JWT this becomes a real ownership check.
        private int? CallerId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
        private bool Forbidden(int userId) => CallerId != null && CallerId != userId;
        // Plain 403 (Forbid() throws when no authentication scheme is configured).
        private IActionResult Deny() => StatusCode(403, new { message = "Not allowed." });

        private static int ExpectedPaise => (int)Math.Round(SubscriptionService.Price * 100m);

        private HttpClient GatewayClient()
        {
            var c = _http.CreateClient();
            c.Timeout = TimeSpan.FromSeconds(20);
            var cred = $"{_cfg["Razorpay:KeyId"]}:{_cfg["Razorpay:KeySecret"]}";
            c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(cred)));
            return c;
        }

        private static object OrderDto(SubscriptionPayment p) => new
        {
            orderId = p.OrderRef,
            qrImage = p.QrImageUrl,
            upiUri = (string?)null,
            amount = p.Amount,
            expiresAt = DateTime.SpecifyKind(p.ExpiresAt, DateTimeKind.Utc)
        };

        [HttpGet("status")]
        public async Task<IActionResult> Status([FromQuery] int userId)
        {
            if (Forbidden(userId)) return Deny();
            return Ok(await _svc.GetStatusAsync(userId));
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromQuery] int userId)
        {
            if (Forbidden(userId)) return Deny();
            var st = await _svc.GetStatusAsync(userId);
            if (st.State == "trial") return BadRequest(new { message = "Your free trial is still active." });

            // Re-use a QR that is still payable instead of creating a new one on every tap.
            var now = DateTime.UtcNow;
            var existing = await _db.SubscriptionPayments
                .Where(x => x.UserId == userId && x.Status == "pending" && x.ExpiresAt > now.AddMinutes(2))
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();
            if (existing != null) return Ok(OrderDto(existing));

            var orderRef = Guid.NewGuid().ToString("N");
            var expires = DateTime.UtcNow.AddMinutes(15);
            var body = JsonSerializer.Serialize(new
            {
                type = "upi_qr", name = "Monthly Subscription", usage = "single_use",
                fixed_amount = true, payment_amount = ExpectedPaise,
                description = "30-day subscription",
                close_by = new DateTimeOffset(expires).ToUnixTimeSeconds(),
                notes = new { orderRef, userId = userId.ToString() }
            });

            HttpResponseMessage res; string txt;
            try
            {
                res = await GatewayClient().PostAsync($"{RazorpayApi}/payments/qr_codes", new StringContent(body, Encoding.UTF8, "application/json"));
                txt = await res.Content.ReadAsStringAsync();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                _log.LogError(ex, "QR create request failed");
                return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." });
            }
            if (!res.IsSuccessStatusCode) { _log.LogError("QR create failed ({S}): {T}", (int)res.StatusCode, txt); return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." }); }

            using var doc = JsonDocument.Parse(txt);
            var qr = doc.RootElement;
            if (!qr.TryGetProperty("id", out var qrIdEl) || !qr.TryGetProperty("image_url", out var qrImgEl))
            { _log.LogError("QR create response missing id/image_url: {T}", txt); return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." }); }

            var p = new SubscriptionPayment
            {
                UserId = userId, OrderRef = orderRef, ProviderQrId = qrIdEl.GetString()!,
                QrImageUrl = qrImgEl.GetString()!, Amount = SubscriptionService.Price,
                Status = "pending", CreatedAt = DateTime.UtcNow, ExpiresAt = expires
            };
            _db.SubscriptionPayments.Add(p); await _db.SaveChangesAsync();
            return Ok(OrderDto(p));
        }

        // The app polls this. Activation only ever comes from a gateway-verified payment (webhook, or the
        // throttled server-side check below) - never from anything the app sends.
        [HttpGet("orders/{orderId}")]
        public async Task<IActionResult> OrderStatus(string orderId, [FromQuery] int userId)
        {
            if (Forbidden(userId)) return Deny();
            var p = await _db.SubscriptionPayments.FirstOrDefaultAsync(x => x.OrderRef == orderId && x.UserId == userId);
            if (p == null) return NotFound();

            if (p.Status == "pending")
            {
                // Safety net: ask the gateway directly in case the webhook is late, failed, or not subscribed
                // to the right event. Throttled so a polling app does not hammer the gateway.
                await TryReconcileAsync(p);
                if (p.Status == "pending" && DateTime.UtcNow > p.ExpiresAt.AddMinutes(2))
                { p.Status = "expired"; await _db.SaveChangesAsync(); }
            }
            if (p.Status != "pending") LastGatewayCheck.TryRemove(p.OrderRef, out _);
            return Ok(new { status = p.Status });
        }

        // ---- Gateway webhook ----
        [AllowAnonymous]
        [HttpPost("webhook/razorpay")]
        public async Task<IActionResult> Webhook()
        {
            // Raw bytes: the signature is computed over the exact body Razorpay sent.
            byte[] raw;
            using (var ms = new MemoryStream()) { await Request.Body.CopyToAsync(ms); raw = ms.ToArray(); }

            // 1. Signature: HMAC-SHA256 of the RAW body with the webhook secret
            var secret = _cfg["Razorpay:WebhookSecret"];
            if (string.IsNullOrWhiteSpace(secret)) { _log.LogError("Razorpay:WebhookSecret is not configured"); return StatusCode(500); }
            var sig = Request.Headers["X-Razorpay-Signature"].ToString();
            var expected = Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), raw)).ToLowerInvariant();
            if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(sig)))
                return Unauthorized();

            using var doc = TryParse(raw);
            if (doc == null) return BadRequest();
            var root = doc.RootElement;

            var evt = root.TryGetProperty("event", out var e) ? e.GetString() : null;
            if (evt != "qr_code.credited" && evt != "payment.captured") return Ok();
            if (!root.TryGetProperty("payload", out var payload)) return Ok();

            var paymentId = payload.TryGetProperty("payment", out var pp) && pp.TryGetProperty("entity", out var pe)
                            && pe.TryGetProperty("id", out var pid) ? pid.GetString() : null;
            // Only qr_code.credited carries the QR block; payment.captured does not.
            var qrId = payload.TryGetProperty("qr_code", out var qq) && qq.TryGetProperty("entity", out var qe)
                       && qe.TryGetProperty("id", out var qid) ? qid.GetString() : null;
            if (string.IsNullOrEmpty(paymentId)) return Ok();

            // 2. Re-fetch the payment from the gateway; don't trust the webhook body alone
            var r = await GatewayClient().GetAsync($"{RazorpayApi}/payments/{paymentId}");
            if (!r.IsSuccessStatusCode) return StatusCode(500);   // gateway retries the webhook
            using var payDoc = JsonDocument.Parse(await r.Content.ReadAsStringAsync());
            var v = payDoc.RootElement;
            if (!IsValidSubscriptionPayment(v)) { _log.LogInformation("Ignored payment {P} (not a captured UPI payment of the plan amount)", paymentId); return Ok(); }

            // 3. Match our order (one QR = one order = one user), activate exactly once
            var order = await FindOrderAsync(qrId, v, paymentId);
            if (order == null) { _log.LogWarning("No order for payment {P} (QR {Q})", paymentId, qrId); return Ok(); }
            if (order.Status == "paid") return Ok();   // duplicate webhook delivery
            await ActivateFromPaymentAsync(order, v);
            return Ok();
        }

        // ---------- helpers ----------

        private static JsonDocument? TryParse(byte[] bytes)
        {
            try { return JsonDocument.Parse(bytes); } catch (JsonException) { return null; }
        }

        private static bool IsValidSubscriptionPayment(JsonElement v) =>
            v.TryGetProperty("status", out var s) && s.GetString() == "captured"
            && v.TryGetProperty("amount", out var a) && a.TryGetInt32(out var amt) && amt == ExpectedPaise
            && v.TryGetProperty("currency", out var c) && c.GetString() == "INR"
            && v.TryGetProperty("method", out var m) && m.GetString() == "upi";

        // Activate once; the unique index on Subscriptions.ProviderPaymentId is the final guard against duplicates.
        private async Task<bool> ActivateFromPaymentAsync(SubscriptionPayment order, JsonElement pay)
        {
            if (order.Status == "paid") return true;
            if (!IsValidSubscriptionPayment(pay)) return false;
            var paymentId = pay.GetProperty("id").GetString()!;
            string? rrn = pay.TryGetProperty("acquirer_data", out var aq) && aq.TryGetProperty("rrn", out var rr) ? rr.GetString() : null;
            try { await _svc.ActivateAsync(order, paymentId, rrn); }
            catch (DbUpdateException)
            {
                _log.LogWarning("Payment {P} already used", paymentId);
                await _db.Entry(order).ReloadAsync();
            }
            return order.Status == "paid";
        }

        // Webhook -> order. qr_code.credited gives the QR id; payment.captured does not, so fall back to the
        // payment's notes, then to asking the gateway which recent pending QR the payment belongs to.
        private async Task<SubscriptionPayment?> FindOrderAsync(string? qrId, JsonElement pay, string paymentId)
        {
            if (!string.IsNullOrEmpty(qrId))
                return await _db.SubscriptionPayments.FirstOrDefaultAsync(x => x.ProviderQrId == qrId);

            if (pay.TryGetProperty("notes", out var notes) && notes.ValueKind == JsonValueKind.Object
                && notes.TryGetProperty("orderRef", out var o) && o.ValueKind == JsonValueKind.String)
            {
                var oref = o.GetString();
                if (!string.IsNullOrEmpty(oref))
                {
                    var byRef = await _db.SubscriptionPayments.FirstOrDefaultAsync(x => x.OrderRef == oref);
                    if (byRef != null) return byRef;
                }
            }

            // Kept small so the webhook answers quickly; the polling safety net covers anything missed here.
            var since = DateTime.UtcNow.AddHours(-2);
            var candidates = await _db.SubscriptionPayments
                .Where(x => x.Status != "paid" && x.CreatedAt > since && x.Amount == SubscriptionService.Price)
                .OrderByDescending(x => x.CreatedAt).Take(5).ToListAsync();
            foreach (var c in candidates)
                if (await QrHasPaymentAsync(c.ProviderQrId, paymentId)) return c;
            return null;
        }

        private async Task<bool> QrHasPaymentAsync(string qrId, string paymentId)
        {
            try
            {
                var res = await GatewayClient().GetAsync($"{RazorpayApi}/payments/qr_codes/{qrId}/payments");
                if (!res.IsSuccessStatusCode) return false;
                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("items", out var items)) return false;
                foreach (var it in items.EnumerateArray())
                    if (it.TryGetProperty("id", out var id) && id.GetString() == paymentId) return true;
            }
            catch (Exception ex) { _log.LogWarning(ex, "QR payments lookup failed for {Q}", qrId); }
            return false;
        }

        // Ask the gateway (server-to-server, with our secret key) for payments made against this order's QR.
        private async Task TryReconcileAsync(SubscriptionPayment order)
        {
            var now = DateTime.UtcNow;
            if (LastGatewayCheck.TryGetValue(order.OrderRef, out var last) && now - last < TimeSpan.FromSeconds(10)) return;
            LastGatewayCheck[order.OrderRef] = now;
            try
            {
                var res = await GatewayClient().GetAsync($"{RazorpayApi}/payments/qr_codes/{order.ProviderQrId}/payments");
                if (!res.IsSuccessStatusCode) { _log.LogWarning("QR payments lookup returned {S} for {Q}", (int)res.StatusCode, order.ProviderQrId); return; }
                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("items", out var items)) return;
                foreach (var it in items.EnumerateArray())
                    if (await ActivateFromPaymentAsync(order, it)) break;
            }
            catch (Exception ex) { _log.LogWarning(ex, "Gateway reconcile failed for order {O}", order.OrderRef); }
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
