// ===== Login / Registration (OTP) screen =====
// Shown whenever nobody is signed in. Owns all of the login-form state; everything shared with the
// rest of the app (signed-in user, language, popups ...) comes from the AppShell context.

import { API_BASE_URL, DEV_SKIP_LOGIN, SESSION_TOKEN_KEY } from '../shared/constants';
import { AppPopup } from '../shared/components';
import { Capacitor } from '@capacitor/core';
import { FiArrowRight, FiChevronDown, FiFileText, FiPhone, FiUser } from 'react-icons/fi';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineWallet } from 'react-icons/hi2';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { RecaptchaVerifier, signInWithPhoneNumber as firebaseSignInWithPhoneNumber, getAuth } from 'firebase/auth';
import { authStyles } from './styles';
import { fetchWithTimeout } from '../shared/http';
import { isValidMobileNumber } from '../shared/validators';
import smartpayLogo from '../assets/icon.png';
import { useAppShell } from '../app/AppShellContext';
import { useEffect, useRef, useState } from 'react';

export default function LoginScreen() {
  const {
    appPopup,
    closeAppPopup,
    loading,
    persistedUser,
    setIsUserAuthenticated,
    setLoading,
    setLoggedInUser,
    setProfileImg,
    setUserName,
    showAlert,
    showSuccess,
  } = useAppShell();


  const [isLoginView, setIsLoginView] = useState(!DEV_SKIP_LOGIN && !persistedUser);


  const [fullName, setFullName] = useState('');

  const [mobileNumber, setMobileNumber] = useState('');

  const [otp, setOtp] = useState('');

  const [firebaseVerificationId, setFirebaseVerificationId] = useState(null);

  const [industry, setIndustry] = useState('General');

  const [activePage, setActivePage] = useState('dashboard');

  const [otpSent, setOtpSent] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);


  // UI-only state for the 6-box OTP input & resend countdown (does not change auth logic)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const otpInputRefs = useRef([]);

  const [resendSeconds, setResendSeconds] = useState(0);


  // Android Firebase Phone Auth can auto-verify the SMS (instant verification / SMS auto-retrieval)
  // when the SIM is in the same phone that runs the app. Firebase then signs the user in and the
  // verification session is consumed - typing the same code afterwards fails with "sms code has
  // expired". These refs let us finish the login from the auto-verified session instead.
  //  - submitRef:     always points at the latest submitToBackend (native listeners are registered
  //                   once, so they must not capture stale state)
  //  - submittingRef: guards against double submission (auto-verify event + manual tap)
  const submitRef = useRef(null);

  const submittingRef = useRef(false);

  const mobileNumberRef = useRef('');

  mobileNumberRef.current = mobileNumber;


  // ✅ Azure SQL Serverless auto-pauses after inactivity, so the very first request
  // of the day can take 30-60s to "wake up" the DB instead of failing instantly.
  // The backend already retries through this (see Program.cs EnableRetryOnFailure),
  // but a bare spinner for that long makes users think the app has frozen. If a
  // send-otp/login/register call is still in flight after a few seconds, switch the
  // plain "Sending OTP.../Verifying..." label to an explanatory message instead.
  const [showWakingMessage, setShowWakingMessage] = useState(false);

  useEffect(() => {
    if (!sendingOtp && !loading) {
      setShowWakingMessage(false);
      return;
    }
    const wakingTimer = setTimeout(() => setShowWakingMessage(true), 4000);
    return () => clearTimeout(wakingTimer);
  }, [sendingOtp, loading]);


  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setOtp('');
    setOtpSent(false);
    setFullName('');
    setIndustry('General');
    setOtpDigits(['', '', '', '', '', '']);
    setResendSeconds(0);
  };


  const isRegistrationFormValid = () => fullName.trim() !== '' && isValidMobileNumber(mobileNumber);


  // Firebase phone-auth listeners: 'phoneCodeSent' fires once the SMS is dispatched and
  // gives us the verificationId we need later to confirm the code the user types in.
  // NOTE: these native-plugin listeners only fire on Android/iOS. On web we handle the
  // send/confirm flow directly with the Firebase JS SDK below (see handleSendOtp / handleSubmit).
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;
    const codeSentListener = FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      setFirebaseVerificationId(event.verificationId);
      setOtpSent(true);
      setSendingOtp(false);
    });
    const verificationFailedListener = FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
      showAlert(event?.message || 'Could not send verification code. Please try again.');
      setSendingOtp(false);
    });
    // Fires on Android when Firebase verified the number automatically (instant verification or
    // SMS auto-retrieval). The user is already signed in natively at this point, so there is no
    // code left to type - complete the login straight away.
    const verificationCompletedListener = FirebaseAuthentication.addListener('phoneVerificationCompleted', () => {
      setSendingOtp(false);
      setOtpSent(true);
      completeLoginFromFirebaseSession();
    });
    return () => {
      codeSentListener.then((l) => l.remove());
      verificationFailedListener.then((l) => l.remove());
      verificationCompletedListener.then((l) => l.remove());
    };
  }, []);


  // Returns an ID token if Firebase already has a signed-in user for the number being logged in
  // (native only). This is the auto-verified case. Returns null otherwise.
  const getAutoVerifiedIdToken = async () => {
    try {
      const { user } = await FirebaseAuthentication.getCurrentUser();
      if (user && user.phoneNumber === `+91${mobileNumberRef.current.trim()}`) {
        const idToken = (await FirebaseAuthentication.getIdToken({ forceRefresh: true }))?.token;
        return idToken || null;
      }
    } catch (err) {
      console.warn('getAutoVerifiedIdToken failed:', err);
    }
    return null;
  };


  // Finishes login/registration using the already-verified native Firebase session.
  const completeLoginFromFirebaseSession = async () => {
    if (submittingRef.current) return;
    try {
      const idToken = await getAutoVerifiedIdToken();
      if (idToken) {
        await submitRef.current?.(idToken);
      } else {
        showAlert('Could not complete automatic verification. Please enter the code manually or tap Resend.');
      }
    } catch (err) {
      console.error('Auto-verification login failed:', err);
      showAlert(err?.message || 'Automatic verification failed. Please try again.');
    }
  };


  // Registration-status ("already registered" / "not registered") is now enforced
  // by the backend's register/login endpoints themselves after OTP verification,
  // rather than via a separate pre-check call before sending the OTP.
  const handleSendOtp = async () => {
    if (!isLoginView && !isRegistrationFormValid()) { showAlert('Please fill all registration details accurately.'); return; }
    if (!mobileNumber || !isValidMobileNumber(mobileNumber)) { showAlert('Please enter a valid 10-digit mobile number.'); return; }
    setSendingOtp(true);
    try {
      if (Capacitor.getPlatform() === 'web') {
        // @capacitor-firebase/authentication's signInWithPhoneNumber only supports
        // Android/iOS - on web we talk to the Firebase JS SDK directly instead.
        const auth = getAuth();
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          });
        }
        const confirmationResult = await firebaseSignInWithPhoneNumber(
          auth,
          `+91${mobileNumber}`,
          window.recaptchaVerifier,
        );
        window.confirmationResult = confirmationResult;
        setOtpSent(true);
        setSendingOtp(false);
      } else {
        // Clear any leftover native Firebase session first, so a stale or auto-verified session
        // from an earlier attempt can never be mistaken for the one we are about to create.
        try { await FirebaseAuthentication.signOut(); } catch { /* nothing to sign out */ }
        setFirebaseVerificationId(null);
        submittingRef.current = false;

        const sendResult = await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: `+91${mobileNumber}` });
        // otpSent / firebaseVerificationId are normally set by the 'phoneCodeSent' listener above.
        // On Android, if Firebase auto-verified the number, the call resolves with the signed-in
        // user (and/or 'phoneVerificationCompleted' fires) - in that case finish the login now.
        if (sendResult?.user) {
          setSendingOtp(false);
          setOtpSent(true);
          completeLoginFromFirebaseSession();
        }
      }
    } catch (error) {
      console.error('Firebase OTP Error:', error);
      showAlert(error?.message || 'Could not send verification code. Please try again.');
      setSendingOtp(false);
      // Reset the verifier on failure so a retry gets a fresh challenge.
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };


  // Sends the verified Firebase ID token to our backend and applies the login / registration result.
  // Shared by manual OTP entry (handleSubmit) and Firebase auto-verification.
  const submitToBackend = async (idToken) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const endpoint = isLoginView ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
      const payload = isLoginView
        ? { mobileNumber: mobileNumber.trim(), idToken }
        : { mobileNumber: mobileNumber.trim(), idToken, fullName, industry };

      const response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const responseText = await response.text();
      let data = {};
      if (responseText) { try { data = JSON.parse(responseText); } catch { data = { message: responseText }; } }
      if (response.ok) {
        if (isLoginView) {
          localStorage.setItem('workforce_soft_token', 'true');
          if (data.sessionToken) localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
          const sessionUser = { 
            userId: data.userId, 
            fullName: data.fullName, 
            industry: data.industry || industry,
            profileImg: data.profileImage || null
          };
          localStorage.setItem('workforce_user', JSON.stringify(sessionUser));
          setLoggedInUser(sessionUser);
          setUserName(sessionUser.fullName || '');
          setProfileImg(sessionUser.profileImg);
          setIsUserAuthenticated(true);
          setActivePage('dashboard');
          // (Projects are loaded by the attendance module as soon as the user is signed in.)
        } else {
          showSuccess(data.message || 'Registration completed successfully! Proceeding to login view.');
          setIsLoginView(true);
          setOtp('');
          setOtpSent(false);
          setFirebaseVerificationId(null);
          window.confirmationResult = null;
        }
      } else { showAlert(data.message || 'Validation failed down at backend services.'); }
    } catch (error) {
      console.error('Backend submit error:', error);
      showAlert(error?.message || 'Something went wrong. Please try again.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // Keep the ref pointing at the latest closure (isLoginView, mobileNumber, fullName... may change).
  submitRef.current = submitToBackend;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // login already in progress (e.g. auto-verification)
    const isWeb = Capacitor.getPlatform() === 'web';

    // Native: if Firebase already auto-verified this number, the SMS code is spent - do NOT try to
    // confirm it again (that is what produced "The sms code has expired"). Use the live session.
    if (!isWeb) {
      const autoToken = await getAutoVerifiedIdToken();
      if (autoToken) { await submitToBackend(autoToken); return; }
    }

    if (!otpSent || (isWeb ? !window.confirmationResult : !firebaseVerificationId)) {
      showAlert('Please generate and input your verification OTP first.');
      return;
    }
    if (!otp || otp.length < 6) {
      showAlert('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    let idToken;
    try {
      // 1. Confirm the code with Firebase - this is what actually verifies the phone number.
      if (isWeb) {
        const result = await window.confirmationResult.confirm(otp);
        if (!result?.user) { throw new Error('Verification did not return a signed-in user.'); }
        idToken = await result.user.getIdToken();
      } else {
        const confirmResult = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: firebaseVerificationId,
          verificationCode: otp,
        });
        if (!confirmResult?.user) { throw new Error('Verification did not return a signed-in user.'); }
        idToken = (await FirebaseAuthentication.getIdToken())?.token;
      }
    } catch (error) {
      // Safety net: the code may have been consumed by auto-verification a moment ago (race with
      // the 'phoneVerificationCompleted' event). If a verified session exists for this number, use it.
      if (!isWeb) {
        const fallbackToken = await getAutoVerifiedIdToken();
        if (fallbackToken) { setLoading(false); await submitToBackend(fallbackToken); return; }
      }
      console.error('Verification Error:', error);
      const code = String(error?.code || error?.message || '');
      if (/code-expired|session-expired|expired/i.test(code)) {
        showAlert('This verification code has expired. Please tap Resend to get a new code.');
        setOtpDigits(['', '', '', '', '', '']);
      } else if (/invalid-verification-code|invalid/i.test(code)) {
        showAlert('The code you entered is incorrect. Please check and try again.');
      } else {
        showAlert(error?.message || 'Invalid or expired OTP. Please try again.');
      }
      setLoading(false);
      return;
    }
    setLoading(false);

    if (!idToken) { showAlert('Could not obtain a verified session from Firebase. Please try again.'); return; }

    // 2. Send the verified Firebase ID token to our backend instead of a raw OTP code.
    await submitToBackend(idToken);
  };


  // Keep the 6 OTP boxes in sync with the existing `otp` string used by handleSubmit
  useEffect(() => {
    setOtp(otpDigits.join(''));
  }, [otpDigits]);


  // Resend countdown ticker (UI-only)
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);


  // Thin UI wrapper: calls the existing, unchanged handleSendOtp for both the initial
  // send and the resend action, then resets the boxes / starts the 30s countdown.
  const handleOtpButtonClick = async () => {
    setOtpDigits(['', '', '', '', '', '']);
    await handleSendOtp();
    setResendSeconds(30);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
  };


  // Lets the user go back and correct the mobile number if the OTP was sent to a wrong/mistyped
  // number - without this they'd be stuck staring at an uneditable field waiting for an OTP
  // that will never arrive at their own phone.
  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setFirebaseVerificationId(null);
    window.confirmationResult = null;
    setResendSeconds(0);
    submittingRef.current = false;
    if (Capacitor.getPlatform() !== 'web') {
      FirebaseAuthentication.signOut().catch(() => {});
    }
  };

