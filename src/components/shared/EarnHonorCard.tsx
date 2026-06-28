/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, RefreshCw, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { C, FONTS } from '../../tokens';
import { authFetch } from '../../lib/authClient';
import { Select } from './Select';

// Only these categories are structurally verifiable from the stored Alchemy
// transfer data: token_mint (ERC-20/faucet mint = fungible transfer from the
// zero address — the dominant real event on testnet), nft_mint (ERC-721/1155
// transfer from the zero address), airdrop_claim (incoming token transfer not
// from the zero address). The other categories can't be verified yet, so we
// don't offer them here — they'd just earn nothing and confuse new users.
const LABEL_OPTIONS: { id: string; label: string }[] = [
  { id: 'token_mint', label: 'Token mint / faucet claim' },
  { id: 'nft_mint', label: 'NFT mint' },
  { id: 'airdrop_claim', label: 'Airdrop / incoming tokens' },
];

interface Progress {
  honor_from_labeling: string;
  lifetime_cap: string;
  remaining_to_cap: string;
  cap_reached: boolean;
  labels_awarded_today: number;
  daily_limit: number;
  labels_remaining_today: number;
  current_honor: string;
  min_honor_to_call: string;
  can_call: boolean;
}

const shortHash = (h: string) => (h && h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h);

