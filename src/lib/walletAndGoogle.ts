/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_CLAIMS, TIER, PROOF_TYPES } from '../data';
import { DropimusAPI } from './dropimusAPI';
// Lazy state for Web3 AppKit inside iframe sandboxes
let appKitInstance: any = null;

export async function getAppKit() {
  if (appKitInstance) return appKitInstance;
  if (typeof window === 'undefined') return null;
  try {
    const { createAppKit } = await import('@reown/appkit');
    const { WagmiAdapter } = await import('@reown/appkit-adapter-wagmi');
    const { baseSepolia } = await import('@reown/appkit/networks');

    const projectId = (import.meta as any).env?.VITE_REOWN_PROJECT_ID || 'a0249da7-2581-4b01-a90d-b31e08e025f4';
    const rpcUrl = (import.meta as any).env?.VITE_BASE_TESTNET_RPC_URL || 'https://sepolia.base.org';
    
    // Override RPC endpoints with custom BASE_TESTNET_RPC_URL safely adapting any underlying wagmi structure
    const baseNetwork = baseSepolia as any;
    const customBaseSepolia = {
      ...baseNetwork,
      rpcUrls: {
        ...baseNetwork.rpcUrls,
        default: {
          ...baseNetwork.rpcUrls?.default,
          http: [rpcUrl, ...(baseNetwork.rpcUrls?.default?.http || [])],
        },
        public: {
          ...baseNetwork.rpcUrls?.public,
          http: [rpcUrl, ...(baseNetwork.rpcUrls?.public?.http || [])],
        }
      }
    };
    const networks = [customBaseSepolia] as any;

    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId,
    });

    appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata: {
        name: 'Dropimus Protocol',
        description: 'De-anonymized web3 reputational consensus engine.',
        url: window.location.origin,
        icons: ['https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80']
      },
      features: {
        analytics: false,
        email: false,
        socials: false,
      }
    });

    // Auto-subscribe once on initialization
    try {
      appKitInstance.subscribeAccount((state: any) => {
        try {
          const wallet = DropimusProtocolAPI.getWallet();
          if (state.isConnected && state.address) {
            wallet.connected = true;
            wallet.address = state.address;
            DropimusProtocolAPI.saveWallet(wallet);
          } else if (!state.isConnected && wallet.address !== '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4') {
            wallet.connected = false;
            DropimusProtocolAPI.saveWallet(wallet);
          }
        } catch (innerErr) {
          console.error("Inner AppKit sync error: ", innerErr);
        }
      });
    } catch (subErr) {
      console.warn("AppKit subscription setup skipped:", subErr);
    }

    return appKitInstance;
  } catch (err) {
    console.warn("Reown AppKit setup bypassed (iframe sandbox or lack of valid projectId):", err);
    return null;
  }
}

export interface Proof {
  type: string;
  content: string;
  url: string | null;
}

export interface Call {
  wallet: string;
  tier: string;
  side: 'proven' | 'faded';
  honorStaked: number;
  capitalStaked: number;
  proofs: Proof[];
  weight: number;
  timestamp?: string;
}

export interface Claim {
  id: number;
  title: string;
  category: string;
  chain: string;
  anchorer: string;
  tier: string;
  capital: number;
  honorStaked: number;
  callers: number;
  proven: number;
  faded: number;
  status: 'open' | 'dead_zone' | 'proven' | 'faded' | 'resolving' | 'pending_onchain' | 'active';
  daysLeft: number;
  description: string;
  calls: Call[];
  resolutionDate?: string;
  metric?: string;
  source?: string;
  txHash?: string;
}

export interface GoogleUser {
  loggedIn: boolean;
  name: string;
  email: string;
  avatar: string;
}

export interface Wallet {
  connected: boolean;
  address: string;
  balanceUSDC: number;
  balanceHonor: number;
  tier: string;
}

