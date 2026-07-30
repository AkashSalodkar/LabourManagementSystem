import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import OtpInput from './OtpInput';
import { themeStyles } from '../../styles/theme';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [industry, setIndustry] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegistrationFormValid = () => {
    return industry.trim() !== '' && fullName.trim() !== '' && mobileNumber.length === 10;
  };

  const handleSendOtp = async () => {
    if (!isLoginView && !isRegistrationFormValid()) {
      alert('Please fill all registration details accurately.');
      return;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setSendingOtp(true);
    try {
      const response = await authService.sendOtp(mobileNumber, industry);
      setOtpSent(true);
      alert(response.message || `OTP verification code dispatched to +91 ${mobileNumber}`);
    } catch (error) {
      console.error('Network Error:', error);
      alert('Could not establish contact with backend services.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      alert('Please generate and input your verification OTP first.');
      return;
    }
    
    setLoading(true);
    try {
      let response;
      // In the handleSubmit function, when login succeeds:
        if (isLoginView) {
          const userData = {
            userId: response.userId,
            fullName: response.fullName,
            mobileNumber: response.mobileNumber,
            industry: response.industry || industry,
            role: response.role || 'Supervisor',
            isVerified: response.isVerified || true,
          };
          login(userData);
        } else {
          response = await authService.register(mobileNumber, otp, fullName, industry);
        }
        
      if (response) {
        if (isLoginView) {
          const userData = {
            userId: response.userId,
            fullName: response.fullName,
            industry: response.industry || industry,
          };
          login(userData);
        } else {
          alert(response.message || 'Registration completed successfully! Proceeding to login view.');
          setIsLoginView(true);
          setOtp('');
          setOtpSent(false);
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      alert(error.message || 'Connection error occurred while processing server tasks.');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setOtp('');
    setOtpSent(false);
    setFullName('');
    setIndustry('');
  };

  return (
    <div style={themeStyles.container}>
      <div style={themeStyles.topBrandSection}>
        <div style={themeStyles.logoBox}>₹</div>
        <div>
          <h1 style={themeStyles.mainHeading}>Track wages.<br />Pay on time.</h1>
        </div>
        <div>
          <p style={themeStyles.subText}>
            Attendance, overtime, advances & payouts for every worksite — in one simple app.
          </p>
        </div>
        <div style={themeStyles.badgeRow}>
          <div style={themeStyles.badgeItem}>
            <span>🔒</span> Bank-grade OTP
          </div>
        </div>
      </div>
      
      <div style={themeStyles.formSheetModal}>
        <h2 style={themeStyles.formTitle}>
          {isLoginView ? 'Login to continue' : 'Create Employer Profile'}
        </h2>
        <p style={themeStyles.formSubTitle}>
          Enter your details — we'll send a 6-digit OTP to verify
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <>
              <div style={themeStyles.inputGroup}>
                <label style={themeStyles.fieldLabel}>Your name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  style={themeStyles.textInput}
                />
              </div>
              <div style={themeStyles.inputGroup}>
                <label style={themeStyles.fieldLabel}>Select Industry Segment *</label>
                <select
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={themeStyles.textInput}
                >
                  <option value="">Select your Industry Segment</option>
                  <option value="Construction & Real Estate">Construction & Real Estate</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Retail & Commerce">Retail & Commerce</option>
                  <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                </select>
              </div>
            </>
          )}
          
          <div style={themeStyles.inputGroup}>
            <label style={themeStyles.fieldLabel}>MOBILE NUMBER</label>
            <div style={themeStyles.phoneInputContainer}>
              <span style={themeStyles.countryCode}>+91</span>
              <input
                type="tel"
                placeholder="Enter your Mobile number.."
                value={mobileNumber}
                onChange={(e) => {
                  const cleanDigits = e.target.value.replace(/\D/g, '');
                  setMobileNumber(cleanDigits.slice(0, 10));
                }}
                style={themeStyles.phoneField}
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || mobileNumber.length !== 10 || (!isLoginView && !isRegistrationFormValid())}
            style={{
              ...themeStyles.secondaryBtn,
              opacity: (sendingOtp || mobileNumber.length !== 10 || (!isLoginView && !isRegistrationFormValid())) ? 0.4 : 1,
            }}
          >
            {sendingOtp ? 'Generating Token...' : otpSent ? '🔄 Resend Verification Code' : 'Send OTP →'}
          </button>
          
          <div style={{ ...themeStyles.inputGroup, marginTop: '20px' }}>
            <label style={themeStyles.fieldLabel}>Verification OTP *</label>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={!otpSent}
              placeholder={otpSent ? 'Enter 6-digit code' : 'Unlock by requesting OTP'}
            />
            {!otpSent && (
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                Please request OTP first
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!otpSent || otp.length !== 6 || loading}
            style={{
              ...themeStyles.primaryBtn,
              opacity: (!otpSent || otp.length !== 6 || loading) ? 0.4 : 1,
            }}
          >
            {loading ? 'Processing Context...' : isLoginView ? 'Confirm & Secure Login' : 'Complete Platform Registration'}
          </button>
          
          <p style={themeStyles.switchViewText}>
            {isLoginView ? "Don't have an employer account yet?" : 'Already registered corporate manager?'}
            <button type="button" onClick={toggleView} style={themeStyles.toggleLink}>
              {isLoginView ? 'Register Corporate Hub Here' : 'Go to Gateway Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;