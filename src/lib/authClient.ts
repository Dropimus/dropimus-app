/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Central authenticated fetch + JWT refresh.
 *
 * - Injects `Authorization: Bearer <access_token>`.
 * - On a 401, calls POST /api/token/refresh once (single-flight, shared across
 *   concurrent requests), stores the new tokens, and retries the original call.
 * - If the refresh fails, clears the session and notifies the app via the
 *   handler registered with `onSessionExpired` (so the UI can sign out cleanly
 *   instead of silently failing).
 */
import { API_BASE } from './apiBase';

const ACCESS_KEY = 'dropimus_jwt_access_token';
const REFRESH_KEY = 'dropimus_jwt_refresh_token';

export const getAccessToken = (): string | null => {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
};
export const getRefreshToken = (): string | null => {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
};
export const setTokens = (access?: string | null, refresh?: string | null): void => {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch { /* ignore */ }
};
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch { /* ignore */ }
};

// App registers a handler so it can sign the user out when the session is
// genuinely dead (refresh failed).
let sessionExpiredHandler: (() => void) | null = null;
export const onSessionExpired = (cb: () => void): void => { sessionExpiredHandler = cb; };

// Single-flight refresh: concurrent 401s share one /token/refresh call.
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refresh = getRefreshToken();
  // Nothing to refresh with, or a simulated/offline session — don't try.
  if (!refresh || refresh.startsWith('simulated')) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const payload = json?.data ?? json;
      const newAccess = payload?.access_token;
      const newRefresh = payload?.refresh_token;
      if (newAccess) {
        setTokens(newAccess, newRefresh);
        return newAccess as string;
      }
      return null;
    } catch {
      // Network/CORS error — treat as "couldn't refresh", but don't sign out
      // here; transient failures shouldn't nuke the session.
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

interface AuthFetchOpts {
  /** Retry once after a successful token refresh on 401 (default: true). */
  retryOn401?: boolean;
  /** Sign the user out if the refresh fails on a 401 (default: true). */
  signOutOnFailure?: boolean;
}

/**
 * fetch() with bearer auth and automatic refresh-on-401. `path` may be a full
 * URL or a leading-slash path appended to API_BASE.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {},
  opts: AuthFetchOpts = {},
): Promise<Response> {
  const { retryOn401 = true, signOutOnFailure = true } = opts;
  const url = /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;
  const credentials = options.credentials ?? 'include';

  const withAuth = (token: string | null): RequestInit => {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { ...options, headers, credentials };
  };

  let res = await fetch(url, withAuth(getAccessToken()));

  if (res.status === 401 && retryOn401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, withAuth(newToken));
    } else if (signOutOnFailure) {
      clearTokens();
      sessionExpiredHandler?.();
    }
  }

  return res;
}
