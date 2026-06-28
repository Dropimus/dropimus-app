/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Dropimus API client for backend-integrated Dropimus services.
 * Mirrors the exact Python test script endpoints.
 */

import { API_BASE } from './apiBase';
import { authFetch } from './authClient';

export interface NonceResponse {
  success: boolean;
  data?: {
    nonce: string;
    issued_at: string;
  };
  detail?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    user: {
      username: string;
      address: string;
    };
  };
  detail?: string;
}

export interface AnchorProof {
  proof_type: string;
  title: string;
  content: string;
  media_urls?: string[];
}

export interface AnchorPayload {
  title: string;
  description: string;
  category: string;
  resolution_date: string;
  capital_stake: number | string;
  proof_type: string; // "none" | "soft" | "hard"
  attached_playbook_id?: number | null;
  referral_link?: string | null;
  proofs?: AnchorProof[];
}

// Contract addresses are immutable per deployment, so the config response is
// cached for the session after the first successful fetch.
let _contractConfigCache: { addresses: Record<string, string>; chain?: any } | null = null;

export class DropimusAPI {
  private static getBaseUrl(): string {
    // Central API base (https://api.dropimus.com by default; override via VITE_API_BASE_URL).
    return API_BASE;
  }

  /**
   * GET /api/config/contracts — canonical on-chain contract addresses + chain.
   * Returns { addresses: { dUSD, capital, registry, honor, anchor, treasury },
   * chain: { chain_id, chain_name, rpc_url } } or null if unavailable. Cached.
   */
  static async getContractConfig(): Promise<{ addresses: Record<string, string>; chain?: any } | null> {
    if (_contractConfigCache) return _contractConfigCache;
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/config/contracts`);
      if (!res.ok) return null;
      const json = await res.json();
      const data = json?.data ?? json;
      if (data?.addresses) {
        _contractConfigCache = { addresses: data.addresses, chain: data.chain };
        return _contractConfigCache;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 1. GET /api/auth/wallet/nonce
   */
  static async getNonce(chain: string, address: string): Promise<NonceResponse> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/api/auth/wallet/nonce?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to fetch nonce: HTTP ${res.status} ${body}`);
    }

    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error(data?.detail || data?.message || 'Nonce request failed');
    }

    if (data.data) {
      data.data.chain = chain;
    }
    return data;
  }

  /**
   * 2. POST /api/auth/wallet-auth
   */
  static async authenticateWallet(payload: {
    chain: string;
    address: string;
    nonce: string;
    message: string;
    signed_message: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/wallet-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Wallet authentication failed: HTTP ${res.status} ${body}`);
    }

    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error(data?.detail || data?.message || 'Wallet authentication failed');
    }

    return data;
  }

  /**
   * 3. POST /api/claims/anchor
   */
  static async anchorClaim(payload: AnchorPayload, _accessToken?: string): Promise<any> {
    try {
      const res = await authFetch('/api/claims/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("DropimusAPI: Live anchorCall failed.", err);
      return {
        success: false,
        detail: err instanceof Error ? err.message : "Connection failed during anchoring"
      };
    }
  }

  /**
   * POST /api/claims/{claim_id}/evidence
   */
  static async addClaimEvidence(claimId: string | number, payload: {
    proof_type?: string;
    proofs: AnchorProof[];
  }, _accessToken?: string): Promise<any> {
    try {
      const res = await authFetch(`/api/claims/${claimId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("DropimusAPI: addClaimEvidence failed.", err);
      return {
        success: false,
        detail: err instanceof Error ? err.message : "Evidence upload failed"
      };
    }
  }

  /**
   * GET /api/claims/{claim_id}/evidence
   */
  static async listClaimEvidence(claimId: string | number): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/claims/${claimId}/evidence`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("DropimusAPI: listClaimEvidence failed.", err);
      return { success: false, detail: "Not found" };
    }
  }

  /**
   * 4. GET /api/claims/my
   */
  static async getMyClaims(_accessToken?: string): Promise<any> {
    const res = await authFetch('/api/claims/my');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { success: false, detail: `HTTP ${res.status} ${body}` };
    }
    return await res.json();
  }

  /**
   * 5. GET /api/claims/
   */
  private static normalizeClaimsResponse(data: any): { success: boolean; data: { claims: any[] } } {
    const success = data?.success !== false && data?.ok !== false;

    if (!data) {
      return { success, data: { claims: [] } };
    }

    if (Array.isArray(data)) {
      return { success, data: { claims: data } };
    }

    if (Array.isArray(data.data)) {
      return { success, data: { claims: data.data } };
    }

    if (data.data && Array.isArray(data.data.claims)) {
      return { success, data: { claims: data.data.claims } };
    }

    if (Array.isArray(data.claims)) {
      return { success, data: { claims: data.claims } };
    }

    if (Array.isArray(data.results)) {
      return { success, data: { claims: data.results } };
    }

    if (Array.isArray(data.items)) {
      return { success, data: { claims: data.items } };
    }

    return { success, data: { claims: [] } };
  }

  static async getPublicClaims(limit = 10): Promise<any> {
    const res = await fetch(`${this.getBaseUrl()}/api/claims/?limit=${limit}`);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to fetch public claims: HTTP ${res.status} ${body}`);
    }
    const data = await res.json();
    return this.normalizeClaimsResponse(data);
  }

  /**
   * GET /api/market/claims — claims enriched with real market sentiment
   * (believe/doubt weights, participant counts). Falls back to the plain
   * /claims/ list if the market endpoint is unavailable, so the UI always
   * shows real data and never fabricates sentiment.
   */
  static async getMarketClaims(limit = 50): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/market/claims?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        const norm = this.normalizeClaimsResponse(data);
        if (norm.data.claims.length > 0) return norm;
      }
    } catch { /* fall through to plain claims */ }
    return this.getPublicClaims(limit);
  }

  /**
   * 6. GET /api/claims/{id}
   */
  static async getClaimById(id: string | number): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/claims/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { success: false, detail: "Not found" };
    }
  }

  /**
   * 7. POST /api/calls/claim/{claim_id}/call
   */
  static async submitCall(claimId: string | number, payload: {
    vote: number;
    capital_stake: string;
    onchain_tx_hash: string;
    proof_type: string;
  }, _accessToken?: string): Promise<any> {
    try {
      // Note: honor_stake is intentionally NOT sent — the backend rejects it
      // ("honor impact is computed at settlement"). Honor is never a call input.
      const res = await authFetch(`/api/calls/claim/${claimId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return data || { success: false, detail: `HTTP ${res.status}` };
      return data;
    } catch (err) {
      console.error("DropimusAPI: Live submitCall failed.", err);
      return { success: false, detail: err instanceof Error ? err.message : "Call submission failed" };
    }
  }

  /**
   * 8. GET /api/calls/claim/{claim_id}
   */
  static async getCallForClaim(claimId: string | number, _accessToken?: string): Promise<any> {
    try {
      const res = await authFetch(`/api/calls/claim/${claimId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("DropimusAPI: Live getCallForClaim failed, returning null.", err);
      return { success: true, data: null };
    }
  }

  /**
   * 9. GET /api/users/me — profile
   */
  static async getCurrentUser(accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new Error('Missing access token for current user lookup');
    }

    const res = await authFetch('/api/users/me');
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to fetch current user: HTTP ${res.status} ${body}`);
    }
    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error(data?.detail || data?.message || 'Failed to fetch current user');
    }
    return data;
  }

  /**
   * 10. PUT /api/users/me — update profile
   */
  static async updateCurrentUser(payload: { username?: string; email?: string; full_name?: string }, accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new Error('Missing access token for user update');
    }

    const res = await authFetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Failed to update current user: HTTP ${res.status} ${body}`);
    }
    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error(data?.detail || data?.message || 'Failed to update current user');
    }
    return data;
  }

  /**
   * 11. GET /api/users/me/verification-status — checklist
   */
  static async getVerificationStatus(accessToken: string): Promise<any> {
    if (!accessToken) {
      throw new Error('Authentication token missing for verification status.');
    }

    const res = await authFetch('/api/users/me/verification-status');

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(body || `Failed to fetch verification status (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data || data.success === false) {
      throw new Error(data?.detail || data?.message || 'Verification status response invalid.');
    }

    return data;
  }

  /**
   * 12. GET /api/leaderboard/{board} — real ranking data.
   * Returns a normalized array of entries (empty array if unavailable), so the
   * UI never renders fabricated rankings.
   */
  static async getLeaderboard(board: 'top-forecasters' | 'top-anchors' | 'honor' | 'rising'): Promise<any[]> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/leaderboard/${board}`);
      if (!res.ok) return [];
      const data = await res.json();
      // Tolerant of the response envelope.
      const arr =
        (Array.isArray(data) && data) ||
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.data?.entries) && data.data.entries) ||
        (Array.isArray(data?.entries) && data.entries) ||
        (Array.isArray(data?.results) && data.results) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.leaders) && data.leaders) ||
        [];
      return arr;
    } catch {
      return [];
    }
  }
}

