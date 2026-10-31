import { CROP_BOX_MIN_SIZE } from './constants';
import { SESSION_TOKEN_KEY } from '../shared/constants';

// ===== Image cropper helpers (logo / signature crop tool) =====
// Given a container's rendered size and an image's natural size, computes how the image
// is actually laid out inside the container when using `object-fit: contain` (i.e. the
// visible image rect, accounting for letterboxing on one axis).
export function computeContainedLayout(containerW, containerH, imgW, imgH) {
  if (!containerW || !containerH || !imgW || !imgH) {
    return { renderW: containerW || 0, renderH: containerH || 0, offsetX: 0, offsetY: 0 };
  }
  const containerRatio = containerW / containerH;
  const imgRatio = imgW / imgH;
  let renderW, renderH;
  if (imgRatio > containerRatio) {
    renderW = containerW;
    renderH = containerW / imgRatio;
  } else {
    renderH = containerH;
    renderW = containerH * imgRatio;
  }
  return {
    renderW, renderH,
    offsetX: (containerW - renderW) / 2,
    offsetY: (containerH - renderH) / 2,
  };
}

// Keeps a crop box's edges within the visible image rect and enforces a minimum size.
export function clampCropBox(box, layout) {
  if (!layout) return box;
  const minX = layout.offsetX;
  const minY = layout.offsetY;
  const maxX = layout.offsetX + layout.renderW;
  const maxY = layout.offsetY + layout.renderH;
  let { x, y, w, h } = box;
  w = Math.max(CROP_BOX_MIN_SIZE, Math.min(w, maxX - minX));
  h = Math.max(CROP_BOX_MIN_SIZE, Math.min(h, maxY - minY));
  x = Math.min(Math.max(x, minX), maxX - w);
  y = Math.min(Math.max(y, minY), maxY - h);
  return { x, y, w, h };
}

  // ✅ Restore a saved session from localStorage on load, so a logged-in user
  // stays logged in across page reloads / reopening the app - until they
  // explicitly sign out via handleFullLogout (which clears localStorage).
export const getPersistedSession = () => {
    try {
      const hasSoftToken = localStorage.getItem('workforce_soft_token') === 'true';
      const hasSession = !!localStorage.getItem(SESSION_TOKEN_KEY);
      const savedUser = localStorage.getItem('workforce_user');
      if (hasSoftToken && hasSession && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // Corrupted/unreadable localStorage entry - treat as no session.
    }
    return null;
  };

export const handleConfirmExitApp = () => {
    if (window.Capacitor?.Plugins?.App?.exitApp) { window.Capacitor.Plugins.App.exitApp(); return; }
    if (window.AndroidBridge?.exitApp) { window.AndroidBridge.exitApp(); return; }
    if (window.navigator?.app?.exitApp) { window.navigator.app.exitApp(); return; }
    window.close();
  };
