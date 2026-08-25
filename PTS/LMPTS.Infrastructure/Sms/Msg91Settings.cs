namespace LMPTS.Infrastructure.Sms
{
    /// <summary>
    /// Bound from configuration section "Msg91". Set real values as
    /// Azure App Service Application Settings (never commit real keys):
    ///   Msg91__AuthKey, Msg91__SenderId, Msg91__FlowId
    /// </summary>
    public class Msg91Settings
    {
        public string AuthKey { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string FlowId { get; set; } = string.Empty; // DLT-approved template/flow ID
    }
}
