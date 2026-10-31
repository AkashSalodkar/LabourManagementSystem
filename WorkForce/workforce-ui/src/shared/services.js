import { API_ROOT } from './constants';
import { authFetch } from './http';

// ===== API SERVICES =====
export const api = {
  get: async (endpoint) => {
    const response = await authFetch(`${API_ROOT}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  },
  post: async (endpoint, data) => {
    const response = await authFetch(`${API_ROOT}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  put: async (endpoint, data) => {
    const response = await authFetch(`${API_ROOT}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  delete: async (endpoint) => {
    const response = await authFetch(`${API_ROOT}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  },
  patch: async (endpoint, data) => {
    const response = await authFetch(`${API_ROOT}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }
    return response.json();
  }
};