// LocalStorage helpers to simulate complete operational persistence
const KEYS = {
  CLAIMS: 'dropimus_protocol_claims',
  GOOGLE_USER: 'dropimus_protocol_google_user',
  WALLET: 'dropimus_protocol_wallet',
};

// Default Google Auth state on fresh load
const DEFAULT_GOOGLE_USER: GoogleUser = {
  loggedIn: false,
  name: "",
  email: "",
  avatar: "",
};

// Default Wallet state on fresh load
const DEFAULT_WALLET: Wallet = {
  connected: false,
  address: "",
  balanceUSDC: 450,
  balanceHonor: 340,
  tier: "Contributor", // will dynamically adjust depending on honor range as mapped in TIER
};

export class DropimusProtocolAPI {
  // Initialize baseline states if empty in localStorage
  static initialize() {
    if (!localStorage.getItem(KEYS.CLAIMS)) {
      localStorage.setItem(KEYS.CLAIMS, JSON.stringify(INITIAL_CLAIMS));
    }
    if (!localStorage.getItem(KEYS.GOOGLE_USER)) {
      localStorage.setItem(KEYS.GOOGLE_USER, JSON.stringify(DEFAULT_GOOGLE_USER));
    }
    if (!localStorage.getItem(KEYS.WALLET)) {
      localStorage.setItem(KEYS.WALLET, JSON.stringify(DEFAULT_WALLET));
    }
  }

