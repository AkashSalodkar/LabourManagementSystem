namespace LMPTS.Infrastructure.Sms
{
    public interface ISmsService
    {
        /// <summary>
        /// Sends an OTP SMS to the given 10-digit Indian mobile number.
        /// Returns true if the SMS provider accepted the request for delivery
        /// (does not guarantee actual delivery to the handset).
        /// </summary>
        Task<bool> SendOtpAsync(string mobileNumber, string otpCode);
    }
}
