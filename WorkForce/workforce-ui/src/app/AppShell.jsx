// ===== App shell =====
// Owns everything that is shared by the whole app and is not part of one module:
// sign-in state, language/translations, popups, profile & photo cropper, subscription,
// connectivity, pull-to-refresh, Android back button and the "which screen is open" switch.
// It exposes that shared state to every screen through AppShellContext (see useAppShell()).

import { API_BASE_URL, DEV_SKIP_LOGIN, LANGUAGE_STORAGE_KEY } from '../shared/constants';
import { App } from '@capacitor/app';
import { AppPopup } from '../shared/components';
import { AppShellContext } from './AppShellContext';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { Capacitor } from '@capacitor/core';
import { DEV_MOCK_USER } from './constants';
import DocumentsModule from '../modules/documents/DocumentsModule';
import EmployeeModule from '../modules/employee/EmployeeModule';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import LoginScreen from '../auth/LoginScreen';
import ModuleHome from '../home/ModuleHome';
import { api } from '../shared/services';
import { authFetch } from '../shared/http';
import { businessInfoStyles, customerModuleStyles } from '../shared/styles';
import { clampCropBox, computeContainedLayout, getPersistedSession, handleConfirmExitApp } from './helpers';
import { getInitials } from '../shared/helpers';
import smartpayLogo from '../assets/icon.png';
import { translations } from './translations';
import { useEffect, useRef, useState } from 'react';

