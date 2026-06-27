/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Central base URL for all backend API calls.
 *
 * Resolution order:
 *   1. VITE_API_BASE_URL (if set non-empty) always wins — point anywhere, e.g.
 *      http://127.0.0.1:8000 (local uvicorn) or http://127.0.0.1 (nginx).
 *   2. In dev (vite dev): "" (same-origin). Requests go to /api/* and the Vite
 *      proxy forwards them to the backend — so the browser makes no cross-origin
 *      request and you don't need backend CORS while developing.
 *   3. In production builds: https://api.dropimus.com (direct).
 *
 * Routes are appended as-is: `${API_BASE}/api/auth/status`.
 */
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL;
const TRIMMED = typeof RAW_BASE === 'string' ? RAW_BASE.trim() : '';
const IS_DEV = !!(import.meta as any).env?.DEV;

export const API_BASE: string = TRIMMED !== ''
  ? TRIMMED.replace(/\/+$/, '')
  : (IS_DEV ? '' : 'https://api.dropimus.com');
