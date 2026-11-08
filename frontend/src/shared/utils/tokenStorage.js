// localStorage helpers. Every access is guarded for SSR (no window on the server).
const TOKEN_KEY = 'retailone.token';
const SESSION_KEY = 'retailone.session';

const hasWindow = () => typeof window !== 'undefined' && !!window.localStorage;

export function getToken() {
  return hasWindow() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token) {
  if (hasWindow()) window.localStorage.setItem(TOKEN_KEY, token);
}

/** Clears both the token and the cached session. */
export function clearToken() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (hasWindow()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