const otpButtonDisabled = sendingOtp || !isValidMobileNumber(mobileNumber) || (!isLoginView && !isRegistrationFormValid());
  const canVerify = otpSent && otp.length === 6 && !loading;

  return (
    <div style={authStyles.page}>
      {/* ---- App version (hardcoded; update manually on each release) ---- */}
      <span style={authStyles.versionBadge}>Version 1.0</span>

      <div style={authStyles.pageInner}>

        {/* ---- Branding (sits on the page background, above the card) ---- */}
        <div style={authStyles.brandBlock}>
          <img src={smartpayLogo} alt="SmartManage" style={authStyles.logoImg} />
          <h1 style={authStyles.brandName}>SmartManage</h1>
          <p style={authStyles.brandTagline}>Quote. Track Wages. Pay on Time.</p>
        </div>

        {/* ---- Card ---- */}
        <div style={authStyles.card}>
          <div style={authStyles.welcomeBlock}>
            <h2 style={authStyles.welcomeTitle}>Welcome</h2>
            <p style={authStyles.welcomeSubtitle}>Login to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={authStyles.form}>

            {/* ---- Name (mandatory only for new users / register view) ---- */}
            {!isLoginView && (
              <div style={authStyles.fieldGroup}>
                <label style={authStyles.fieldLabel}>Name <span style={authStyles.requiredMark}>*</span></label>
                <div style={authStyles.inputShell}>
                  <span style={authStyles.inputIcon}><FiUser size={18} color="#2563EB" /></span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    style={authStyles.inputField}
                  />
                </div>
              </div>
            )}

            {/* ---- Mobile Number ---- */}
            <div style={authStyles.fieldGroup}>
              <label style={authStyles.fieldLabel}>Mobile Number <span style={authStyles.requiredMark}>*</span></label>
              <div style={authStyles.inputShell}>
                <span style={authStyles.inputIcon}><FiPhone size={18} color="#2563EB" /></span>
                <span style={authStyles.countryCode}>+91 <FiChevronDown size={14} color="#94A3B8" /></span>
                <span style={authStyles.inputDivider} />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  disabled={otpSent}
                  onChange={(e) => { const cleanDigits = e.target.value.replace(/\D/g, ''); setMobileNumber(cleanDigits.slice(0, 10)); }}
                  style={{ ...authStyles.inputField, opacity: otpSent ? 0.6 : 1 }}
                />
              </div>
            </div>

            {/* ---- OTP info card (always visible once the form is in play) ---- */}
            <div style={authStyles.otpInfoCard}>
              <span style={authStyles.otpInfoIcon}><HiOutlineShieldCheck size={22} color="#2563EB" /></span>
              <p style={authStyles.otpInfoText}>Enter the OTP sent to your mobile</p>
            </div>

            {/* ---- Slow-request notice: shown once a send-otp/verify call has been ---- */}
            {/* running for a few seconds, most likely an Azure SQL Serverless cold start ---- */}
            {showWakingMessage && (
              <div style={authStyles.otpInfoCard}>
                <span style={authStyles.otpInfoIcon}><HiOutlineShieldCheck size={22} color="#B45309" /></span>
                <p style={authStyles.otpInfoText}>Connecting to server, this can take up to a minute on first use today. Please hold on...</p>
              </div>
            )}

            {/* ---- Invisible reCAPTCHA container (required for web phone-auth) ---- */}
            <div id="recaptcha-container"></div>

            {/* ---- Send OTP button (only before the first send) ---- */}
            {!otpSent && (
              <button
                type="button"
                onClick={handleOtpButtonClick}
                disabled={otpButtonDisabled}
                style={{ ...authStyles.sendOtpBtn, opacity: otpButtonDisabled ? 0.45 : 1 }}
              >
                {sendingOtp ? (showWakingMessage ? 'Waking up server...' : 'Sending OTP...') : 'Send OTP'}
              </button>
            )}

            {/* ---- 6-box OTP entry ---- */}
            {otpSent && (
              <div style={authStyles.fieldGroup}>
                <div style={authStyles.otpHeaderRow}>
                  <label style={authStyles.fieldLabel}>Enter OTP <span style={authStyles.requiredMark}>*</span></label>
                  {resendSeconds > 0 ? (
                    <span style={authStyles.resendTimerText}>Resend OTP in <b style={authStyles.resendTimerBold}>00:{String(resendSeconds).padStart(2, '0')}</b></span>
                  ) : (
                    <button type="button" onClick={handleOtpButtonClick} disabled={sendingOtp} style={authStyles.resendLinkBtn}>
                      {sendingOtp ? 'Resending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    OTP sent to <b style={{ color: '#D97706' }}>+91 {mobileNumber}</b>.{' '}
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#0B3C9B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Wrong number? Change it
                    </button>
                  </span>
                </div>
                <div style={authStyles.otpBoxRow}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpInputRefs.current[i] = el)}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        setOtpDigits((prev) => {
                          const next = [...prev];
                          next[i] = val;
                          return next;
                        });
                        if (val && i < 5) otpInputRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                          otpInputRefs.current[i - 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (!pasted) return;
                        const next = ['', '', '', '', '', ''];
                        pasted.split('').forEach((d, idx) => { next[idx] = d; });
                        setOtpDigits(next);
                        otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
                      }}
                      style={{ ...authStyles.otpBox, ...(digit ? authStyles.otpBoxFilled : {}) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Primary CTA ---- */}
            <button type="submit" disabled={!canVerify} style={{ ...authStyles.primaryCta, opacity: canVerify ? 1 : 0.5 }}>
              <span>{loading ? (showWakingMessage ? 'Waking up server...' : 'Verifying...') : 'Verify & Continue'}</span>
              {!loading && <FiArrowRight size={19} color="#ffffff" />}
            </button>

            <p style={authStyles.switchViewText}>
              {isLoginView ? "Don't have an account yet?" : 'Already registered on SmartManage?'}
              <style>{'@keyframes registerHereBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }'}</style>
              <button type="button" onClick={toggleView} style={{ ...authStyles.toggleLink, color: isLoginView ? '#DC2626' : '#0B3C9B', textDecoration: 'underline', animation: isLoginView ? 'registerHereBlink 1.2s ease-in-out infinite' : 'none' }}>{isLoginView ? 'Register here' : 'Login here'}</button>
            </p>
          </form>
        </div>

        {/* ---- Bottom feature highlights (informational only) - hidden once the form ---- */}
        {/* grows taller (register view or OTP entry) so the page always fits one screen ---- */}
        {isLoginView && !otpSent && (
        <div style={authStyles.featureRow}>
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineUserGroup size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Employees</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineCalendar size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Attendance</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><HiOutlineWallet size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Payments</span>
          </div>
          <span style={authStyles.featureDivider} />
          <div style={authStyles.featureItem}>
            <span style={authStyles.featureIconWrap}><FiFileText size={20} color="#2563EB" /></span>
            <span style={authStyles.featureLabel}>Quotation</span>
          </div>
        </div>
        )}
      </div>

      {/* ============ COMMON POPUP (replaces every window.alert / window.confirm) ============ */}
      <AppPopup
        open={!!appPopup?.open}
        tone={appPopup?.tone}
        title={appPopup?.title}
        message={appPopup?.message}
        confirmLabel={appPopup?.confirmLabel}
        cancelLabel={appPopup?.cancelLabel}
        onConfirm={appPopup?.onConfirm || closeAppPopup}
        onCancel={closeAppPopup}
        onClose={closeAppPopup}
      />
    </div>
  );
}
