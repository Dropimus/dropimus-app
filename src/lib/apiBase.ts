/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Central base URL for all backend API calls.
 *
 * Defaults to the live backend at https://api.dropimus.com. Override with the
 * VITE_API_BASE_URL env var to point at a different backend, e.g.:
 *   - VITE_API_BASE_URL=http://127.0.0.1:8000   → local uvicorn
 *   - VITE_API_BASE_URL=http://127.0.0.1        → local backend behind nginx
 *
 * An empty/blank value falls back to the production URL (so a stray empty env
 * var can't silently turn every call into a same-origin request that 404s /
 * hits the dev proxy). Routes are appended as-is: `${API_BASE}/api/auth/status`.
 */
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL;
const TRIMMED = typeof RAW_BASE === 'string' ? RAW_BASE.trim() : '';
export const API_BASE: string = (TRIMMED === '' ? 'https://api.dropimus.com' : TRIMMED).replace(/\/+$/, '');
