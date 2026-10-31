import { SESSION_TOKEN_KEY } from './constants';

// ===== fetch with timeout =====
// Plain fetch() waits forever. After the app has been in the background, the old network
// connection is dead and a request can hang indefinitely, which froze the UI on resume.
// This aborts the request after a timeout so callers' try/catch/finally blocks always run.
// Default: 20s for reads, 45s for writes (uploads such as profile photos can be larger).
export const fetchWithTimeout = async (url, options = {}, timeoutMs) => {
  const method = (options.method || 'GET').toUpperCase();
  const ms = timeoutMs || (method === 'GET' ? 20000 : 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Request timed out. Please check your connection and try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

export const authFetch = async (url, options = {}, timeoutMs) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem('workforce_user') || 'null');
    if (token) headers['X-Session-Token'] = token;
    if (user?.userId) headers['X-User-Id'] = String(user.userId);
  } catch { /* ignore */ }

  const res = await fetchWithTimeout(url, { ...options, headers }, timeoutMs);
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'SESSION_REPLACED') window.dispatchEvent(new Event('session-replaced'));
  }
  return res;
};
