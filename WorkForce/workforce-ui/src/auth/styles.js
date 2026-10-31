export const authStyles = {
  page: {
    position: 'relative',
    width: '100%', minHeight: '100vh', boxSizing: 'border-box',
    backgroundColor: '#EDF1FC',
    display: 'flex', justifyContent: 'center',
    padding: '18px 18px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
  },
  pageInner: { width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  versionBadge: {
    position: 'absolute', top: '10px', right: '14px',
    fontSize: '11px', fontWeight: '500', color: '#94A3B8',
    letterSpacing: '0.01em', userSelect: 'none', zIndex: 1,
  },

  brandBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginBottom: '12px' },
  logoImg: { width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' },
  brandName: { margin: '6px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#2554EB', letterSpacing: '-0.02em' },
  brandTagline: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '500' },

  card: {
    width: '100%', backgroundColor: '#ffffff',
    borderRadius: '24px', padding: '20px 20px', boxSizing: 'border-box',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.07), 0 2px 8px rgba(15, 23, 42, 0.04)',
    display: 'flex', flexDirection: 'column',
  },

  welcomeBlock: { textAlign: 'center', marginBottom: '14px' },
  welcomeTitle: { margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#0F172A' },
  welcomeSubtitle: { margin: 0, fontSize: '13px', color: '#64748B' },

  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldGroup: { display: 'flex', flexDirection: 'column' },
  fieldLabel: { fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '6px' },
  requiredMark: { color: '#EF4444' },

  inputShell: {
    display: 'flex', alignItems: 'center', gap: '10px',
    border: '1.5px solid #E2E8F0', borderRadius: '14px',
    padding: '0 14px', backgroundColor: '#ffffff', height: '46px',
    boxSizing: 'border-box',
  },
  inputIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  countryCode: { display: 'flex', alignItems: 'center', gap: '3px', fontSize: '15px', fontWeight: '700', color: '#334155', flexShrink: 0 },
  inputDivider: { width: '1px', height: '22px', backgroundColor: '#E2E8F0', flexShrink: 0, margin: '0 2px' },
  inputField: {
    flex: 1, height: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent',
    fontSize: '15px', color: '#1E293B', fontWeight: '500', minWidth: 0,
  },

  otpInfoCard: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    backgroundColor: '#EBF1FE', border: 'none',
    borderRadius: '14px', padding: '10px 14px',
  },
  otpInfoIcon: { flexShrink: 0, marginTop: '1px' },
  otpInfoText: { margin: 0, fontSize: '12.5px', color: '#1E3A8A', lineHeight: '1.4', fontWeight: '500' },

  sendOtpBtn: {
    width: '100%', height: '46px', borderRadius: '14px', border: 'none',
    backgroundColor: '#2554EB', color: '#ffffff',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(37, 84, 235, 0.22)', transition: 'opacity 0.2s',
  },

  otpHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' },
  resendTimerText: { fontSize: '12.5px', color: '#64748B', fontWeight: '500' },
  resendTimerBold: { color: '#2554EB', fontWeight: '700' },
  resendLinkBtn: { background: 'none', border: 'none', padding: 0, color: '#2554EB', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' },
  otpBoxRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  otpBox: {
    width: '15%', aspectRatio: '1 / 1', maxWidth: '46px', borderRadius: '12px',
    border: '1.5px solid #E2E8F0', backgroundColor: '#ffffff',
    textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#1E293B',
    outline: 'none', boxSizing: 'border-box',
  },
  otpBoxFilled: { borderColor: '#2554EB' },

  primaryCta: {
    width: '100%', height: '48px', borderRadius: '14px', border: 'none',
    backgroundColor: '#2554EB', color: '#ffffff',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 12px 26px rgba(37, 84, 235, 0.25)', transition: 'opacity 0.2s',
    marginTop: '2px',
  },

  switchViewText: { textAlign: 'center', fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' },
  toggleLink: { color: '#2554EB', fontWeight: '700', background: 'none', border: 'none', padding: 0, marginLeft: '5px', cursor: 'pointer' },

  featureRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginTop: '14px', width: '100%',
  },
  featureItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  featureIconWrap: {
    width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#E4EAFC',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { fontSize: '11px', fontWeight: '600', color: '#475569', textAlign: 'center', lineHeight: '1.3' },
  featureDivider: { width: '1px', alignSelf: 'stretch', backgroundColor: '#E2E8F0', margin: '8px 4px 0 4px' },
};