/**
 * Grant the dUSD allowance the protocol needs, then let the backend pull the
 * capital via transferFrom (depositCapital / the registry).
 *
 * IMPORTANT — the approval spender differs by action:
 *   - Anchoring a claim       → approve DropimusCapital   (addresses.capital)
 *   - Taking a position (call)→ approve DropimusCallRegistry (addresses.registry)
 *
 * The contracts pull the funds themselves (depositCapital does transferFrom), so
 * the frontend ONLY approves — it does NOT send a deposit transaction. The
 * earlier code approved the treasury and sent a deposit tx to it, which is why
 * the on-chain allowance to Capital stayed 0 and anchoring never funded.
 *
 * A generous (max-uint256) allowance is granted so a single approval covers this
 * and future stakes and can never be marginally short of `required`.
 */
export async function signUSDCApprovalAndDeposit(
  userAddress: string,
  usdcAmount: number,
  claimId: number | string,
  onProgress: (status: string, stage: 'approve' | 'deposit' | 'sign' | 'complete' | 'error') => void,
  prefetchedPreflight?: any,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const isAnchor = !claimId || claimId === 0 || claimId === '0';

    // Reuse a preflight the caller already fetched (so the wallet prompt opens
    // immediately) — otherwise fetch the right readiness endpoint.
    const allowancePath = isAnchor
      ? `/api/claims/preflight?amount=${usdcAmount}`
      : `/api/calls/preflight/${claimId}`;

    let pf = prefetchedPreflight;
    if (!pf) {
      onProgress('Verifying on-chain requirements…', 'approve');
      try {
        const res = await authFetch(allowancePath);
        if (!res.ok) throw new Error(`Preflight query failed (HTTP ${res.status})`);
        const json = await res.json();
        if (!json || json.success === false || !json.data) throw new Error(json?.detail || 'Invalid preflight response.');
        pf = json.data;
      } catch (e: any) {
        throw new Error(`Failed to fetch preflight during signing: ${e?.message || e}`);
      }
    }
    const alreadyApproved = !!(pf.has_allowance ?? pf.ready);

    // Canonical contract addresses from /api/config/contracts.
    const cfg = await DropimusAPI.getContractConfig();
    const spenderAddr = isAnchor ? (cfg?.addresses?.capital || '') : (cfg?.addresses?.registry || '');
    const tokenAddr = cfg?.addresses?.dUSD || pf.mock_usdc_address || '';

    if (!spenderAddr || !tokenAddr) {
      throw new Error('Could not resolve on-chain contract addresses. Please try again shortly.');
    }

    if (alreadyApproved) {
      onProgress('Spend already approved — submitting…', 'approve');
      return { success: true, txHash: '' };
    }

    const { getAppKit } = await import('./walletAndGoogle');
    const kit = await getAppKit();
    const provider = kit?.getWalletProvider() || (window as any).ethereum;
    if (!provider || !provider.request) {
      throw new Error('No active wallet provider found. Please reconnect your wallet.');
    }

    const cleanUserAddr = userAddress.startsWith('0x') ? userAddress : ('0x' + userAddress);
    const cleanToken = tokenAddr.startsWith('0x') ? tokenAddr : ('0x' + tokenAddr);
    const cleanSpender = spenderAddr.startsWith('0x') ? spenderAddr : ('0x' + spenderAddr);

    // approve(spender, max uint256)
    const pSpender = cleanSpender.slice(2).toLowerCase().padStart(64, '0');
    const MAX_UINT256 = 'f'.repeat(64);
    const approveCalldata = '0x095ea7b3' + pSpender + MAX_UINT256;

    onProgress('Please approve dUSD in your wallet…', 'approve');
    const approveTx = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: cleanUserAddr, to: cleanToken, data: approveCalldata }],
    });

    // Poll the backend until the allowance is actually confirmed on-chain — a
    // fixed wait races the block time. The backend then pulls the capital.
    onProgress(`Approval submitted (${approveTx.slice(0, 10)}…). Confirming on Base…`, 'deposit');
    let allowanceConfirmed = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const r = await authFetch(allowancePath);
        if (r.ok) {
          const rj = await r.json();
          if (rj?.data?.has_allowance ?? rj?.data?.ready) { allowanceConfirmed = true; break; }
        }
      } catch { /* keep polling */ }
      onProgress(`Confirming approval on Base… (${(i + 1) * 3}s)`, 'deposit');
    }
    if (!allowanceConfirmed) {
      return { success: false, error: 'Approval is still confirming on-chain. Please wait a moment and try again.' };
    }

    onProgress('Approved. Recording your claim…', 'sign');
    return { success: true, txHash: approveTx };
  } catch (e: any) {
    onProgress(e?.message || 'Transaction rejected', 'error');
    return { success: false, error: e?.message || 'Transaction rejected' };
  }
}

