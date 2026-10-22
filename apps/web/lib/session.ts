'use client';

/**
 * Global session guard for the static-export frontend.
 *
 * Why this exists: the access token is a short-lived JWT (15m by default) and
 * there is no server middleware under `output: 'export'`. Previously, an idle
 * tab kept rendering the last-fetched (or empty) data forever because nothing
 * reacted to an expired token — API calls just failed silently.
 *
 * Behaviour:
 *  - Before the access token expires, silently call POST /auth/refresh and swap
 *    in a new token (the 7-day refresh token is kept in localStorage).
 *  - If any API request returns 401, try one silent refresh + retry; if that
 *    fails, clear the session and redirect to /login?expired=1&next=…
 *  - If the tab is idle and the token expires, a timer detects it and refreshes
 *    or logs out, so the page never sits there looking "fine" with no data.
 */

const API_FALLBACK = 'http://localhost:3001/v1';

let installed = false;
let redirecting = false;
let refreshing: Promise<string | null> | null = null;

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || API_FALLBACK;
}

function isApiUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/v1/')) return true;
  const base = getApiBase();
  return (
    url.startsWith(base) ||
    url.includes('recruits-connect-one-hr-api.onrender.com') ||
    url.includes('localhost:3001')
  );
}

function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|register|refresh|logout|device)\b/.test(url);
}

export function decodeJwtExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('onehr_token'); } catch {}
  try { localStorage.removeItem('onehr_refresh'); } catch {}
  try { localStorage.removeItem('onehr_user'); } catch {}
  try { document.cookie = 'onehr_auth=; Max-Age=0; path=/'; } catch {}
  try { document.cookie = 'onehr_token=; Max-Age=0; path=/'; } catch {}
}

function currentNext(): string {
  const { pathname, search } = window.location;
  if (pathname === '/login') return '';
  return encodeURIComponent(pathname + (search || ''));
}

/** Clears the session and sends the user to the login screen (idempotent). */
export function logoutToLogin(reason: 'expired' | 'invalid' = 'expired') {
  if (typeof window === 'undefined') return;
  if (redirecting) return;
  if (window.location.pathname === '/login') return;
  redirecting = true;
  clearSession();
  const next = currentNext();
  const qs = reason === 'invalid' ? 'invalid=1' : 'expired=1';
  window.location.href = `/login?${qs}${next ? `&next=${next}` : ''}`;
}

/** Exchanges the stored refresh token (or HttpOnly cookie) for a new access token. */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const rt = localStorage.getItem('onehr_refresh');
      if (!rt && !document.cookie.includes('onehr_refresh=')) return null;
      const res = await fetch(`${getApiBase()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(rt ? { refresh_token: rt } : {}),
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const token = data?.access_token || data?.accessToken;
      if (!token) return null;
      localStorage.setItem('onehr_token', token);
      if (data?.refresh_token) localStorage.setItem('onehr_refresh', data.refresh_token);
      return token as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function withAuthHeader(
  originalFetch: typeof window.fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string,
): Promise<Response> {
  const headers = new Headers(
    init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined),
  );
  headers.set('Authorization', `Bearer ${token}`);
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return originalFetch(new Request(input, { headers }));
  }
  return originalFetch(input, { ...(init || {}), headers });
}

function installFetchInterceptor() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : (input as any)?.url || String(input);
    const res = await originalFetch(input, init);
    if (res.status !== 401 || !isApiUrl(url) || isAuthEndpoint(url)) return res;

    // One silent refresh + retry (via the *original* fetch to avoid recursion),
    // then give up and log out.
    try {
      const token = await refreshAccessToken();
      if (token) {
        const retried = await withAuthHeader(originalFetch, input, init, token);
        if (retried.status !== 401) return retried;
      }
    } catch {
      // fall through to logout
    }
    logoutToLogin('expired');
    return res;
  };
}

function startExpiryWatch() {
  const tick = async () => {
    if (window.location.pathname === '/login') return;
    const token = localStorage.getItem('onehr_token');
    if (!token) return;
    const exp = decodeJwtExpiry(token);
    if (!exp) return;
    const remaining = exp - Date.now();
    if (remaining <= 0) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) logoutToLogin('expired');
    } else if (remaining < 60_000) {
      await refreshAccessToken();
    }
  };
  void tick();
  window.setInterval(tick, 30_000);
}

/** Installs the fetch interceptor, proactive refresh timer and cross-tab logout. */
export function installSessionGuard() {
  if (typeof window === 'undefined' || installed) return;
  installed = true;
  installFetchInterceptor();
  startExpiryWatch();
  try {
    window.addEventListener('storage', (e) => {
      if (e.key === 'onehr_token' && !e.newValue && window.location.pathname !== '/login') {
        logoutToLogin('expired');
      }
    });
  } catch {}
}
