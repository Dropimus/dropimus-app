/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  anchorerName?: string;
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
  onchainCallId?: number | null;
}

/**
 * A claim is "live" — open for participants to take positions — once it is
 * funded and confirmed on-chain (status "active"), or while still using the
 * legacy "open" status. pending_onchain/resolving/terminal states are not.
 */
export const isClaimLive = (status?: string): boolean =>
  status === 'active' || status === 'open';

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
  balanceUSDC: 0,
  balanceHonor: 0,
  tier: "Novice",
};

export default getAppKit;