export function EarnHonorCard({ onHonorEarned }: { onHonorEarned?: () => void }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<number | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busyHash, setBusyHash] = useState<string>('');
  const [toast, setToast] = useState<string>('');

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const loadProgress = useCallback(async () => {
    try {
      const res = await authFetch('/api/wallets/labeling-progress');
      if (res.ok) {
        const j = await res.json().catch(() => null);
        if (j?.data) setProgress(j.data);
      }
    } catch { /* ignore */ }
  }, []);

  const loadTxs = useCallback(async (walletId: number) => {
    setLoadingTxs(true);
    try {
      const res = await authFetch(`/api/wallets/${walletId}/transactions?per_page=50`);
      if (res.ok) {
        const j = await res.json().catch(() => null);
        const d = j?.data;
        // Contract: api_response wraps { transactions: [...] } under data.
        const list = d?.transactions || (Array.isArray(d) ? d : []);
        // A tx_hash can now have multiple transfer legs — collapse to one row per
        // hash (the backend labels/awards across all legs of the same tx).
        const byHash = new Map<string, any>();
        for (const t of (Array.isArray(list) ? list : [])) {
          const h = t.tx_hash || t.hash;
          if (h && !byHash.has(h)) byHash.set(h, t);
        }
        setTxs(Array.from(byHash.values()));
      } else {
        setTxs([]);
      }
    } catch { setTxs([]); }
    finally { setLoadingTxs(false); }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadProgress();
      try {
        const res = await authFetch('/api/wallets');
        if (res.ok) {
          const j = await res.json().catch(() => null);
          const ws = Array.isArray(j?.data) ? j.data : (j?.data?.wallets || []);
          setWallets(ws);
          const primary = ws.find((w: any) => w.is_primary) || ws[0];
          if (primary) { setActiveWalletId(primary.id); await loadTxs(primary.id); }
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [loadProgress, loadTxs]);

  // Auto-detect every structurally-verifiable transaction in the wallet and
  // award Honor in one shot — no manual per-row labeling. The backend enforces
  // the same lifetime cap / daily limit / idempotency as manual labeling.
  const runAutoScore = useCallback(async (walletId: number, silent = false) => {
    setScanning(true);
    if (!silent) flash('Scanning your history for verifiable Honor…');
    try {
      const res = await authFetch(`/api/wallets/${walletId}/auto-score-honor`, { method: 'POST' });
      const j = await res.json().catch(() => null);
      const d = j?.data;
      if (d) {
        const earned = Number(d.honor_awarded_total || 0);
        const count = Number(d.awarded_count || 0);
        if (earned > 0) {
          flash(`+${earned} Honor from ${count} verified ${count === 1 ? 'transaction' : 'transactions'} ⚡`);
          await loadProgress();
          onHonorEarned?.();
        } else if (!silent) {
          flash(d.cap_reached ? 'You’ve earned the maximum Honor from labeling.' : 'No new verifiable transactions found to score.');
        }
        await loadTxs(walletId);
      }
    } catch { /* ignore */ }
    setScanning(false);
  }, [loadProgress, loadTxs, onHonorEarned]);

  const handleImport = async () => {
    if (!activeWalletId) return;
    setImporting(true);
    flash('Importing your wallet history…');
    try {
      await authFetch(`/api/wallets/${activeWalletId}/transactions/import`, { method: 'POST' });
      // Import runs in the background; give it a moment then reload, then
      // immediately auto-score so the user gets Honor without labeling by hand.
      await new Promise(r => setTimeout(r, 6000));
      await loadTxs(activeWalletId);
      await runAutoScore(activeWalletId, true);
    } catch { /* ignore */ }
    setImporting(false);
  };

  const handleLabel = async (txHash: string, label: string) => {
    if (!activeWalletId || !label) return;
    setBusyHash(txHash);
    try {
      const res = await authFetch(`/api/wallets/${activeWalletId}/transactions/${txHash}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const j = await res.json().catch(() => null);
      const honor = j?.data?.honor;
      // Reflect the new label + earned state locally.
      setTxs(prev => prev.map(t => (t.tx_hash === txHash ? { ...t, label, honor_awarded: t.honor_awarded || !!honor?.awarded } : t)));
      if (honor?.awarded) {
        flash(`+${Number(honor.honor_amount || 1)} Honor earned ⚡`);
        await loadProgress();
        onHonorEarned?.();
      } else if (honor?.reason === 'unverifiable') {
        flash('Saved — but that label couldn’t be verified on-chain, so no Honor.');
      } else if (honor?.reason === 'daily_rate_limit') {
        flash('Daily labeling limit reached — come back tomorrow.');
      } else if (honor?.reason === 'lifetime_cap_reached') {
        flash('You’ve earned the maximum Honor from labeling.');
      } else if (honor?.reason === 'already_awarded') {
        flash('Saved.');
      }
    } catch { /* ignore */ }
    setBusyHash('');
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.sub, fontSize: '13px' }}>
          <RefreshCw className="animate-spin" size={15} /> Loading your Honor bootstrap…
        </div>
      </div>
    );
  }

  const current = progress ? Number(progress.current_honor) : 0;
  const minToCall = progress ? Number(progress.min_honor_to_call) : 20;
  const canCall = !!progress?.can_call;
  const pct = Math.min(100, Math.round((current / Math.max(1, minToCall)) * 100));
  const remainingToday = progress?.labels_remaining_today ?? 0;
  const capReached = !!progress?.cap_reached;

  return (
    <div style={{ ...cardStyle, border: `1px solid ${canCall ? C.blueLight + '44' : C.gold + '55'}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ background: canCall ? C.blueDim : 'rgba(230,193,92,0.12)', borderRadius: '10px', padding: '7px', display: 'flex' }}>
          {canCall ? <CheckCircle2 size={16} style={{ color: C.blueBright }} /> : <Sparkles size={16} style={{ color: C.goldBright }} />}
        </div>
        <div>
          <h3 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 800, color: C.text }}>
            {canCall ? 'You can take positions' : 'Earn Honor to start calling'}
          </h3>
          <p style={{ fontSize: '11px', color: C.sub, marginTop: '1px' }}>
            {canCall
              ? `You have ${current} Honor — enough to take a position on any claim.`
              : `Reach ${minToCall} Honor to take your first position.`}
          </p>
        </div>
      </div>

      {/* Progress bar toward calling threshold */}
      <div style={{ margin: '10px 0 4px' }}>
        <div style={{ width: '100%', height: '8px', borderRadius: '99px', background: C.deep, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: canCall ? C.blueLight : C.gold, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: C.sub, fontFamily: FONTS.mono }}>
          <span>{current} Honor</span>
          <span>{minToCall} to call</span>
        </div>
      </div>

      {!canCall && (
        <>
          <p style={{ fontSize: '12px', color: C.sub, lineHeight: 1.5, margin: '10px 0' }}>
            <Info size={12} style={{ verticalAlign: '-1px', marginRight: '4px', color: C.faint }} />
            We scan your wallet for <b style={{ color: C.text }}>token/faucet mints</b>, <b style={{ color: C.text }}>NFT mints</b> and <b style={{ color: C.text }}>incoming airdrops</b> — each one we can verify on-chain earns <b style={{ color: C.goldBright }}>Honor</b> (up to {progress?.lifetime_cap ?? 20}).
            {' '}{capReached ? 'You’ve hit the labeling cap.' : `${remainingToday} of ${progress?.daily_limit ?? 5} left today.`}
          </p>

          {/* Wallet selector (only if more than one) */}
          {wallets.length > 1 && (
            <div style={{ marginBottom: '8px' }}>
              <Select
                value={activeWalletId != null ? String(activeWalletId) : ''}
                onChange={(v) => { const id = Number(v); setActiveWalletId(id); loadTxs(id); }}
                options={wallets.map((w) => ({ value: String(w.id), label: `${w.name || shortHash(w.address)} · ${w.chain}` }))}
                ariaLabel="Select wallet"
              />
            </div>
          )}

          {/* Transactions */}
          {loadingTxs ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.sub, fontSize: '12px', padding: '12px 0' }}>
              <RefreshCw className="animate-spin" size={13} /> Loading transactions…
            </div>
          ) : txs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '14px 0' }}>
              <p style={{ fontSize: '12px', color: C.sub, marginBottom: '10px' }}>No transactions imported yet.</p>
              <button onClick={handleImport} disabled={importing} style={primaryBtn}>
                {importing ? 'Importing…' : 'Import my wallet history'}
              </button>
            </div>
          ) : (
            <>
              {/* Fast path: auto-detect & award across the whole history. */}
              {!capReached && (
                <button
                  onClick={() => activeWalletId && runAutoScore(activeWalletId)}
                  disabled={scanning || remainingToday <= 0}
                  style={{
                    ...primaryBtn,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '11px',
                    marginTop: '4px',
                    opacity: scanning || remainingToday <= 0 ? 0.6 : 1,
                    cursor: scanning || remainingToday <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {scanning
                    ? <><RefreshCw className="animate-spin" size={14} /> Scanning your history…</>
                    : <><Zap size={14} /> Scan my history for Honor</>}
                </button>
              )}
              <p style={{ fontSize: '10px', color: C.faint, textAlign: 'center', margin: '8px 0 2px' }}>
                Or label transactions individually below.
              </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {txs.map((t) => {
                const hash = t.tx_hash || t.hash || '';
                const earned = !!t.honor_awarded;
                const raw = t.raw || {};
                const asset = raw.asset || raw.rawContract?.symbol;
                const category = raw.category;
                // from == zero address ⇒ a mint (ERC-20/721/1155 all share this convention).
                const isMintHint = !!category && String(raw.from || '').toLowerCase().startsWith('0x000000000000');
                const subtitle = [t.tx_type, asset, isMintHint ? 'mint' : category].filter(Boolean).join(' · ') || 'On-chain transfer';
                return (
                  <div key={hash} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: C.deep, border: `1px solid ${earned ? C.gold + '33' : C.border}`, borderRadius: '10px', padding: '8px 10px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: C.text, display: 'block' }}>{shortHash(hash)}</span>
                      <span style={{ fontSize: '9px', color: C.faint, textTransform: 'capitalize' }}>{subtitle}</span>
                    </div>
                    {earned ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: C.goldBright, fontWeight: 700 }}>
                        <CheckCircle2 size={12} /> Honor earned
                      </span>
                    ) : busyHash === hash ? (
                      <RefreshCw className="animate-spin" size={13} style={{ color: C.sub }} />
                    ) : (
                      <div style={{ flexShrink: 0 }}>
                        <Select
                          value={t.label || ''}
                          onChange={(v) => handleLabel(hash, v)}
                          options={LABEL_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                          placeholder="Label as…"
                          disabled={capReached || remainingToday <= 0}
                          fullWidth={false}
                          ariaLabel="Label transaction"
                          style={{ minWidth: '150px', padding: '6px 8px', fontSize: '12px' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </>
      )}

      {toast && (
        <div style={{ marginTop: '10px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={12} style={{ color: C.goldBright }} /> {toast}
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: C.card,
  borderRadius: '16px',
  padding: '16px',
  marginBottom: '16px',
};

const primaryBtn: React.CSSProperties = {
  background: C.gold,
  border: 'none',
  borderRadius: '10px',
  padding: '9px 16px',
  color: '#000',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.display,
};

export default EarnHonorCard;