// ── Taking a position (call) on a claim ──────────────────────────────────────
// Unlike anchoring (backend pulls), a caller must sign the on-chain call
// themselves: approve dUSD to DropimusCallRegistry, then call
// registry.submitCall(claimId, direction, capitalStaked). The registry pulls the
// caller's capital via transferFrom and emits CallSubmitted, which the backend
// verifies from the returned tx hash.
const ERC20_ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

// claimId here is the on-chain callId; direction 0=PROVEN, 1=FADED.
const REGISTRY_SUBMIT_ABI = [
  { name: 'submitCall', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'claimId', type: 'uint256' }, { name: 'direction', type: 'uint8' }, { name: 'capitalStaked', type: 'uint256' }], outputs: [] },
] as const;

async function _getProvider(): Promise<any> {
  const { getAppKit } = await import('./walletAndGoogle');
  const kit = await getAppKit();
  const provider = kit?.getWalletProvider() || (window as any).ethereum;
  if (!provider?.request) throw new Error('No active wallet provider found. Please reconnect your wallet.');
  return provider;
}

async function _readAllowance(provider: any, token: string, owner: string, spender: string): Promise<bigint> {
  const { encodeFunctionData } = await import('viem');
  const data = encodeFunctionData({ abi: ERC20_ABI, functionName: 'allowance', args: [owner as `0x${string}`, spender as `0x${string}`] });
  const res = await provider.request({ method: 'eth_call', params: [{ to: token, data }, 'latest'] });
  try { return BigInt(res); } catch { return 0n; }
}

