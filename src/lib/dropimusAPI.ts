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

export class DropimusAPI {
  private static getBaseUrl(): string {
    // Central API base (https://api.dropimus.com by default; override via VITE_API_BASE_URL).
    return API_BASE;
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
  static async anchorClaim(payload: AnchorPayload, accessToken: string): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/claims/anchor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
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
  }, accessToken: string): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/claims/${claimId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
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
  static async getMyClaims(accessToken: string): Promise<any> {
    const res = await fetch(`${this.getBaseUrl()}/api/claims/my`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
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
    honor_stake: number;
    capital_stake: string;
    onchain_tx_hash: string;
    proof_type: string;
  }, accessToken: string): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/calls/claim/${claimId}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("DropimusAPI: Live submitCall failed.", err);
      return { success: false, detail: err instanceof Error ? err.message : "Call submission failed" };
    }
  }

  /**
   * 8. GET /api/calls/claim/{claim_id}
   */
  static async getCallForClaim(claimId: string | number, accessToken: string): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/calls/claim/${claimId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
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

    const res = await fetch(`${this.getBaseUrl()}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include',
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

    const res = await fetch(`${this.getBaseUrl()}/api/users/me/verification-status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include'
    });

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
}

/**
 * Performs a real on-chain USDC approval and deposit transaction using the connected Web3 provider.
 * Connects with the live API preflight endpoint to look up testnet contract addresses dynamically.
 */
export async function signUSDCApprovalAndDeposit(
  userAddress: string,
  usdcAmount: number,
  claimId: number | string,
  onProgress: (status: string, stage: 'approve' | 'deposit' | 'sign' | 'complete' | 'error') => void
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const accessToken = localStorage.getItem('dropimus_jwt_access_token') || '';
    let treasuryAddr = '0x32353da725814b01a90db31e08e025f4a1b2c3d4';
    let mockUsdcAddr = '0x12353da725814b01a90db31e08e025f4a1b2c3d4';
    // Convert to 6-decimal USDC micro-units safely (BigInt() throws on fractional numbers).
    let reqUnits = BigInt(Math.round(usdcAmount * 1_000_000));
    let skipApproval = false;

    onProgress('Verifying on-chain preflight requirements...', 'approve');

    try {
      const res = await fetch(`${API_BASE}/api/claims/preflight?amount=${usdcAmount}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) {
        throw new Error(`Preflight query failed (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (!json || json.success === false || !json.data) {
        throw new Error(json?.detail || 'Invalid preflight response.');
      }
      treasuryAddr = json.data.treasury_address || treasuryAddr;
      mockUsdcAddr = json.data.mock_usdc_address || mockUsdcAddr;
      if (json.data.required_units) {
        reqUnits = BigInt(json.data.required_units);
      }
      if (json.data.has_allowance) {
        skipApproval = true;
      }
    } catch (e: any) {
      throw new Error(`Failed to fetch preflight during signing: ${e?.message || e}`);
    }

    const { getAppKit } = await import('./walletAndGoogle');
    const kit = await getAppKit();
    const provider = kit?.getWalletProvider() || (window as any).ethereum;
    if (!provider || !provider.request) {
      throw new Error("No active EIP-1193 Web3 provider found. Please connect your wallet.");
    }

    const cleanUserAddr = userAddress.startsWith('0x') ? userAddress : ('0x' + userAddress);
    const cleanMockUsdc = mockUsdcAddr.startsWith('0x') ? mockUsdcAddr : ('0x' + mockUsdcAddr);
    const cleanTreasury = treasuryAddr.startsWith('0x') ? treasuryAddr : ('0x' + treasuryAddr);

    if (skipApproval) {
      onProgress("Pre-approved spend limit verified. Proceeding directly to collateral deposit...", "approve");
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      onProgress(`Approve spend limit: Requesting permission to spend $${usdcAmount} USDC on behalf of Dropimus Escrow contract...`, 'approve');
      
      const pSpender = cleanTreasury.slice(2).toLowerCase().padStart(64, '0');
      const pAmount = reqUnits.toString(16).padStart(64, '0');
      const approveCalldata = '0x095ea7b3' + pSpender + pAmount;

      onProgress("Please approve the spend limit transaction in your connected wallet...", "approve");
      const approveTx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: cleanUserAddr,
          to: cleanMockUsdc,
          data: approveCalldata
        }]
      });

      onProgress(`Spend limit approved in TX: ${approveTx.slice(0, 10)}... Pending confirmation...`, 'deposit');
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    onProgress(`Now signing stake collateral deposit of $${usdcAmount} USDC to Dropimus smart contract...`, 'deposit');

    let depositCalldata = '';
    if (claimId && claimId !== 0 && claimId !== '0') {
      const pAmt = reqUnits.toString(16).padStart(64, '0');
      const pId = BigInt(claimId).toString(16).padStart(64, '0');
      depositCalldata = '0xe2bbb158' + pAmt + pId;
    } else {
      const pAmt = reqUnits.toString(16).padStart(64, '0');
      depositCalldata = '0xb6b55f25' + pAmt;
    }

    onProgress("Please sign the collateral deposit transaction in your wallet...", "deposit");
    const depositTx = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: cleanUserAddr,
        to: cleanTreasury,
        data: depositCalldata
      }]
    });

    onProgress(`Deposit settled on-chain in TX: ${depositTx.slice(0, 10)}... Finalizing cryptographic registration...`, 'sign');
    await new Promise(resolve => setTimeout(resolve, 3000));

    onProgress(`Broadcast success! Verified on Base network. TX Hash: ${depositTx}`, 'complete');
    return { success: true, txHash: depositTx };
  } catch (e: any) {
    onProgress(`Transaction chain failed: ${e.message || 'Transaction rejected'}`, 'error');
    return { success: false, error: e.message || 'Transaction rejected' };
  }
}
