using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LMPTS.Infrastructure.Sms
{
    /// <summary>
    /// Sends OTP SMS via MSG91's Flow API (https://control.msg91.com/api/v5/flow).
    /// This sends a DLT-approved template with our own OTP value substituted in -
    /// NOT MSG91's own OTP-generation service - since AuthController already
    /// generates and stores the OTP itself.
    ///
    /// ⚠️ Verify the exact request shape (especially the template variable name,
    /// e.g. "OTP" or "var1" depending on how your Flow/template was created on
    /// the MSG91 dashboard) against your own Flow's configuration before relying
    /// on this in production - MSG91's dashboard shows the exact payload for
    /// your specific Flow ID under Flow > API tab.
    /// </summary>
    public class Msg91SmsService : ISmsService
    {
        private readonly HttpClient _httpClient;
        private readonly Msg91Settings _settings;
        private readonly ILogger<Msg91SmsService> _logger;

        private const string FlowApiUrl = "https://control.msg91.com/api/v5/flow";

        public Msg91SmsService(HttpClient httpClient, IOptions<Msg91Settings> settings, ILogger<Msg91SmsService> logger)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<bool> SendOtpAsync(string mobileNumber, string otpCode)
        {
            if (string.IsNullOrWhiteSpace(_settings.AuthKey) ||
                string.IsNullOrWhiteSpace(_settings.SenderId) ||
                string.IsNullOrWhiteSpace(_settings.FlowId))
            {
                _logger.LogError("MSG91 settings are not configured (AuthKey/SenderId/FlowId missing).");
                return false;
            }

            // MSG91 expects the number with country code, no '+', e.g. 919999999999
            var fullMobile = mobileNumber.StartsWith("91") ? mobileNumber : $"91{mobileNumber}";

            var payload = new
            {
                template_id = _settings.FlowId,
                short_url = "0",
                recipients = new[]
                {
                    new Dictionary<string, string>
                    {
                        { "mobiles", fullMobile },
                        { "OTP", otpCode } // ⚠️ must match your template's variable name exactly
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, FlowApiUrl)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("authkey", _settings.AuthKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            try
            {
                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("MSG91 OTP SMS accepted for {Mobile}. Response: {Response}", fullMobile, responseBody);
                    return true;
                }

                _logger.LogError("MSG91 OTP SMS failed for {Mobile}. Status: {Status}. Response: {Response}",
                    fullMobile, response.StatusCode, responseBody);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while calling MSG91 API for {Mobile}", fullMobile);
                return false;
            }
        }
    }
}
