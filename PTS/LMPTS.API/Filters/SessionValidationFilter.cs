using LMPTS.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace LMPTS.API.Filters
{
    /// <summary>
    /// Enforces single-device login by comparing the "X-Session-Token" the client
    /// sent against User.CurrentSessionToken in the DB. A mismatch means another
    /// device has since logged in with the same account; every subsequent request
    /// from this device is rejected with HTTP 401 + code SESSION_REPLACED, which
    /// the frontend already handles by clearing localStorage and reloading to the
    /// login screen.
    ///
    /// Policy on missing headers: requests WITHOUT X-Session-Token / X-User-Id are
    /// let through (so login / register / send-otp, the Razorpay webhook, health
    /// checks, and pre-login screens keep working). The feature is strictly a
    /// *logout other devices* mechanism, not a replacement for real auth - the
    /// existing "userId passed as query param" pattern is left untouched.
    /// </summary>
    public class SessionValidationFilter : IAsyncActionFilter
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SessionValidationFilter> _logger;

        // Endpoints that must never be blocked by session validation:
        //   - Auth.SendOtp / Auth.Register / Auth.Login  → user not signed in yet
        //   - Subscription.Webhook                       → called by Razorpay, no token
        // (Auth.SessionCheck is intentionally NOT skipped - see the endpoint's XML
        //  doc-comment for why the filter is the primary validator for it too.)
        private static readonly HashSet<string> SkipEndpoints = new(StringComparer.OrdinalIgnoreCase)
        {
            "Auth.SendOtp",
            "Auth.Register",
            "Auth.Login",
            "Subscription.Webhook",
        };

        public SessionValidationFilter(ApplicationDbContext context, ILogger<SessionValidationFilter> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var http = context.HttpContext;

            var controller = context.RouteData.Values["controller"]?.ToString() ?? "";
            var action = context.RouteData.Values["action"]?.ToString() ?? "";
            if (SkipEndpoints.Contains($"{controller}.{action}"))
            {
                await next();
                return;
            }

            var sessionToken = http.Request.Headers["X-Session-Token"].ToString();
            var userIdHeader = http.Request.Headers["X-User-Id"].ToString();

            // Both headers must be present for validation; if either is missing,
            // there's no active session on this request to enforce.
            if (string.IsNullOrWhiteSpace(sessionToken) || string.IsNullOrWhiteSpace(userIdHeader))
            {
                await next();
                return;
            }

            if (!int.TryParse(userIdHeader, out var userId))
            {
                await next();
                return;
            }

            var stored = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.CurrentSessionToken)
                .FirstOrDefaultAsync();

            // User row missing: let the endpoint's own not-found handling take over.
            // User with no stored token yet (legacy account from before this feature):
            // let them in so the deploy doesn't force every existing user to log out.
            // The next time they log in they'll get a token and single-device
            // enforcement kicks in for them too.
            if (stored == null || string.IsNullOrEmpty(stored))
            {
                await next();
                return;
            }

            if (!string.Equals(stored, sessionToken, StringComparison.Ordinal))
            {
                _logger.LogInformation(
                    "Rejecting stale-session request: user {UserId} controller {Controller} action {Action}",
                    userId, controller, action);

                context.Result = new ObjectResult(new
                {
                    code = "SESSION_REPLACED",
                    message = "You were signed out because your account was logged in on another device."
                })
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };
                return;
            }

            await next();
        }
    }
}