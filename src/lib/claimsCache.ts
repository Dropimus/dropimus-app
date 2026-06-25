/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Claim, DropimusProtocolAPI } from './walletAndGoogle';
import { DropimusAPI } from './dropimusAPI';

const DB_NAME = 'dropimus_claims_db';
const STORE_NAME = 'claims_store';
const DB_VERSION = 1;

/**
 * Open or upgrade the client-side IndexedDB database
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Persist an array of claims into IndexedDB asynchronously, overwriting existing records by id
 */
export async function saveClaimsToCache(claims: Claim[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('saveClaimsToCache transaction error:', event);
        reject(transaction.error);
      };

      claims.forEach((claim) => {
        // Ensure id is a number
        const record = { ...claim, id: Number(claim.id) };
        store.put(record);
      });
    });
  } catch (err) {
    console.warn('Could not save claims to IndexedDB:', err);
  }
}

/**
 * Get all cached claims from IndexedDB
 */
export async function getCachedClaims(): Promise<Claim[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as Claim[]);
      };

      request.onerror = (event) => {
        console.error('getCachedClaims request error:', event);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Could not get claims from IndexedDB, returning empty', err);
    return [];
  }
}

/**
 * Clear the IndexedDB claims store completely
 */
export async function clearClaimsCache(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('clearClaimsCache request error:', event);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Could not clear IndexedDB cache:', err);
  }
}

/**
 * Prefetch top 10 most active claims during authentication phase
 * Minimizes network latency when transitioning to the court view
 */
export async function prefetchActiveClaims(): Promise<Claim[]> {
  console.log('IndexedDB Cache: Starting claims prefetch for authentication phase...');
  let sourceClaims: Claim[] = [];

  // Try fetching from the real backend first
  try {
    const response = await DropimusAPI.getPublicClaims(50); // Fetch up to 50 public claims
    if (response && response.success && response.data && response.data.claims) {
      sourceClaims = response.data.claims.map((c: any) => {
        const daysLeft = c.resolution_date 
          ? Math.max(0, Math.ceil((new Date(c.resolution_date).getTime() - Date.now()) / 86400000)) 
          : 14;

        const rawCat = c.category || 'Crypto';
        const formattedCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();

        return {
          id: Number(c.id),
          title: c.title || 'Untitled Claim',
          category: formattedCat,
          chain: 'Base',
          anchorer: c.anchorer || '0x9f3b...a2c1',
          tier: 'Contributor',
          capital: Math.round(parseFloat(c.capital_stake || c.capital || '5')),
          honorStaked: Number(c.honor_stake || c.honorStaked || 100),
          callers: Number(c.callers || 1),
          proven: c.proven !== undefined ? Number(c.proven) : 100,
          faded: c.faded !== undefined ? Number(c.faded) : 0,
          status: c.status || 'open',
          daysLeft: daysLeft,
          description: c.description || '',
          calls: c.calls || [],
          resolutionDate: c.resolution_date || c.resolutionDate,
          metric: c.metric || 'Price',
          source: c.source || 'Oracle Feed',
          txHash: c.anchor_tx_hash || c.txHash || '0x...'
        };
      });
    }
  } catch (err) {
    console.warn('Prefetch backend fetch failed, using fallback source:', err);
  }

  // If live data empty or offline, return an empty array or cached claims
  if (!sourceClaims) {
    sourceClaims = [];
  }

  // Activity calculation formula: activity = (capital + (honorStaked / 10)) * callers
  // Sort descending and slice the top 10
  const sortedAndScoredClaims = [...sourceClaims].sort((a, b) => {
    const bActivity = (b.capital + (b.honorStaked / 10)) * b.callers;
    const aActivity = (a.capital + (a.honorStaked / 10)) * a.callers;
    return bActivity - aActivity;
  });

  const top10MostActive = sortedAndScoredClaims.slice(0, 10);
  
  if (top10MostActive.length > 0) {
    console.log(`IndexedDB Cache: Prefetched ${top10MostActive.length} active claims. Persisting to cache...`);
    await saveClaimsToCache(top10MostActive);
  }

  return top10MostActive;
}
