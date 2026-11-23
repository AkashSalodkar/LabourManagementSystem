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
    // Provider: Razorpay Orders API + Standard Checkout, with signed webhook verification.
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
        private readonly IWebHostEnvironment _environment;
        public SubscriptionController(ApplicationDbContext db, SubscriptionService svc, IConfiguration cfg, IHttpClientFactory http, ILogger<SubscriptionController> log, IWebHostEnvironment environment)
        { _db = db; _svc = svc; _cfg = cfg; _http = http; _log = log; _environment = environment; }

        private static readonly ConcurrentDictionary<int, (string Pem, DateTime ExpiresAt)> AdMobPublicKeys = new();

        // Take the caller from the authenticated session. Adjust the claim to match your /auth/login cookie/JWT.
        // NOTE: the API does not issue authenticated sessions yet, so CallerId is null and Forbidden() lets
        // every request through. Once login issues a cookie/JWT this becomes a real ownership check.
        private int? CallerId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
        private bool Forbidden(int userId) => CallerId != null && CallerId != userId;
        // Plain 403 (Forbid() throws when no authentication scheme is configured).
        private IActionResult Deny() => StatusCode(403, new { message = "Not allowed." });

        private static int ExpectedPaise => (int)Math.Round(SubscriptionService.Price * 100m);

        private async Task<bool> HasCurrentSessionAsync(int userId)
        {
            var sessionToken = Request.Headers["X-Session-Token"].ToString();
            if (string.IsNullOrWhiteSpace(sessionToken)
                || !string.Equals(Request.Headers["X-User-Id"].ToString(), userId.ToString(), StringComparison.Ordinal))
                return false;

            var storedSessionToken = await _db.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => user.CurrentSessionToken)
                .FirstOrDefaultAsync();
            return !string.IsNullOrWhiteSpace(storedSessionToken)
                && string.Equals(storedSessionToken, sessionToken, StringComparison.Ordinal);
        }

        private async Task<string?> GetAdMobPublicKeyAsync(int keyId)
        {
            if (AdMobPublicKeys.TryGetValue(keyId, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
                return cached.Pem;

            var response = await _http.CreateClient().GetAsync("https://www.gstatic.com/admob/reward/verifier-keys.json");
            if (!response.IsSuccessStatusCode)
            {
                _log.LogError("AdMob verifier keys request failed with status {StatusCode}", (int)response.StatusCode);
                return null;
            }

            using var keysDocument = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (!keysDocument.RootElement.TryGetProperty("keys", out var keys))
                throw new InvalidOperationException("AdMob verifier keys response does not contain keys.");

            var expiresAt = DateTime.UtcNow.AddHours(24);
            foreach (var key in keys.EnumerateArray())
            {
                if (!key.TryGetProperty("keyId", out var id)
                    || !id.TryGetInt32(out var currentKeyId)
                    || !key.TryGetProperty("pem", out var pemElement)
                    || pemElement.ValueKind != JsonValueKind.String)
                    continue;

                var pem = pemElement.GetString();
                if (string.IsNullOrWhiteSpace(pem))
                    continue;

                AdMobPublicKeys[currentKeyId] = (pem, expiresAt);
                if (currentKeyId == keyId)
                    return pem;
            }

            return null;
        }

        private HttpClient GatewayClient()
        {
            var c = _http.CreateClient();
            c.Timeout = TimeSpan.FromSeconds(20);
            var cred = $"{_cfg["Razorpay:KeyId"]}:{_cfg["Razorpay:KeySecret"]}";
            c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes(cred)));
            return c;
        }

        private object OrderDto(SubscriptionPayment p) => new
        {
            orderId = p.OrderRef,
            razorpayOrderId = p.ProviderOrderId,
            razorpayKeyId = _cfg["Razorpay:KeyId"],
            amountSubunits = ExpectedPaise,
            currency = "INR",
            amount = p.Amount,
            expiresAt = DateTime.SpecifyKind(p.ExpiresAt, DateTimeKind.Utc)
        };

        [HttpPost("rewarded-access/challenge")]
        public async Task<IActionResult> CreateRewardedAccessChallenge()
        {
            if (!int.TryParse(Request.Headers["X-User-Id"], out var userId)
                || !await HasCurrentSessionAsync(userId))
                return Unauthorized(new { code = "NO_SESSION", message = "Not signed in." });

            var status = await _svc.GetStatusAsync(userId);
            if (status.State != "expired")
                return Conflict(new { message = "Rewarded ad access is only needed after your subscription expires." });

            var now = DateTime.UtcNow;
            var challenge = new RewardedAdAccess
            {
                UserId = userId,
                ChallengeToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(),
                CreatedAt = now,
                ExpiresAt = now.AddMinutes(15),
            };
            _db.RewardedAdAccesses.Add(challenge);
            await _db.SaveChangesAsync();
            return Ok(new { challengeToken = challenge.ChallengeToken });
        }

        [HttpGet("rewarded-access/status")]
        public async Task<IActionResult> RewardedAccessStatus([FromQuery] string challengeToken)
        {
            if (!int.TryParse(Request.Headers["X-User-Id"], out var userId)
                || !await HasCurrentSessionAsync(userId))
                return Unauthorized(new { code = "NO_SESSION", message = "Not signed in." });

            var challenge = await _db.RewardedAdAccesses
                .AsNoTracking()
                .FirstOrDefaultAsync(access => access.ChallengeToken == challengeToken
                    && access.UserId == userId
                    && access.ExpiresAt > DateTime.UtcNow);
            if (challenge == null)
                return NotFound(new { message = "Rewarded ad verification expired. Please watch another ad." });

            return Ok(new { verified = challenge.TransactionId != null });
        }

        [HttpPost("rewarded-access/test-confirm")]
        public async Task<IActionResult> ConfirmDevelopmentTestReward([FromBody] DevelopmentTestRewardRequest request)
        {
            if (!_environment.IsDevelopment() || !_cfg.GetValue<bool>("AdMob:AllowTestRewards"))
                return NotFound();

            if (!int.TryParse(Request.Headers["X-User-Id"], out var userId)
                || !await HasCurrentSessionAsync(userId))
                return Unauthorized(new { code = "NO_SESSION", message = "Not signed in." });

            // Development-only endpoint. Google's test ads return their own reward values (not
            // necessarily amount 1 / the configured item), so only require that a reward was earned.
            // Production credits are granted only through the signed AdMob SSV callback below.
            if (request.RewardAmount < 1)
                return BadRequest(new { message = "The rewarded ad did not return a valid reward." });

            var status = await _svc.GetStatusAsync(userId);
            if (status.State != "expired")
                return Conflict(new { message = "Test rewarded access is only available after subscription expiry." });

            var challenge = await _db.RewardedAdAccesses
                .FirstOrDefaultAsync(access => access.ChallengeToken == request.ChallengeToken
                    && access.UserId == userId
                    && access.TransactionId == null
                    && access.ExpiresAt > DateTime.UtcNow);
            if (challenge == null)
                return NotFound(new { message = "Rewarded ad verification expired. Please watch another ad." });

            challenge.TransactionId = $"dev-test-{challenge.ChallengeToken}";
            await _db.SaveChangesAsync();
            _log.LogInformation("Granted development-only test ad credit to user {UserId}", userId);
            return Ok(new { verified = true });
        }

        [AllowAnonymous]
        [HttpGet("rewarded-access/ssv")]
        public async Task<IActionResult> RewardedAccessSsv()
        {
            var rawQuery = Request.QueryString.Value?.TrimStart('?') ?? "";
            var signatureMarker = rawQuery.LastIndexOf("&signature=", StringComparison.Ordinal);
            if (signatureMarker <= 0 || !rawQuery.EndsWith("&key_id=" + Request.Query["key_id"], StringComparison.Ordinal))
                return BadRequest();

            var queryToVerify = Encoding.UTF8.GetBytes(rawQuery[..signatureMarker]);
            if (!int.TryParse(Request.Query["key_id"], out var keyId))
                return BadRequest();

            string signatureText;
            try
            {
                var signatureStart = signatureMarker + "&signature=".Length;
                var signatureEnd = rawQuery.IndexOf("&key_id=", signatureStart, StringComparison.Ordinal);
                if (signatureEnd < 0)
                    return BadRequest();
                signatureText = Uri.UnescapeDataString(rawQuery[signatureStart..signatureEnd]);
            }
            catch (UriFormatException)
            {
                return BadRequest();
            }

            byte[] signature;
            try
            {
                var base64 = signatureText.Replace('-', '+').Replace('_', '/');
                base64 = base64.PadRight(base64.Length + ((4 - base64.Length % 4) % 4), '=');
                signature = Convert.FromBase64String(base64);
            }
            catch (FormatException)
            {
                return BadRequest();
            }

            var publicKeyPem = await GetAdMobPublicKeyAsync(keyId);
            if (publicKeyPem == null)
            {
                _log.LogError("No current AdMob verifier key found for key ID {KeyId}", keyId);
                return StatusCode(StatusCodes.Status503ServiceUnavailable);
            }

            bool signatureValid;
            try
            {
                using var verifier = ECDsa.Create();
                verifier.ImportFromPem(publicKeyPem);
                signatureValid = verifier.VerifyData(queryToVerify, signature, HashAlgorithmName.SHA256, DSASignatureFormat.Rfc3279DerSequence);
            }
            catch (CryptographicException ex)
            {
                _log.LogWarning(ex, "Could not verify AdMob rewarded-ad callback signature");
                return Unauthorized();
            }
            if (!signatureValid)
                return Unauthorized();

            var expectedAdUnits = _cfg.GetSection("AdMob:RewardedAdUnitIds").Get<string[]>() ?? [];
            var adUnit = Request.Query["ad_unit"].ToString();
            if (expectedAdUnits.Length == 0)
            {
                _log.LogError("AdMob:RewardedAdUnitIds is not configured");
                return StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
            if (!expectedAdUnits.Any(configured => configured.EndsWith("/" + adUnit, StringComparison.Ordinal)))
                return Unauthorized();

            var expectedRewardItem = _cfg["AdMob:RewardItem"] ?? "write";
            if (Request.Query["reward_item"] != expectedRewardItem
                || !int.TryParse(Request.Query["reward_amount"], out var rewardAmount)
                || rewardAmount != 1
                || !int.TryParse(Request.Query["user_id"], out var userId)
                || string.IsNullOrWhiteSpace(Request.Query["custom_data"])
                || string.IsNullOrWhiteSpace(Request.Query["transaction_id"]))
                return BadRequest();

            var challengeToken = Request.Query["custom_data"].ToString();
            var transactionId = Request.Query["transaction_id"].ToString();
            var priorReward = await _db.RewardedAdAccesses
                .FirstOrDefaultAsync(access => access.TransactionId == transactionId);
            if (priorReward != null)
                return Ok();

            var challenge = await _db.RewardedAdAccesses
                .FirstOrDefaultAsync(access => access.ChallengeToken == challengeToken
                    && access.UserId == userId
                    && access.TransactionId == null
                    && access.ExpiresAt > DateTime.UtcNow);
            if (challenge == null)
                return Unauthorized();

            challenge.TransactionId = transactionId;
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("status")]
        public async Task<IActionResult> Status([FromQuery] int userId)
        {
            if (Forbidden(userId)) return Deny();
            return Ok(await _svc.GetStatusAsync(userId));
        }

        [HttpPost("access-mode")]
        public async Task<IActionResult> SetAccessMode([FromBody] SetExpiredAccessModeRequest request)
        {
            var sessionToken = Request.Headers["X-Session-Token"].ToString();
            var userIdHeader = Request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrWhiteSpace(sessionToken) || !int.TryParse(userIdHeader, out var userId))
                return Unauthorized(new { code = "NO_SESSION", message = "Not signed in." });

            var storedSessionToken = await _db.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => user.CurrentSessionToken)
                .FirstOrDefaultAsync();
            if (string.IsNullOrWhiteSpace(storedSessionToken)
                || !string.Equals(storedSessionToken, sessionToken, StringComparison.Ordinal))
                return Unauthorized(new { code = "NO_SESSION", message = "Not signed in." });

            var mode = request.Mode?.Trim();
            if (!string.Equals(mode, SubscriptionService.AdsAccessMode, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(mode, SubscriptionService.ReadOnlyAccessMode, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Choose either ads-supported access or ad-free read-only access." });

            try
            {
                return Ok(await _svc.SetExpiredAccessModeAsync(userId,
                    string.Equals(mode, SubscriptionService.AdsAccessMode, StringComparison.OrdinalIgnoreCase)
                        ? SubscriptionService.AdsAccessMode
                        : SubscriptionService.ReadOnlyAccessMode));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "User not found." });
            }
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromQuery] int userId)
        {
            if (Forbidden(userId)) return Deny();
            var st = await _svc.GetStatusAsync(userId);
            if (st.State == "trial") return BadRequest(new { message = "Your free trial is still active." });

            if (string.IsNullOrWhiteSpace(_cfg["Razorpay:KeyId"])
                || string.IsNullOrWhiteSpace(_cfg["Razorpay:KeySecret"]))
            {
                _log.LogError("Cannot create subscription order: Razorpay:KeyId or Razorpay:KeySecret is not configured");
                return StatusCode(503, new { message = "Payment provider is not configured. Please contact support." });
            }

            // Re-use a checkout order that is still payable instead of creating one on every tap.
            var now = DateTime.UtcNow;
            var existing = await _db.SubscriptionPayments
                .Where(x => x.UserId == userId && x.Status == "pending"
                         && x.ProviderOrderId != null && x.ExpiresAt > now.AddMinutes(2))
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();
            if (existing != null) return Ok(OrderDto(existing));

            var orderRef = Guid.NewGuid().ToString("N");
            var expires = DateTime.UtcNow.AddMinutes(15);
            var body = JsonSerializer.Serialize(new
            {
                amount = ExpectedPaise,
                currency = "INR",
                receipt = orderRef,
                partial_payment = false,
                notes = new { orderRef, userId = userId.ToString(), purpose = "monthly_subscription" }
            });

            HttpResponseMessage res; string txt;
            try
            {
                res = await GatewayClient().PostAsync($"{RazorpayApi}/orders", new StringContent(body, Encoding.UTF8, "application/json"));
                txt = await res.Content.ReadAsStringAsync();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                _log.LogError(ex, "Razorpay order create request failed");
                return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." });
            }
            if (!res.IsSuccessStatusCode) { _log.LogError("Razorpay order create failed ({S}): {T}", (int)res.StatusCode, txt); return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." }); }

            using var doc = JsonDocument.Parse(txt);
            var razorpayOrder = doc.RootElement;
            if (!razorpayOrder.TryGetProperty("id", out var providerOrderIdEl)
                || providerOrderIdEl.ValueKind != JsonValueKind.String
                || string.IsNullOrWhiteSpace(providerOrderIdEl.GetString()))
            { _log.LogError("Razorpay order response missing id: {T}", txt); return StatusCode(502, new { message = "Payment service unavailable. Try again shortly." }); }

            var p = new SubscriptionPayment
            {
                UserId = userId, OrderRef = orderRef, ProviderQrId = "",
                ProviderOrderId = providerOrderIdEl.GetString(),
                QrImageUrl = "", Amount = SubscriptionService.Price,
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
            if (!IsValidSubscriptionPayment(v)) { _log.LogInformation("Ignored payment {P} (not a captured INR payment of the plan amount)", paymentId); return Ok(); }

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
            && v.TryGetProperty("currency", out var c) && c.GetString() == "INR";

        // Activate once; the unique index on Subscriptions.ProviderPaymentId is the final guard against duplicates.
        private async Task<bool> ActivateFromPaymentAsync(SubscriptionPayment order, JsonElement pay)
        {
            if (order.Status == "paid") return true;
            if (!IsValidSubscriptionPayment(pay)) return false;
            if (string.IsNullOrEmpty(order.ProviderOrderId)
                && (!pay.TryGetProperty("method", out var method) || method.GetString() != "upi"))
                return false;
            if (!string.IsNullOrEmpty(order.ProviderOrderId)
                && (!pay.TryGetProperty("order_id", out var orderId)
                    || !string.Equals(orderId.GetString(), order.ProviderOrderId, StringComparison.Ordinal)))
                return false;
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
            if (pay.TryGetProperty("order_id", out var orderIdEl)
                && orderIdEl.ValueKind == JsonValueKind.String
                && !string.IsNullOrEmpty(orderIdEl.GetString()))
            {
                var byProviderOrder = await _db.SubscriptionPayments
                    .FirstOrDefaultAsync(x => x.ProviderOrderId == orderIdEl.GetString());
                return byProviderOrder;
            }

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

        // Ask the gateway (server-to-server, with our secret key) for payments against this order or a legacy QR.
        private async Task TryReconcileAsync(SubscriptionPayment order)
        {
            var now = DateTime.UtcNow;
            if (LastGatewayCheck.TryGetValue(order.OrderRef, out var last) && now - last < TimeSpan.FromSeconds(10)) return;
            LastGatewayCheck[order.OrderRef] = now;
            try
            {
                var path = string.IsNullOrEmpty(order.ProviderOrderId)
                    ? $"{RazorpayApi}/payments/qr_codes/{order.ProviderQrId}/payments"
                    : $"{RazorpayApi}/orders/{order.ProviderOrderId}/payments";
                var res = await GatewayClient().GetAsync(path);
                if (!res.IsSuccessStatusCode) { _log.LogWarning("Razorpay payments lookup returned {S} for order {O}", (int)res.StatusCode, order.OrderRef); return; }
                using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("items", out var items)) return;
                foreach (var it in items.EnumerateArray())
                    if (await ActivateFromPaymentAsync(order, it)) break;
            }
            catch (Exception ex) { _log.LogWarning(ex, "Gateway reconcile failed for order {O}", order.OrderRef); }
        }
    }

    public sealed class SetExpiredAccessModeRequest
    {
        public string? Mode { get; set; }
    }

    public sealed class DevelopmentTestRewardRequest
    {
        public string ChallengeToken { get; set; } = "";
        public int RewardAmount { get; set; }
        public string RewardItem { get; set; } = "";
    }

    // Keep expired accounts read-only while ads are disabled; the existing rewarded-ad
    // write-credit and interstitial flow remains available for a future rollout.
    // The app authenticates API requests with its current-session headers rather than claims.
    public class SubscriptionRequiredFilter : IAsyncActionFilter
    {
        private readonly ApplicationDbContext _db;
        private readonly SubscriptionService _svc;
        public SubscriptionRequiredFilter(ApplicationDbContext db, SubscriptionService svc)
        {
            _db = db;
            _svc = svc;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext ctx, ActionExecutionDelegate next)
        {
            var ctrl = ctx.RouteData.Values["controller"]?.ToString();
            var action = ctx.RouteData.Values["action"]?.ToString();
            if (ctrl == "Subscription"
                || (ctrl == "Auth" && action is "SendOtp" or "Register" or "Login" or "SessionCheck"))
            {
                await next();
                return;
            }

            var request = ctx.HttpContext.Request;
            var sessionToken = request.Headers["X-Session-Token"].ToString();
            var userIdHeader = request.Headers["X-User-Id"].ToString();
            if (string.IsNullOrWhiteSpace(sessionToken)
                || !int.TryParse(userIdHeader, out var userId))
            {
                ctx.Result = new UnauthorizedObjectResult(new { code = "NO_SESSION", message = "Not signed in." });
                return;
            }

            var storedSessionToken = await _db.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => user.CurrentSessionToken)
                .FirstOrDefaultAsync();
            if (string.IsNullOrWhiteSpace(storedSessionToken)
                || !string.Equals(storedSessionToken, sessionToken, StringComparison.Ordinal))
            {
                ctx.Result = new UnauthorizedObjectResult(new { code = "NO_SESSION", message = "Not signed in." });
                return;
            }

            var status = await _svc.GetStatusAsync(userId);
            if (!status.AccessAllowed)
            {
                ctx.Result = new ObjectResult(new { code = "SUBSCRIPTION_REQUIRED", message = "Your subscription is required to access this feature. Subscribe to continue." }) { StatusCode = 402 };
                return;
            }

            if (status.State == "expired" && !HttpMethods.IsGet(request.Method))
            {
                if (!SubscriptionService.AdsEnabled)
                {
                    ctx.Result = new ObjectResult(new
                    {
                        code = "SUBSCRIPTION_REQUIRED",
                        message = "Your free trial has ended. Subscribe to continue making changes."
                    }) { StatusCode = StatusCodes.Status402PaymentRequired };
                    return;
                }

                var credit = await _svc.ConsumeRewardedWriteCreditAsync(userId);
                if (credit == null)
                {
                    ctx.Result = new ObjectResult(new { code = "REWARDED_AD_REQUIRED", message = "Watch an ad or subscribe to make changes." })
                    { StatusCode = StatusCodes.Status403Forbidden };
                    return;
                }

                var executed = await next();
                var statusCode = executed.Result switch
                {
                    ObjectResult result => result.StatusCode ?? StatusCodes.Status200OK,
                    StatusCodeResult result => result.StatusCode,
                    _ => StatusCodes.Status200OK,
                };
                if (statusCode >= StatusCodes.Status400BadRequest
                    || (executed.Exception != null && !executed.ExceptionHandled))
                {
                    await _svc.ReleaseRewardedWriteCreditAsync(credit.RewardedAdAccessId);
                    return;
                }

                if (statusCode >= StatusCodes.Status200OK && statusCode < StatusCodes.Status300MultipleChoices
                    && await _svc.RecordExpiredWriteActionAsync(userId))
                    ctx.HttpContext.Response.Headers["X-Ad-Interstitial-Due"] = "true";
                return;
            }

            await next();
        }
    }
}
