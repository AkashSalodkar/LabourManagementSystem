import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfileModal = ({ isOpen, onClose, onLogout }) => {
  const { loggedInUser, userName, setUserName, profileImg, setProfileImg } = useAuth();
  const [localUserName, setLocalUserName] = useState(userName || loggedInUser?.fullName || '');

  if (!isOpen) return null;

  const handleSave = () => {
    setUserName(localUserName);
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  const getInitials = () => {
    if (loggedInUser?.fullName) {
      return loggedInUser.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return 'GS';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '28px 24px 24px 24px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '360px',
        boxSizing: 'border-box',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginBottom: '22px',
        }}>
          <h3 style={{ margin: 0, fontSize: '21px', fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            Update Profile
          </h3>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              background: '#F1F5F9',
              border: 'none',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#64748B',
              padding: 0,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
          <label htmlFor="user-avatar-file-input" style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '3px solid #EFF4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 6px 16px rgba(11, 60, 155, 0.12)',
            }}>
              {profileImg ? (
                <img src={profileImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '30px', fontWeight: '700', color: '#0B3C9B' }}>
                  {getInitials()}
                </span>
              )}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              backgroundColor: '#0B3C9B',
              color: '#ffffff',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              border: '2.5px solid #ffffff',
              boxShadow: '0 2px 6px rgba(11, 60, 155, 0.35)',
            }}>
              📷
            </div>
          </label>
          <input
            id="user-avatar-file-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <span style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: '500' }}>
            Tap to change profile photo
          </span>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <label style={{
            display: 'block',
            fontSize: '10.5px',
            fontWeight: '700',
            color: '#64748B',
            marginBottom: '7px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Your Name
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '0 14px',
            backgroundColor: '#F8FAFC',
          }}>
            <span style={{ fontSize: '15px', color: '#94A3B8', marginRight: '10px' }}>👤</span>
            <input
              type="text"
              value={localUserName}
              onChange={(e) => setLocalUserName(e.target.value)}
              style={{
                flex: 1,
                padding: '13px 0',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14.5px',
                color: '#1E293B',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#0B3C9B',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 6px 16px rgba(11, 60, 155, 0.25)',
          }}
        >
          💾 Save Changes
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        <button
          onClick={() => { onClose(); onLogout(); }}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#ffffff',
            color: '#DC2626',
            border: '1.5px solid #FCA5A5',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ↩️ Sign Out
        </button>

        <p style={{
          margin: '16px 0 0 0',
          fontSize: '11px',
          color: '#94A3B8',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
        }}>
          🔒 Your data is secure with us.
        </p>
      </div>
    </div>
  );
};

export default ProfileModal;