export async function submitCallForClaim(params: {
  onchainCallId: number | null | undefined;
  direction: 0 | 1;
  capitalUsd: number;
  userAddress: string;
  onProgress: (status: string, stage: 'approve' | 'deposit' | 'sign' | 'complete' | 'error') => void;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { onchainCallId, direction, capitalUsd, userAddress, onProgress } = params;
  try {
    if (onchainCallId === null || onchainCallId === undefined) {
      throw new Error('This claim is still confirming on-chain — try again in a moment.');
    }
    const cfg = await DropimusAPI.getContractConfig();
    const registry = cfg?.addresses?.registry;
    const dusd = cfg?.addresses?.dUSD;
    if (!registry || !dusd) throw new Error('Could not resolve on-chain contract addresses.');

    const { encodeFunctionData } = await import('viem');
    const provider = await _getProvider();
    const from = userAddress.startsWith('0x') ? userAddress : '0x' + userAddress;
    const capitalUnits = BigInt(Math.round(capitalUsd * 1_000_000));

    // 1. Ensure the registry can pull the caller's capital (allowance read is
    //    on-chain — the backend preflight checks the Capital contract, not the
    //    registry, so it can't confirm this approval).
    const current = await _readAllowance(provider, dusd, from, registry);
    if (current < capitalUnits) {
      onProgress('Please approve dUSD in your wallet…', 'approve');
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [registry as `0x${string}`, (2n ** 256n - 1n)],
      });
      await provider.request({ method: 'eth_sendTransaction', params: [{ from, to: dusd, data: approveData }] });
      onProgress('Confirming approval on Base…', 'deposit');
      let ok = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const a = await _readAllowance(provider, dusd, from, registry).catch(() => 0n);
        if (a >= capitalUnits) { ok = true; break; }
        onProgress(`Confirming approval on Base… (${(i + 1) * 3}s)`, 'deposit');
      }
      if (!ok) return { success: false, error: 'Approval is still confirming on-chain. Please wait a moment and try again.' };
    }

    // 2. Submit the call — the registry pulls the capital and emits CallSubmitted.
    onProgress('Please confirm your position in your wallet…', 'deposit');
    const callData = encodeFunctionData({
      abi: REGISTRY_SUBMIT_ABI,
      functionName: 'submitCall',
      args: [BigInt(onchainCallId), direction, capitalUnits],
    });
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: registry.startsWith('0x') ? registry : '0x' + registry, data: callData }],
    });

    onProgress('Position submitted — recording…', 'sign');
    return { success: true, txHash };
  } catch (e: any) {
    onProgress(e?.message || 'Transaction rejected', 'error');
    return { success: false, error: e?.message || 'Transaction rejected' };
  }
}