export default function AppShell() {
  const persistedUser = DEV_SKIP_LOGIN ? DEV_MOCK_USER : getPersistedSession();

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(DEV_SKIP_LOGIN || !!persistedUser);

  const [loggedInUser, setLoggedInUser] = useState(persistedUser);

  const [userName, setUserName] = useState(persistedUser?.fullName || undefined);

  
  const [profileImg, setProfileImg] = useState(persistedUser?.profileImg || null);

  // Draft photo for the Update Profile modal. `undefined` = no pending change (modal
  // preview falls back to the currently-saved `profileImg`); `null` = user tapped "Remove
  // Photo" in the modal; a data URL = a newly picked/cropped photo. Kept separate from
  // `profileImg` (which the Main Page and other headers read directly) so picking a new
  // photo only previews inside the modal and does not touch the Main Page until the user
  // actually taps Save Changes.
  const [draftProfileImg, setDraftProfileImg] = useState(undefined);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ===== Module home screen: null = show module picker, 'attendance' | 'quotations' = inside that module =====
  const [activeModule, setActiveModule] = useState(null);


  // ===== Business Info: Logo / Signature crop tool =====
  // Lets the user pick a rectangle from a picked photo and keep only that part - e.g. just
  // their face for the logo tile, or just the ink for a signature photo with a white margin.
  const [imageCropper, setImageCropper] = useState(null);
 // { key: 'logoImg' | 'signatureImg', src }
  const [cropBox, setCropBox] = useState(null);
 // { x, y, w, h } in crop-container CSS px
  const [cropImgLayout, setCropImgLayout] = useState(null);
 // { renderW, renderH, offsetX, offsetY }
  const cropContainerRef = useRef(null);

  const cropImgElRef = useRef(null);

  const cropDragRef = useRef(null);
 // { mode: 'move'|'nw'|'ne'|'sw'|'se', startPointerX, startPointerY, startBox }
  const openImageCropper = (key, src) => {
    setCropBox(null);
    setCropImgLayout(null);
    setImageCropper({ key, src });
  };

  const closeImageCropper = () => {
    setImageCropper(null);
    setCropBox(null);
    setCropImgLayout(null);
    cropDragRef.current = null;
  };

  const handleCropImageLoad = () => {
    const img = cropImgElRef.current;
    const container = cropContainerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    const layout = computeContainedLayout(rect.width, rect.height, img.naturalWidth, img.naturalHeight);
    setCropImgLayout(layout);
    // Default to the full image so tapping "Use Crop" without adjusting keeps everything.
    setCropBox({ x: layout.offsetX, y: layout.offsetY, w: layout.renderW, h: layout.renderH });
  };

  const handleCropPointerDown = (e, mode) => {
    if (!cropBox) return;
    e.stopPropagation();
    e.preventDefault();
    cropDragRef.current = { mode, startPointerX: e.clientX, startPointerY: e.clientY, startBox: { ...cropBox } };
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handleCropPointerMove = (e) => {
    const drag = cropDragRef.current;
    if (!drag || !cropImgLayout) return;
    const dx = e.clientX - drag.startPointerX;
    const dy = e.clientY - drag.startPointerY;
    const next = { ...drag.startBox };
    if (drag.mode === 'move') {
      next.x = drag.startBox.x + dx;
      next.y = drag.startBox.y + dy;
    } else {
      if (drag.mode.includes('e')) next.w = drag.startBox.w + dx;
      if (drag.mode.includes('s')) next.h = drag.startBox.h + dy;
      if (drag.mode.includes('w')) { next.x = drag.startBox.x + dx; next.w = drag.startBox.w - dx; }
      if (drag.mode.includes('n')) { next.y = drag.startBox.y + dy; next.h = drag.startBox.h - dy; }
    }
    setCropBox(clampCropBox(next, cropImgLayout));
  };

  const handleCropPointerUp = () => {
    cropDragRef.current = null;
  };

  const handleResetImageCrop = () => {
    if (!cropImgLayout) return;
    setCropBox({ x: cropImgLayout.offsetX, y: cropImgLayout.offsetY, w: cropImgLayout.renderW, h: cropImgLayout.renderH });
  };

  const handleConfirmImageCrop = () => {
    const img = cropImgElRef.current;
    if (!img || !cropBox || !cropImgLayout || !imageCropper) return;
    const scale = img.naturalWidth / cropImgLayout.renderW;
    const sx = (cropBox.x - cropImgLayout.offsetX) * scale;
    const sy = (cropBox.y - cropImgLayout.offsetY) * scale;
    const sw = cropBox.w * scale;
    const sh = cropBox.h * scale;

    // A camera photo can be several megapixels at native resolution. Keeping that full
    // resolution here (the old code scaled `sw`/`sh` back up to the source image's native
    // pixels) is what made saved logo/profile photos multi-MB PNGs - which later bloated
    // generated PDFs to several MB and made the native Share sheet intermittently fail
    // ("Could not prepare the document for sharing"). None of these ever display bigger
    // than a small avatar or a 34pt PDF logo, so cap the output resolution before encoding.
    const MAX_DIMENSION = imageCropper.key === 'qrCodeImg' ? 500 : 400;
    const outScale = Math.min(1, MAX_DIMENSION / Math.max(sw, sh));
    const outW = Math.max(1, Math.round(sw * outScale));
    const outH = Math.max(1, Math.round(sh * outScale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    // QR codes need crisp, lossless edges to stay scannable - everything else (a photo of
    // a logo/stamp, a profile picture) is a continuous-tone photo that compresses far
    // smaller as JPEG with no visible quality loss at these output sizes.
    const dataUrl = imageCropper.key === 'qrCodeImg'
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.85);
    if (imageCropper.key === 'profileImg') {
      // Only update the Update Profile modal's draft - NOT the saved `profileImg` that the
      // Main Page reads from - so the new photo previews in the modal but doesn't show up
      // elsewhere until Save Changes is clicked.
      setDraftProfileImg(dataUrl);
    } else {
      Object.values(moduleRegistryRef.current).forEach((m) => {
        if (m && m.onImageCropped) m.onImageCropped(imageCropper.key, dataUrl);
      });
    }
    closeImageCropper();
  };


  // Shared crop tool UI - used for the Business Info logo/signature pickers AND the
  // Update Profile avatar picker, so every "pick a photo" flow in the app crops the same way.
  const renderImageCropperModal = () => {
    if (!imageCropper) return null;
    const cropTitle = imageCropper.key === 'signatureImg' ? 'Crop Signature' : (imageCropper.key === 'qrCodeImg' ? 'Crop QR Code' : 'Crop Photo');
    // zIndex explicitly bumped above the shared modalOverlay (2000) so the cropper
    // always sits on top of whichever modal launched it - e.g. Update Profile (9999).
    return (
      <div style={{ ...customerModuleStyles.modalOverlay, zIndex: 10000 }} onClick={closeImageCropper}>
        <div style={{ background: '#ffffff', width: 'calc(100% - 40px)', maxWidth: '460px', borderRadius: '24px', padding: '20px', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px', textAlign: 'center' }}>
            {cropTitle}
          </h3>
          <div
            ref={cropContainerRef}
            style={{ position: 'relative', width: '100%', height: '300px', background: '#F1F5F9', borderRadius: '14px', overflow: 'hidden', touchAction: 'none' }}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerLeave={handleCropPointerUp}
          >
            <img
              ref={cropImgElRef}
              src={imageCropper.src}
              alt="To crop"
              onLoad={handleCropImageLoad}
              draggable={false}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
            />
            {cropBox && (
              <div
                onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                style={{
                  position: 'absolute', left: `${cropBox.x}px`, top: `${cropBox.y}px`,
                  width: `${cropBox.w}px`, height: `${cropBox.h}px`,
                  border: '2px solid #0F766E', boxShadow: '0 0 0 2000px rgba(15, 23, 42, 0.5)',
                  cursor: 'move', boxSizing: 'border-box',
                }}
              >
                {['nw', 'ne', 'sw', 'se'].map((corner) => (
                  <div
                    key={corner}
                    onPointerDown={(e) => handleCropPointerDown(e, corner)}
                    style={{
                      position: 'absolute', width: '22px', height: '22px', background: '#0F766E',
                      borderRadius: '50%', border: '2px solid #ffffff', boxSizing: 'border-box',
                      top: corner.includes('n') ? '-11px' : 'auto',
                      bottom: corner.includes('s') ? '-11px' : 'auto',
                      left: corner.includes('w') ? '-11px' : 'auto',
                      right: corner.includes('e') ? '-11px' : 'auto',
                      cursor: `${corner}-resize`,
                      touchAction: 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '14px' }}>
            <button type="button" onClick={closeImageCropper} style={{ flex: 1, height: '46px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: '#ffffff', color: '#334155', fontSize: '14.5px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="button" onClick={handleConfirmImageCrop} style={{ ...businessInfoStyles.modalSaveBtn, width: 'auto', flex: 1, marginTop: 0 }}>Crop</button>
          </div>
        </div>
      </div>
    );
  };

  const [activeSettingsSheet, setActiveSettingsSheet] = useState(null);


  // Per-product quantity the user has typed/stepped to on the "Select Product" screen, before tapping Add.
  const [productQtyDrafts, setProductQtyDrafts] = useState({});

  const getProductQtyDraft = (productId) => (productQtyDrafts[productId] !== undefined ? productQtyDrafts[productId] : '1');

  const setProductQtyDraft = (productId, value) => setProductQtyDrafts((prev) => ({ ...prev, [productId]: value }));

  //const [showPurchaseOrderMoreSheet, setShowPurchaseOrderMoreSheet] = useState(false);

  //const [showProformaInvoiceMoreSheet, setShowProformaInvoiceMoreSheet] = useState(false);

  //const [showProformaInvoiceStatusSheet, setShowProformaInvoiceStatusSheet] = useState(false);

  //const [showDeliveryNoteMoreSheet, setShowDeliveryNoteMoreSheet] = useState(false);

  //const [showReceiptMoreSheet, setShowReceiptMoreSheet] = useState(false);



  // (Duplicate/Edit/Status live purely in-app; Share hands the user a real .pdf file
  // through the OS share sheet, same pattern already used for worker statements above.)
  // Loads the app's own logo (bundled asset) as a base64 PNG so it can be embedded in
  // generated PDFs. Cached after first successful load; silently returns null on failure
  // so a missing/blocked asset never breaks document sharing.
  const appLogoDataUrlRef = useRef(null);

  const getAppLogoDataUrl = async () => {
    if (appLogoDataUrlRef.current) return appLogoDataUrlRef.current;
    try {
      const res = await fetch(smartpayLogo);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      appLogoDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch (e) {
      return null;
    }
  };


  // ===== Language =====
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const t = (key) => (translations[language] && translations[language][key]) || translations.en[key] || key;

  
  const [viewportHeightPx, setViewportHeightPx] = useState(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
  );


  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeightPx(window.visualViewport?.height || window.innerHeight);
    };
    updateViewportHeight();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
    };
  }, []);


  // ===== Keyboard-open detection (used to hide the bottom nav bar) =====
  // The visualViewport shrinks whenever the on-screen keyboard opens, on both
  // web and inside a Capacitor WebView. We track the tallest viewport height
  // seen -- that's the "no keyboard" baseline -- and treat any big drop below
  // it as the keyboard being open. The baseline resets on orientation/size
  // changes (tracked via width) so rotating the device doesn't get mistaken
  // for a keyboard opening.
  const maxViewportHeightRef = useRef(viewportHeightPx);

  const lastViewportWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : lastViewportWidthRef.current;
    if (currentWidth !== lastViewportWidthRef.current) {
      lastViewportWidthRef.current = currentWidth;
      maxViewportHeightRef.current = viewportHeightPx;
    } else if (viewportHeightPx > maxViewportHeightRef.current) {
      maxViewportHeightRef.current = viewportHeightPx;
    }
    setIsKeyboardOpen((maxViewportHeightRef.current - viewportHeightPx) > 120);
  }, [viewportHeightPx]);


  // ===== Vertical scroll indicator (scrollbar) visibility, app-wide =====
  // Injected once into <head> instead of per-screen, so every current and
  // future scrollable container (Home, My Projects, Attendance, Payments,
  // Employee List, Add/Edit Employee, Add/Edit Project, Settings,
  // Subscription, modals, etc.) picks it up automatically -- nothing to
  // repeat per screen. This only styles the scrollbar itself (thin, fading,
  // matching native platform look) and never touches overflow, height,
  // padding, or any other layout property, so existing scroll behaviour and
  // UI layout are unaffected.
  useEffect(() => {
    const styleId = 'app-vertical-scrollbar-visibility';
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
      }
      *::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      *::-webkit-scrollbar-track {
        background: transparent;
      }
      *::-webkit-scrollbar-thumb {
        background-color: rgba(100, 116, 139, 0.5);
        border-radius: 999px;
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  const [customWeekStartDay, setCustomWeekStartDay] = useState(2);

  const [isSubscribePageOpen, setIsSubscribePageOpen] = useState(false);

  // ===== Subscription (trial / ₹99 UPI) =====
  // The server is the single source of truth: it stores the trial start (first login), the
  // subscription dates and verified payments, and it computes every date/remaining-days value
  // using ITS clock. The device clock is never used for access decisions.
  const [subStatus, setSubStatus] = useState(null);
      // response of GET /subscription/status
  const [subLoading, setSubLoading] = useState(false);

  const [subError, setSubError] = useState('');

  const [subOrder, setSubOrder] = useState(null);
        // { orderId, qrImage, upiUri, amount, expiresAt }
  const [subOrderState, setSubOrderState] = useState('idle');
 // idle | creating | waiting | paid | failed | expired
  const subLocked = !!(subStatus && subStatus.accessAllowed === false);


  const loadSubscriptionStatus = async () => {
    if (!loggedInUser?.userId) return null;
    try {
      setSubLoading(true);
      const s = await api.get(`/subscription/status?userId=${loggedInUser.userId}`);
      setSubStatus(s);
      setSubError('');
      return s;
    } catch (e) {
      setSubError('Could not load subscription status. Check your connection and try again.');
      return null;
    } finally { setSubLoading(false); }
  };


  const startUpiPayment = async () => {
    if (!loggedInUser?.userId) return;
    try {
      setSubOrderState('creating');
      setSubError('');
      const order = await api.post(`/subscription/orders?userId=${loggedInUser.userId}`, {});
      setSubOrder(order);
      setSubOrderState('waiting');
    } catch (e) {
      setSubOrderState('failed');
      setSubError(e?.message || 'Could not start the payment. Please try again.');
    }
  };


  // Load status after login and whenever the Subscribe page is opened (trial start is created by the backend on first login).
  useEffect(() => {
    if (isUserAuthenticated && loggedInUser?.userId) loadSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserAuthenticated, loggedInUser?.userId, isSubscribePageOpen]);


  // Trial over / subscription over -> the Subscribe page is shown and cannot be dismissed.
  useEffect(() => {
    if (subLocked) setIsSubscribePageOpen(true);
  }, [subLocked]);


  // Poll the backend for payment confirmation. The backend flips the order to "paid" ONLY after the
  // payment provider's signed webhook (or a server-to-server status check) confirms the money. The app never decides this itself.
  useEffect(() => {
    if (subOrderState !== 'waiting' || !subOrder?.orderId || !loggedInUser?.userId) return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await api.get(`/subscription/orders/${subOrder.orderId}?userId=${loggedInUser.userId}`);
        if (cancelled) return;
        if (r.status === 'paid') {
          setSubOrderState('paid');
          await loadSubscriptionStatus();
        } else if (r.status === 'failed' || r.status === 'expired') {
          setSubOrderState(r.status);
        }
      } catch (e) { /* transient network error - keep polling */ }
    };
    const id = setInterval(tick, 3000);
    tick();
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subOrderState, subOrder?.orderId, loggedInUser?.userId]);

  const [isHelpPageOpen, setIsHelpPageOpen] = useState(false);


  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);


  // ===== Common popup (replaces window.alert / window.confirm everywhere) =====
  const [appPopup, setAppPopup] = useState(null);

  const closeAppPopup = () => setAppPopup(null);

  const showAlert = (message, tone = 'warning', title) => {
    setAppPopup({ open: true, tone, title, message, confirmLabel: t('ok') });
  };

  const showSuccess = (message, title) => {
    setAppPopup({ open: true, tone: 'success', title, message, confirmLabel: t('ok') });
  };

  const showConfirm = (message, onConfirm, opts = {}) => {
    setAppPopup({
      open: true,
      tone: opts.tone || 'warning',
      title: opts.title,
      message,
      confirmLabel: opts.confirmLabel || t('yes'),
      cancelLabel: opts.cancelLabel || t('no'),
      onConfirm: () => { closeAppPopup(); onConfirm(); },
    });
  };


  // ===== New version on Play Store -> ask the user to update =====
  // Runs when the app opens and every time it comes back to the foreground. Uses the same
  // common AppPopup (via setAppPopup) as every other confirm popup: Yes = update, No = later.
  // The prompt is shown at most once per app launch so "No" is respected until the next open.
  // Only works on the installed Android app (Play Store build) - on web / debug builds the
  // plugin throws or reports nothing, which is silently ignored.
  const updatePromptShownRef = useRef(false);

  const checkForAppUpdate = async () => {
    if (updatePromptShownRef.current || !Capacitor.isNativePlatform()) return;
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
      updatePromptShownRef.current = true;
      const startUpdate = async () => {
        try {
          if (info.immediateUpdateAllowed) await AppUpdate.performImmediateUpdate();
          else await AppUpdate.openAppStore();
        } catch (e) {
          try { await AppUpdate.openAppStore(); } catch { /* ignore */ }
        }
      };
      // Don't overwrite another popup that is already on screen - retry on next resume instead.
      setAppPopup((current) => {
        if (current?.open) { updatePromptShownRef.current = false; return current; }
        return {
          open: true,
          tone: 'info',
          title: t('updateAvailableTitle'),
          message: t('updateAvailableMessage'),
          confirmLabel: t('yes'),
          cancelLabel: t('no'),
          onConfirm: () => { closeAppPopup(); startUpdate(); },
        };
      });
    } catch (e) {
      // Not installed from Play Store / no network / plugin unavailable - nothing to show.
    }
  };

  useEffect(() => {
    checkForAppUpdate();
    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => { if (isActive) checkForAppUpdate(); });
    return () => { listenerPromise.then((h) => h.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Ask before throwing away work the user is in the middle of. Returns true so the back
  // press is consumed; the screen only closes if the user answers Yes.
  const confirmDiscardThen = (doClose) => {
    showConfirm(t('cancelProcessConfirm'), doClose, { tone: 'warning', confirmLabel: t('yes'), cancelLabel: t('no') });
    return true;
  };


  // ===== Android hardware back button =====
  // Each module registers its own `closeTopmostScreen` in `moduleRegistryRef` (see the end of that
  // module's file). The shell asks the ACTIVE module first; if the module has nothing left to close
  // it returns false and the shell takes the user back to the Main page.
  const moduleRegistryRef = useRef({});


  const closeProfileModalIfOpen = () => {
    if (isProfileModalOpen) { setIsProfileModalOpen(false); return true; }
    return false;
  };

  const closeSubscribeOrHelpIfOpen = () => {
    if (isSubscribePageOpen) {
      if (subLocked) return true;
      setIsSubscribePageOpen(false);
      return true;
    }
    if (isHelpPageOpen) {
      setIsHelpPageOpen(false);
      return true;
    }
    return false;
  };


  // Set to true right before an intentional reload/navigation (e.g. sign out) so the
  // "Do you want to exit?" / Confirm Navigation prompt doesn't appear on that reload.
  const isIntentionalReloadRef = useRef(false);


  // History guard for the shared overlays (profile / subscribe / help). The attendance screens have
  // their own guard effect inside the attendance module.
  useEffect(() => {
    if (!isUserAuthenticated) return;

    const hasOpenScreens = isProfileModalOpen ||
                          isSubscribePageOpen ||
                          isHelpPageOpen;

    if (hasOpenScreens) {
      window.history.pushState({ appGuard: true, timestamp: Date.now() }, '');
    }
  }, [isUserAuthenticated,
      isProfileModalOpen,
      isSubscribePageOpen,
      isHelpPageOpen]);

  const [loading, setLoading] = useState(false);

  const [isReconnecting, setIsReconnecting] = useState(false);


  // ===== Single-device login: sign out when another device logs in with this number =====
  useEffect(() => {
    if (!isUserAuthenticated) return;

    const forceLogout = async () => {
      try { sessionStorage.setItem('session_replaced_notice', '1'); } catch { /* ignore */ }
      isIntentionalReloadRef.current = true;
      try { await FirebaseAuthentication.signOut(); } catch { /* ignore */ }
      localStorage.clear();
      window.location.reload();
    };
    window.addEventListener('session-replaced', forceLogout);

    // Check immediately on resume and every 60s while open. authFetch dispatches the
    // logout event itself on SESSION_REPLACED, so other errors are ignored here.
    const check = () => api.get('/auth/session-check').catch(() => {});
    const interval = setInterval(check, 60000);
    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => { if (isActive) check(); });

    return () => {
      window.removeEventListener('session-replaced', forceLogout);
      clearInterval(interval);
      listenerPromise.then((h) => h.remove());
    };
  }, [isUserAuthenticated]);


  // Show the reason on the login screen after the forced sign-out reload
  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_replaced_notice')) {
        sessionStorage.removeItem('session_replaced_notice');
        showAlert('You were signed out because your account was logged in on another device.');
      }
    } catch { /* ignore */ }
  }, []);


  // Hide the native splash screen once React has mounted its first frame.
  // (Looked up via Capacitor.Plugins so the build doesn't break if the plugin isn't installed.)
  useEffect(() => {
    try {
      if (Capacitor.isPluginAvailable('SplashScreen')) Capacitor.Plugins.SplashScreen.hide();
    } catch { /* ignore */ }
  }, []);


  const handleFullLogout = () => {
    showConfirm('Are you sure you want to sign out?', () => {
      isIntentionalReloadRef.current = true;
      localStorage.clear();
      setIsUserAuthenticated(false);
      setLoggedInUser(null);
      // (The login screen's own fields are reset because it mounts fresh after sign-out.)
      window.location.reload();
    }, { confirmLabel: t('yes'), tone: 'warning' });
  };


  // Shared "Update Profile" modal — rendered from every top-level screen (Main page,
  // Quotations, Attendance/Payments) so it always opens exactly where it was triggered from.
  const renderProfileModal = () => {
    if (!isProfileModalOpen) return null;
    // What the modal should preview: the pending edit if there is one, otherwise whatever
    // photo is currently saved. This is intentionally NOT written back to `profileImg`
    // (the Main Page's source of truth) until Save Changes succeeds.
    const displayedProfileImg = draftProfileImg !== undefined ? draftProfileImg : profileImg;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '28px 24px 24px 24px', borderRadius: '24px', width: '100%', maxWidth: '360px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '22px' }}>
            <h3 style={{ margin: 0, fontSize: '21px', fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>{t('updateProfile')}</h3>
            <button onClick={() => setIsProfileModalOpen(false)} style={{ position: 'absolute', right: 0, top: 0, background: '#F1F5F9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: '#64748B', padding: 0, lineHeight: 1, flexShrink: 0 }}>&times;</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
            <label htmlFor="user-avatar-file-input" style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '3px solid #EFF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 6px 16px rgba(11, 60, 155, 0.12)' }}>
                {displayedProfileImg ? (<img src={displayedProfileImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (
                  loggedInUser?.fullName
                    ? <span style={{ fontSize: '30px', fontWeight: '700', color: '#0B3C9B' }}>{getInitials(loggedInUser.fullName)}</span>
                    : <span style={{ fontSize: '30px' }}>&#128100;</span>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#0B3C9B', color: '#ffffff', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '2.5px solid #ffffff', boxShadow: '0 2px 6px rgba(11, 60, 155, 0.35)' }}>&#128247;</div>
            </label>
            <input id="user-avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => openImageCropper('profileImg', reader.result);
              reader.readAsDataURL(file);
              e.target.value = '';
            }} />
            <span style={{ fontSize: '12px', color: '#64748B', marginTop: '10px', fontWeight: '500' }}>{t('tapToChangePhoto')}</span>
            {displayedProfileImg && (
              <button
                type="button"
                onClick={() => setDraftProfileImg(null)}
                style={{ background: 'none', border: 'none', padding: 0, marginTop: '6px', fontSize: '12px', color: '#DC2626', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Remove Photo
              </button>
            )}
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: '#64748B', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('yourName')}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 14px', backgroundColor: '#F8FAFC' }}>
              <span style={{ fontSize: '15px', color: '#94A3B8', marginRight: '10px' }}>&#128100;</span>
              <input type="text" value={userName ?? loggedInUser?.fullName ?? ''} onChange={(e) => setUserName(e.target.value)} style={{ flex: 1, padding: '13px 0', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14.5px', color: '#1E293B' }} />
            </div>
          </div>

          <button
            disabled={isSavingProfile}
            onClick={async () => {
              const trimmedName = (userName ?? loggedInUser?.fullName ?? '').trim();
              if (!trimmedName) { showAlert(t('yourName') + ' is required.'); return; }
              // `draftProfileImg === null` means the user explicitly tapped "Remove Photo" -
              // as opposed to `undefined` (never touched this session), which must NOT clear
              // an already-saved photo. The server can't tell these apart from the image
              // value alone, so this flag is sent alongside it.
              const isRemovingPhoto = draftProfileImg === null;

              // No server-side user (e.g. dev/mock session) - fall back to local-only save.
              if (!loggedInUser?.userId) {
                setLoggedInUser(prev => {
                  const updatedUser = { ...prev, fullName: trimmedName, profileImg: displayedProfileImg };
                  try { localStorage.setItem('workforce_user', JSON.stringify(updatedUser)); } catch {}
                  return updatedUser;
                });
                // Commit the draft photo into the saved state (what the Main Page reads)
                // now that the save has gone through, then clear the pending draft.
                setProfileImg(displayedProfileImg);
                setDraftProfileImg(undefined);
                setIsProfileModalOpen(false);
                return;
              }

              setIsSavingProfile(true);
              try {
                const response = await authFetch(`${API_BASE_URL}/profile/${loggedInUser.userId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ fullName: trimmedName, profileImage: displayedProfileImg, removeProfileImage: isRemovingPhoto }),
                });
                const responseText = await response.text();
                let data = {};
                if (responseText) { try { data = JSON.parse(responseText); } catch { data = { message: responseText }; } }

                if (!response.ok) {
                  showAlert(data.message || 'Failed to update profile. Please try again.');
                  return;
                }

                const updatedUser = { ...loggedInUser, fullName: data.fullName, industry: data.industry, profileImg: data.profileImage };
                try { localStorage.setItem('workforce_user', JSON.stringify(updatedUser)); } catch {}
                setLoggedInUser(updatedUser);
                setUserName(data.fullName);
                // Only now - after a successful save - does the Main Page's photo update.
                setProfileImg(data.profileImage || null);
                setDraftProfileImg(undefined);
                setIsProfileModalOpen(false);
              } catch (err) {
                showAlert('Could not reach the server. Please check your connection and try again.');
              } finally {
                setIsSavingProfile(false);
              }
            }}
            style={{ width: '100%', padding: '15px', backgroundColor: '#0B3C9B', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14.5px', fontWeight: '700', cursor: isSavingProfile ? 'default' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 16px rgba(11, 60, 155, 0.25)', opacity: isSavingProfile ? 0.7 : 1 }}>
            <span>&#128190;</span>{isSavingProfile ? t('loading') || 'Saving...' : t('saveChanges')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          <button onClick={() => { setIsProfileModalOpen(false); handleFullLogout(); }} style={{ width: '100%', padding: '14px', backgroundColor: '#ffffff', color: '#DC2626', border: '1.5px solid #FCA5A5', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>&#8618;</span>{t('signOut')}
          </button>

          <p style={{ margin: '16px 0 0 0', fontSize: '11px', color: '#94A3B8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <span>&#128737;&#65039;</span>{t('yourDataIsSecure')}
          </p>
        </div>
      </div>
    );
  };


  // Shared "exit app" confirmation — only ever triggered from the Main page (see closeTopmostScreen).
  const renderExitConfirmPopup = () => (
    <AppPopup
      open={isExitConfirmOpen}
      tone="warning"
      title={t('exitConfirm')}
      confirmLabel={t('yes')}
      cancelLabel={t('no')}
      onConfirm={handleConfirmExitApp}
      onCancel={() => setIsExitConfirmOpen(false)}
      onClose={() => setIsExitConfirmOpen(false)}
    />
  );

    const homeDisplayName = loggedInUser?.fullName ? loggedInUser.fullName.split(' ')[0] : 'there';

  // Everything the other screens/modules read from the shell (state, helpers, popups, profile...).
  const shellValue = {
    activeModule,
    appPopup,
    closeAppPopup,
    closeProfileModalIfOpen,
    closeSubscribeOrHelpIfOpen,
    confirmDiscardThen,
    getAppLogoDataUrl,
    homeDisplayName,
    isHelpPageOpen,
    isIntentionalReloadRef,
    isKeyboardOpen,
    isReconnecting,
    isSubscribePageOpen,
    isUserAuthenticated,
    language,
    loadSubscriptionStatus,
    loading,
    loggedInUser,
    moduleRegistryRef,
    openImageCropper,
    persistedUser,
    profileImg,
    renderExitConfirmPopup,
    renderImageCropperModal,
    renderProfileModal,
    setActiveModule,
    setDraftProfileImg,
    setIsExitConfirmOpen,
    setIsHelpPageOpen,
    setIsProfileModalOpen,
    setIsReconnecting,
    setIsSubscribePageOpen,
    setIsUserAuthenticated,
    setLanguage,
    setLoading,
    setLoggedInUser,
    setProfileImg,
    setSubError,
    setSubOrder,
    setSubOrderState,
    setUserName,
    showAlert,
    showConfirm,
    showSuccess,
    startUpiPayment,
    subError,
    subLoading,
    subLocked,
    subOrder,
    subOrderState,
    subStatus,
    t,
  };

  // ===== Which screen is on? =====
  //  - not signed in            -> LoginScreen
  //  - signed in, no module     -> ModuleHome  (the Main page / module picker)
  //  - signed in, a module open -> that module draws itself (it stays mounted so its data survives)
  //
  // NEW MODULE: create src/modules/<name>/<Name>Module.jsx (copy src/modules/_template/ExampleModule.jsx),
  // add its tile in src/home/ModuleHome.jsx and add <YourModule /> next to the others below.
  return (
    <AppShellContext.Provider value={shellValue}>
      {isUserAuthenticated && loggedInUser ? (
        <>
          <ModuleHome />
          <EmployeeModule />
          <DocumentsModule />
        </>
      ) : (
        <LoginScreen />
      )}
    </AppShellContext.Provider>
  );
}
