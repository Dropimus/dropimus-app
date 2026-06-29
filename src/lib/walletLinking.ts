/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DropimusAPI } from './dropimusAPI';
import { getAppKit } from './walletAndGoogle';
import { getAddress, type Address } from 'viem';
import { createSiweMessage } from 'viem/siwe';

type WalletLinkProgress = 'opening' | 'nonce' | 'signing' | 'verifying' | 'linked';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const DEFAULT_CHAIN_ID_BY_CHAIN: Record<string, number> = {
  'base-sepolia': 84532,
  base: 8453,
};

function parseIssuedAt(value: string): Date {
  const normalized = value.replace(/\+00:00Z$/, 'Z');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Wallet verification timestamp was invalid.');
  }
  return parsed;
}

async function resolveChainId(chain: string): Promise<number> {
  const cfg = await DropimusAPI.getContractConfig();
  const configured = Number(cfg?.chain?.chain_id ?? cfg?.chain?.id);
  if (Number.isInteger(configured) && configured > 0) return configured;
  return DEFAULT_CHAIN_ID_BY_CHAIN[chain] || 84532;
}

async function getProvider(): Promise<any> {
  const kit = await getAppKit();
  return kit?.getWalletProvider?.() || (window as any).ethereum || null;
}

async function getConnectedAddress(kit: any): Promise<string> {
  const direct =
    kit?.getAccount?.()?.address ||
    kit?.getAddress?.() ||
    kit?.account?.address ||
    '';
  if (direct) return direct;

  const provider = await getProvider();
  const accounts = await provider?.request?.({ method: 'eth_accounts' }).catch(() => []);
  return accounts?.[0] || '';
}

async function waitForWalletAddress(kit: any): Promise<string> {
  const existing = await getConnectedAddress(kit);
  if (existing) return existing;

  const provider = await getProvider();
  if (provider?.request) {
    const requested = await provider.request({ method: 'eth_requestAccounts' }).catch(() => []);
    if (requested?.[0]) return requested[0];
  }

  return await new Promise<string>((resolve, reject) => {
    let done = false;
    let unsubscribe: (() => void) | null = null;
    const finish = (address: string) => {
      if (done) return;
      done = true;
      unsubscribe?.();
      resolve(address);
    };

    try {
      unsubscribe = kit?.subscribeAccount?.((state: any) => {
        if (state?.isConnected && state?.address) finish(state.address);
      }) || null;
    } catch {
      unsubscribe = null;
    }

    const started = Date.now();
    const poll = async () => {
      if (done) return;
      const address = await getConnectedAddress(kit).catch(() => '');
      if (address) return finish(address);
      if (Date.now() - started > 120000) {
        done = true;
        unsubscribe?.();
        reject(new Error('Wallet connection timed out. Please try again.'));
        return;
      }
      setTimeout(poll, 500);
    };
    poll();
  });
}

export async function connectAndLinkWallet(
  onProgress?: (message: string, stage: WalletLinkProgress) => void,
): Promise<{ address: string }> {
  onProgress?.('Opening wallet connection...', 'opening');
  const kit = await getAppKit();
  if (!kit && !(window as any).ethereum) {
    throw new Error('Wallet connection is unavailable in this browser.');
  }

  try {
    kit?.open?.();
  } catch (err) {
    console.warn('AppKit.open failed:', err);
  }

  const address = getAddress(await waitForWalletAddress(kit));
  onProgress?.('Preparing wallet verification...', 'nonce');
  const nonceRes = await DropimusAPI.getWalletLinkNonce('base-sepolia');
  const nonce = nonceRes.data?.nonce;
  const issuedAt = nonceRes.data?.issued_at;
  const chain = (nonceRes.data as any)?.chain || 'base-sepolia';
  if (!nonce || !issuedAt) throw new Error('Wallet verification nonce was not returned.');

  const chainId = await resolveChainId(chain);
  const domain = window.location.host;
  const uri = window.location.origin;
  const message = createSiweMessage({
    address: address as Address,
    chainId,
    domain,
    issuedAt: parseIssuedAt(issuedAt),
    nonce,
    statement: 'Link this wallet to your Dropimus account.',
    uri,
    version: '1',
  });

  onProgress?.('Sign the wallet message to link this account...', 'signing');
  let provider = await getProvider();
  for (let i = 0; !provider?.request && i < 10; i++) {
    await wait(250);
    provider = await getProvider();
  }
  if (!provider?.request) throw new Error('No active wallet provider found.');

  const signedMessage = await provider.request({
    method: 'personal_sign',
    params: [message, address],
  });
  if (!signedMessage) throw new Error('Wallet signature was not returned.');

  onProgress?.('Linking wallet to your account...', 'verifying');
  const linkRes = await DropimusAPI.verifyAndAddWallet({
    chain,
    chain_id: chainId,
    address,
    nonce,
    message,
    signature: signedMessage,
    signed_message: signedMessage,
  });
  if (!linkRes?.success || !linkRes.data) {
    throw new Error(linkRes?.detail || linkRes?.message || 'Wallet verification was rejected.');
  }

  try {
    localStorage.setItem('dropimus_protocol_wallet', JSON.stringify({
      connected: true,
      address,
      balanceUSDC: 0,
      balanceHonor: 0,
      tier: 'Novice',
    }));
  } catch { /* ignore local cache failures */ }

  onProgress?.('Wallet linked.', 'linked');
  return { address };
}
