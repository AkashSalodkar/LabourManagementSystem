import { DOC_FONT } from '../modules/documents/constants';
import { FaAddressBook } from 'react-icons/fa';
import { POPUP_ICONS } from './constants';
import { pickPhoneContact } from './helpers';
import smartpayLogo from '../assets/icon.png';

export function AppPopup({ open, tone = 'info', title, message, confirmLabel, cancelLabel, onConfirm, onCancel, onClose }) {
  if (!open) return null;
  const icon = POPUP_ICONS[tone] || POPUP_ICONS.info;
  const isConfirm = !!cancelLabel;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <style>{'@keyframes appPopupIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }'}</style>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px 24px', width: '85%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'appPopupIn 0.18s ease-out' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: icon.bg, color: icon.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 14px auto' }}>{icon.glyph}</div>
        {title && <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 6px 0' }}>{title}</h3>}
        {message && <p style={{ fontSize: title ? '13px' : '15px', fontWeight: title ? '400' : '700', color: title ? '#64748B' : '#1E293B', margin: 0, lineHeight: '1.4' }}>{message}</p>}
        {isConfirm ? (
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={onCancel || onClose}
              style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{ flex: 1, padding: '12px', backgroundColor: '#2554EB', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button
            onClick={onConfirm || onClose}
            style={{ marginTop: '16px', width: '100%', padding: '12px', backgroundColor: '#2554EB', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            {confirmLabel || 'OK'}
          </button>
        )}
      </div>
    </div>
  );
}

// Small round contact-book button used next to a Name field to launch
// pickPhoneContact() and hand the result to the caller's onPick callback.
export function ContactPickButton({ onPick, style, ariaLabel = 'Pick from contacts' }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const picked = await pickPhoneContact();
        if (picked) onPick(picked);
      }}
      aria-label={ariaLabel}
      style={{
        border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        width: '38px', height: '38px', borderRadius: '11px',
        background: 'linear-gradient(145deg, #12786B, #0A3D38)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}
    >
      <FaAddressBook size={16} color="#ffffff" />
    </button>
  );
}

  // Small top-right brand mark shown on every generated document: a compact logo with the
  // app name directly below it. Kept subtle/professional and away from document title,
  // customer details, and totals. Bottom-of-document branding was removed as redundant.
export const DocBrandHeader = () => (
    <div style={{ textAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <img src={smartpayLogo} alt="SmartManage" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', display: 'block' }} />
      <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', letterSpacing: '0.2px', fontFamily: DOC_FONT }}>SmartManage</span>
    </div>
  );
