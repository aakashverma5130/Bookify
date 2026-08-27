import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'bookify_token';
const USER_KEY  = 'bookify_user';
export const UNAUTHORIZED_EVENT = 'bookify:unauthorized';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 auto-logout (soft, no full reload) ─────
// IMPORTANT: do NOT use `window.location.href` here. A full page reload wipes
// React state and the freshly-stored auth token, causing the "page auto-refresh
// after login" bug. Instead, clear local credentials and dispatch a custom
// event that an in-app router listener can react to with `navigate()`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Dispatch a custom event so React (inside BrowserRouter) can navigate
      // without reloading the page. The `UnauthorizedListener` component in
      // App.jsx picks this up and calls `navigate('/login', { replace: true })`.
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