  // ── Claims API ──────────────────────────────────────────────────
  static getClaims(): Claim[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(KEYS.CLAIMS) || '[]');
    } catch {
      return INITIAL_CLAIMS as Claim[];
    }
  }

  static getClaimById(id: number): Claim | null {
    const claims = this.getClaims();
    return claims.find(c => c.id === id) || null;
  }

  static addClaim(newClaim: Partial<Claim>): Claim {
    const claims = this.getClaims();
    const id = newClaim.id || (claims.length > 0 ? Math.max(...claims.map(c => c.id)) + 1 : 1);
    const fullClaim: Claim = {
      id,
      title: newClaim.title || '',
      category: newClaim.category || 'Crypto',
      chain: newClaim.chain || 'Base',
      anchorer: newClaim.anchorer || '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4',
      tier: newClaim.tier || 'Novice',
      capital: newClaim.capital || 5,
      honorStaked: newClaim.honorStaked || 0,
      callers: 1,
      proven: 100, // initialized wholly proven since the anchorer stakes proven
      faded: 0,
      status: newClaim.status || 'open',
      daysLeft: newClaim.daysLeft || 14,
      description: newClaim.description || '',
      calls: newClaim.calls || [],
      resolutionDate: newClaim.resolutionDate,
      metric: newClaim.metric || 'Price',
      source: newClaim.source || 'Oracle Feed',
      txHash: newClaim.txHash || `0x${Array.from({length:64}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
    };

    claims.push(fullClaim);
    localStorage.setItem(KEYS.CLAIMS, JSON.stringify(claims));

    // Deduct user balances for anchoring
    const wallet = this.getWallet();
    wallet.balanceUSDC = Math.max(0, wallet.balanceUSDC - fullClaim.capital);
    wallet.balanceHonor = Math.max(0, wallet.balanceHonor - fullClaim.honorStaked);
    this.saveWallet(wallet);

    // Live backend integration
    if (newClaim.status !== 'pending_onchain' && newClaim.status !== 'active') {
      try {
        const accessToken = localStorage.getItem('dropimus_jwt_access_token') || '';
        if (accessToken) {
          const payloadDate = fullClaim.resolutionDate
            ? new Date(fullClaim.resolutionDate).toISOString()
            : new Date(Date.now() + 14 * 86400000).toISOString();

          DropimusAPI.anchorClaim({
            title: fullClaim.title,
            description: fullClaim.description,
            category: fullClaim.category.toLowerCase(),
            resolution_date: payloadDate,
            capital_stake: fullClaim.capital.toFixed(2),
            proof_type: 'none'
          }, accessToken).catch(e => console.warn("Live anchorClaim error:", e));
        }
      } catch (e) {
        console.warn("Could not post live anchorClaim:", e);
      }
    }

    return fullClaim;
  }

  static submitCallToClaim(claimId: number, call: Omit<Call, 'wallet' | 'tier'>, onchainTxHash?: string): Claim | null {
    const claims = this.getClaims();
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) return null;

    const claim = claims[idx];
    const wallet = this.getWallet();

    const fullCall: Call = {
      ...call,
      wallet: wallet.address,
      tier: wallet.tier,
      timestamp: new Date().toISOString(),
    };

    claim.calls.push(fullCall);
    claim.callers = claim.calls.length;

    // Accumulate the newly staked dual inputs on the overall claim aggregate
    claim.capital += call.capitalStaked;
    claim.honorStaked += call.honorStaked;

    // Recalculate weights
    // Proven vs Faded weights calculation
    let totalProvenWeight = 0;
    let totalFadedWeight = 0;

    // Anchorer contributes first weight depending on claim stats
    // We compute baseline weight for anchorer and all participants
    claim.calls.forEach(c => {
      if (c.side === 'proven') {
        totalProvenWeight += c.weight;
      } else {
        totalFadedWeight += c.weight;
      }
    });

    const totalWeight = totalProvenWeight + totalFadedWeight;
    if (totalWeight > 0) {
      claim.proven = Math.round((totalProvenWeight / totalWeight) * 100);
      claim.faded = 100 - claim.proven;
    }

    // Deduct financial capital locked
    wallet.balanceUSDC = Math.max(0, wallet.balanceUSDC - call.capitalStaked);
    wallet.balanceHonor = Math.max(0, wallet.balanceHonor - call.honorStaked);
    
    // Dynamically reward some active honor for participation (like an evaluation reward)
    wallet.balanceHonor += 10; // Steve Jobs' gift: 10⚡ honor for contribution
    
    this.saveWallet(wallet);
    localStorage.setItem(KEYS.CLAIMS, JSON.stringify(claims));

    // Live API integration
    try {
      const accessToken = localStorage.getItem('dropimus_jwt_access_token') || '';
      if (accessToken) {
        const tx = onchainTxHash || `0x${Array.from({length:64}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;
        const proofType = call.proofs && call.proofs.length > 0 ? call.proofs[0].type : 'none';
        
        DropimusAPI.submitCall(claimId, {
          vote: call.side === 'proven' ? 1.0 : 0.0,
          honor_stake: call.honorStaked || 20,
          capital_stake: call.capitalStaked.toFixed(2),
          onchain_tx_hash: tx,
          proof_type: proofType || 'none'
        }, accessToken).catch(e => console.warn("Live submitCall API error:", e));
      }
    } catch (e) {
      console.warn("Could not post live submitCall:", e);
    }

    return claim;
  }

  // ── Google Auth API ─────────────────────────────────────────────
  static getGoogleUser(): GoogleUser {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(KEYS.GOOGLE_USER) || '{}');
    } catch {
      return DEFAULT_GOOGLE_USER;
    }
  }

  static loginWithGoogle(name?: string, email?: string, avatar?: string): GoogleUser {
    const user: GoogleUser = {
      loggedIn: true,
      name: name || "Steve Wozny",
      email: email || "dropimus@gmail.com",
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    };
    localStorage.setItem(KEYS.GOOGLE_USER, JSON.stringify(user));
    return user;
  }

  static logoutWithGoogle(): GoogleUser {
    const user: GoogleUser = {
      loggedIn: false,
      name: "",
      email: "",
      avatar: "",
    };
    localStorage.setItem(KEYS.GOOGLE_USER, JSON.stringify(user));
    return user;
  }

  // ── Wallet API ──────────────────────────────────────────────────
  static getWallet(): Wallet {
    this.initialize();
    try {
      const wallet: Wallet = JSON.parse(localStorage.getItem(KEYS.WALLET) || '{}');
      // Dynamically map Tier based on TIER boundaries in data.js
      if (wallet.balanceHonor >= 12000) wallet.tier = 'Steward';
      else if (wallet.balanceHonor >= 3500) wallet.tier = 'Arbiter';
      else if (wallet.balanceHonor >= 800) wallet.tier = 'Analyst';
      else if (wallet.balanceHonor >= 150) wallet.tier = 'Contributor';
      else wallet.tier = 'Novice';
      
      return wallet;
    } catch {
      return DEFAULT_WALLET;
    }
  }

  static saveWallet(wallet: Wallet) {
    if (wallet.balanceHonor >= 12000) wallet.tier = 'Steward';
    else if (wallet.balanceHonor >= 3500) wallet.tier = 'Arbiter';
    else if (wallet.balanceHonor >= 800) wallet.tier = 'Analyst';
    else if (wallet.balanceHonor >= 150) wallet.tier = 'Contributor';
    else wallet.tier = 'Novice';

    localStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
  }

  static connectWallet(): Wallet {
    const wallet = this.getWallet();
    wallet.connected = true;
    this.saveWallet(wallet);

    getAppKit().then(kit => {
      if (kit) {
        try {
          kit.open();
        } catch (e) {
          console.warn("AppKit.open failed: ", e);
        }
      }
    });

    return wallet;
  }

  static disconnectWallet(): Wallet {
    const wallet = this.getWallet();
    wallet.connected = false;
    this.saveWallet(wallet);

    getAppKit().then(kit => {
      if (kit) {
        try {
          kit.disconnect();
        } catch (e) {
          console.warn("AppKit.disconnect failed: ", e);
        }
      }
    });

    return wallet;
  }

  // Admin or event resolution triggers to payout positions (adds supreme weight & realism)
  static resolveClaim(claimId: number, outcome: 'proven' | 'faded') {
    const claims = this.getClaims();
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) return;

    const claim = claims[idx];
    claim.status = outcome;
    claim.daysLeft = 0;

    // Disburse funds to user if they voted on the correct side
    const wallet = this.getWallet();
    let winsUSDC = 0;
    let winsHonor = 0;
    let lossesHonor = 0;

    const callerCount = claim.calls.length || 1;
    const totalCapital = claim.calls.reduce((sum, c) => sum + c.capitalStaked, 0) || 50;
    const avgCapital = totalCapital / callerCount || 50;

    claim.calls.forEach(call => {
      if (call.wallet === wallet.address) {
        const callMultiplier = call.proofs && call.proofs.length > 0
          ? Math.max(...call.proofs.map(p => {
              const matched = PROOF_TYPES.find(t => t.id === p.type);
              return matched ? matched.multiplier : 0.02;
            }))
          : 0.02;

        if (call.side === outcome) {
          // Correct foresight payout: returns capital + 85% yields, plus protocol-determined honor reward
          winsUSDC += Math.round(call.capitalStaked * 1.85);
          winsHonor += Math.max(1, Math.round(50 * (call.capitalStaked / avgCapital) * callMultiplier));
        } else {
          // Wrong evaluation payout: reputation decays by up to 25% of baseline capital ratio
          lossesHonor += Math.max(1, Math.round(50 * (call.capitalStaked / avgCapital) * 0.25));
        }
      }
    });

    if (winsUSDC > 0 || winsHonor > 0 || lossesHonor > 0) {
      wallet.balanceUSDC += winsUSDC;
      wallet.balanceHonor = Math.max(0, wallet.balanceHonor + winsHonor - lossesHonor);
    }

    this.saveWallet(wallet);
    localStorage.setItem(KEYS.CLAIMS, JSON.stringify(claims));
  }
}

// Standard initialization events are handled lazily on call.

export default DropimusProtocolAPI;
