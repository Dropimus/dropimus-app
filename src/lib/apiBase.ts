/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Central base URL for all backend API calls.
 *
 * Defaults to the live backend at https://api.dropimus.com. Override with the
 * VITE_API_BASE_URL env var:
 *   - VITE_API_BASE_URL=http://127.0.0.1   → local backend behind nginx
 *   - VITE_API_BASE_URL=""                  → same-origin (use the Vite dev proxy)
 *
 * Routes are appended as-is, e.g. `${API_BASE}/api/auth/status`.
 */
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL;
export const API_BASE: string = (
  RAW_BASE === undefined || RAW_BASE === null ? 'https://api.dropimus.com' : String(RAW_BASE)
).replace(/\/+$/, '');
