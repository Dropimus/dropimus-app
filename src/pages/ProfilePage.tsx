/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  History, 
  Award, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  HelpCircle 
} from 'lucide-react';
import { C, FONTS } from '../tokens';
import { Wallet, GoogleUser, Claim } from '../lib/walletAndGoogle';
import { DropimusAPI } from '../lib/dropimusAPI';
import HonorRing from '../components/shared/HonorRing';
import CatPill from '../components/shared/CatPill';
import StatusPill from '../components/shared/StatusPill';

interface ProfilePageProps {
  wallet: Wallet;
  googleUser: GoogleUser;
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onSignOut: () => void;
}

interface StakedInteraction {
  id: string;
  type: 'anchor' | 'stake_proven' | 'stake_faded';
  claimId: number;
  claimTitle: string;
  category: string;
  chain: string;
  amountUSDC: number;
  amountHonor: number;
  proofType: string;
  timestamp: string;
  status: 'open' | 'dead_zone' | 'proven' | 'faded' | 'resolving' | 'pending_onchain' | 'active';
  isWinner?: boolean;
}

export function ProfilePage({ wallet, googleUser, claims, onSelectClaim, onSignOut }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'claims' | 'transactions' | 'anchors'>('claims');

  // Address-equality that is case-insensitive AND never matches on empty values —
  // otherwise a claim with no mapped anchorer ('') would falsely match a session
  // whose wallet address hasn't loaded yet (''), leaking other users' claims.
  const myAddr = (wallet.address || '').toLowerCase();
  const isMine = (a?: string) => !!myAddr && !!a && a.toLowerCase() === myAddr;

  // Filter claims anchored or voted on by this current wallet address
  const userClaims = claims.filter(
    (c) => isMine(c.anchorer) || c.calls.some((v) => isMine(v.wallet))
  );

  // Generate real dynamic transaction interactions list from ACTUAL protocol memory dataset
  const interactions: StakedInteraction[] = [];

  claims.forEach((c) => {
    // If the user anchored this claim, it's a genesis interaction
    if (isMine(c.anchorer)) {
      interactions.push({
        id: `anchor-${c.id}`,
        type: 'anchor',
        claimId: c.id,
        claimTitle: c.title,
        category: c.category,
        chain: c.chain,
        amountUSDC: c.capital,
        amountHonor: c.honorStaked,
        proofType: 'Original Creator Anchor',
        timestamp: c.resolutionDate 
          ? new Date(new Date(c.resolutionDate).getTime() - 14 * 86400000).toISOString() 
          : new Date().toISOString(),
        status: c.status,
      });
    }

    // Find all calls by the user in this claim
    c.calls.forEach((call, index) => {
      if (isMine(call.wallet)) {
        const isWinner = c.status === 'open' ? undefined : (call.side === c.status);
        interactions.push({
          id: `call-${c.id}-${index}`,
          type: call.side === 'proven' ? 'stake_proven' : 'stake_faded',
          claimId: c.id,
          claimTitle: c.title,
          category: c.category,
          chain: c.chain,
          amountUSDC: call.capitalStaked,
          amountHonor: call.honorStaked,
          proofType: call.proofs && call.proofs[0] ? call.proofs[0].type : 'none',
          timestamp: call.timestamp || new Date(Date.now() - (index + 1) * 3600000).toISOString(),
          status: c.status,
          isWinner,
        });
      }
    });
  });

  // Sort interactions by newest first for timeline realism
  interactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Accuracy derived only from the user's own resolved calls (no fabricated value)
  const resolvedCalls = interactions.filter(
    (i) => (i.type === 'stake_proven' || i.type === 'stake_faded') && i.isWinner !== undefined
  );
  const winningCalls = resolvedCalls.filter((i) => i.isWinner).length;
  const accuracyLabel = resolvedCalls.length > 0
    ? `${Math.round((winningCalls / resolvedCalls.length) * 1000) / 10}%`
    : '—';

  const [recentAnchors, setRecentAnchors] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoadingRecent(true);
      // Clear any anchors from a previous session so they can't flash on screen
      // for the wrong account while the new fetch is in flight.
      setRecentAnchors([]);
      try {
        const token = localStorage.getItem('dropimus_jwt_access_token') || '';
        if (token) {
          const res = await DropimusAPI.getMyClaims(token);
          if (res && res.success && Array.isArray(res.data)) {
            setRecentAnchors(res.data);
          } else {
            // Fallback: build from userClaims where status contains anchor parameters
            const localAnchors = userClaims
              .filter(c => isMine(c.anchorer))
              .map(c => ({
                id: c.id,
                title: c.title,
                capital_stake: c.capital,
                created_at: c.resolutionDate
                  ? new Date(new Date(c.resolutionDate).getTime() - 14 * 86400000).toISOString()
                  : new Date().toISOString(),
                anchor_tx_hash: c.txHash,
                status: c.status,
                category: c.category
              }));
            setRecentAnchors(localAnchors);
          }
        } else {
          const localAnchors = userClaims
            .filter(c => isMine(c.anchorer))
            .map(c => ({
              id: c.id,
              title: c.title,
              capital_stake: c.capital,
              created_at: c.resolutionDate
                ? new Date(new Date(c.resolutionDate).getTime() - 14 * 86400000).toISOString()
                : new Date().toISOString(),
              anchor_tx_hash: c.txHash,
              status: c.status,
              category: c.category
            }));
          setRecentAnchors(localAnchors);
        }
      } catch (err) {
        console.warn("Failed to retrieve dynamic anchors history:", err);
      } finally {
        setIsLoadingRecent(false);
      }
    };
    if (wallet.connected) {
      fetchRecent();
    }
  }, [wallet.address, claims]);

  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        maxWidth: isDesktop ? '1100px' : '560px',
        margin: '0 auto',
        padding: '0 16px 100px',
        animation: 'fadeUp 0.22s ease forwards',
      }}
    >
      <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 10px' }}>
        PROTOCOL PROFILE CARD
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1.2fr' : '1fr',
          gap: isDesktop ? '32px' : '0px',
          alignItems: 'start',
        }}
      >
        {/* Left Column (Avatar Card & Action Buttons) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Profile Badge */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '24px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Glowing Profile Avatar */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: (googleUser.loggedIn && googleUser.avatar)
                  ? `url(${googleUser.avatar}) center/cover no-referrer`
                  : `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
                boxShadow: `0 0 28px ${C.blueGlow}`,
                border: `2px solid ${C.border2}`,
                transform: 'scale(1.02)'
              }}
            />

            <div style={{ maxWidth: '100%', minWidth: 0 }}>
              <h2 style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', marginBottom: '4px', wordBreak: 'break-word' }}>
                {googleUser.loggedIn && googleUser.name
                  ? googleUser.name
                  : (wallet.address
                      ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
                      : 'Your Profile')}
              </h2>
              {wallet.address && (
                <span
                  className="bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/5 font-mono text-[11px] text-zinc-400 select-all tracking-tight inline-block"
                  style={{ maxWidth: '100%', wordBreak: 'break-all', lineHeight: 1.5 }}
                >
                  {wallet.address}
                </span>
              )}
            </div>

            {/* Concordance Honor Ring */}
            <HonorRing honor={wallet.balanceHonor} tier={wallet.tier} size={100} />

            <div style={{ width: '100%', height: '1px', background: C.hairline }} />

            {/* Statistical parameters row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
              <div style={{ background: C.elevated, borderRadius: '12px', padding: '12px 8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                  CLAIMS ANCHORED
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: C.text, fontFamily: FONTS.display }}>
                  {claims.filter((c) => isMine(c.anchorer)).length}
                </span>
              </div>

              <div style={{ background: C.elevated, borderRadius: '12px', padding: '12px 8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                  PROVEN
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: C.blueLight, fontFamily: FONTS.display }}>
                  {userClaims.filter((c) => c.status === 'proven').length}
                </span>
              </div>

              <div style={{ background: C.elevated, borderRadius: '12px', padding: '12px 8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.04em', marginBottom: '4px' }}>
                  ACCURACY
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: C.goldBright, fontFamily: FONTS.display }}>
                  {accuracyLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Protocol Sign-out button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onSignOut}
              style={{
                background: 'rgba(217, 48, 80, 0.08)',
                border: '1px solid rgba(217, 48, 80, 0.25)',
                color: '#FF3D5A',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: FONTS.display,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(217, 48, 80, 0.15)';
                e.currentTarget.style.borderColor = '#FF3D5A';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(217, 48, 80, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(217, 48, 80, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(217, 48, 80, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut size={14} />
              Disconnect Session
            </button>
          </div>
        </div>

        {/* Right Column (Connected Historical List & Transaction History Tab Selector) */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: isDesktop ? '0px' : '24px' }}>
          
          {/* Symmetrical tab selection system */}
          <div className="flex border-b border-white/[0.06] mb-5 gap-6 flex-wrap">
            <button
              onClick={() => setActiveTab('claims')}
              className="pb-3 text-xs uppercase font-extrabold tracking-wider transition-all duration-200 cursor-pointer relative"
              style={{
                color: activeTab === 'claims' ? C.text : C.sub,
                borderBottom: activeTab === 'claims' ? `2px solid ${C.text}` : '2px solid transparent',
              }}
            >
              Connected Claims ({userClaims.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className="pb-3 text-xs uppercase font-extrabold tracking-wider transition-all duration-200 cursor-pointer relative flex items-center gap-1.5"
              style={{
                color: activeTab === 'transactions' ? C.text : C.sub,
                borderBottom: activeTab === 'transactions' ? `2px solid ${C.text}` : '2px solid transparent',
              }}
            >
              <History size={13} />
              Transaction History ({interactions.length})
            </button>
            <button
              onClick={() => setActiveTab('anchors')}
              className="pb-3 text-xs uppercase font-extrabold tracking-wider transition-all duration-200 cursor-pointer relative flex items-center gap-1.5"
              style={{
                color: activeTab === 'anchors' ? C.text : C.sub,
                borderBottom: activeTab === 'anchors' ? `2px solid ${C.text}` : '2px solid transparent',
              }}
            >
              <Clock size={13} style={{ color: C.goldBright }} />
              Recent Anchors ({recentAnchors.length})
            </button>
          </div>

          {activeTab === 'claims' ? (
            userClaims.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userClaims.map((claim) => (
                  <div
                    key={claim.id}
                    onClick={() => onSelectClaim(claim)}
                    className="group"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: '16px',
                      padding: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.border2;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.background = C.elevated;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.background = C.card;
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '75%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CatPill category={claim.category} />
                        <span style={{ fontSize: '10px', color: C.sub, fontFamily: FONTS.mono, fontWeight: 700 }}>
                          {claim.chain.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', color: C.text, fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {claim.title}
                      </span>
                    </div>

                    <StatusPill status={claim.status} daysLeft={claim.daysLeft} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: C.sub, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>No active connections found.</span>
                <span className="text-[10px] font-mono text-zinc-500">Secure evaluation consensus locks on the main terminal screen.</span>
              </div>
            )
          ) : activeTab === 'transactions' ? (
            // TRANSACTION HISTORY VIEW LISTING ALL PAST STAKED INTERACTIONS
            interactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {interactions.map((tx) => {
                  // Setup dynamic visualization attributes depending on interaction type
                  const labelType = tx.type === 'anchor'
                    ? 'Anchored Claim'
                    : tx.type === 'stake_proven'
                      ? 'Believed'
                      : 'Doubted';
                  
                  const isAnchor = tx.type === 'anchor';
                  const isProven = tx.type === 'stake_proven';

                  // Format timestamp elegantly
                  const formattedDate = new Date(tx.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Retrieve current associated state
                  let resultAddon = null;
                  if (tx.status === 'open') {
                    resultAddon = <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded font-extrabold">Active Pool</span>;
                  } else if (tx.status === 'resolving') {
                    resultAddon = <span className="text-[10px] bg-yellow-950/40 text-yellow-500 border border-yellow-500/10 font-mono px-2 py-0.5 rounded font-extrabold">Resolving</span>;
                  } else if (tx.isWinner === true) {
                    resultAddon = <span className="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 font-mono px-2 py-0.5 rounded font-extrabold">Winner +85% Yield</span>;
                  } else if (tx.isWinner === false) {
                    resultAddon = <span className="text-[10px] bg-rose-950/50 text-rose-400 border border-rose-500/20 font-mono px-2 py-0.5 rounded font-extrabold">Lost (Decayed 25%)</span>;
                  } else {
                    // For anchor consensus resolved
                    resultAddon = <span className="text-[10px] bg-emerald-950/20 text-emerald-300 border border-emerald-400/10 font-mono px-2 py-0.5 rounded font-extrabold">Settled Genesis</span>;
                  }

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        const matchedClaim = claims.find(c => c.id === tx.claimId);
                        if (matchedClaim) onSelectClaim(matchedClaim);
                      }}
                      className="group"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: '16px',
                        padding: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.border2;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.background = C.elevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = C.card;
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Upper meta indicators */}
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-[10px] font-mono font-bold px-2 py-1 rounded"
                            style={{
                              background: isAnchor 
                                ? 'rgba(230,193,92,0.06)' 
                                : isProven 
                                  ? 'rgba(46,213,115,0.06)' 
                                  : 'rgba(217,48,80,0.06)',
                              color: isAnchor 
                                ? C.goldBright 
                                : isProven 
                                  ? '#2ED573' 
                                  : '#FF3D5A',
                              border: `1px solid ${
                                isAnchor 
                                  ? 'rgba(230,193,92,0.1)' 
                                  : isProven 
                                    ? 'rgba(46,213,115,0.1)' 
                                    : 'rgba(217,48,80,0.1)'
                              }`
                            }}
                          >
                            {labelType}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {tx.chain.toUpperCase()} • {formattedDate}
                          </span>
                        </div>

                        {resultAddon}
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <span style={{ fontSize: '14px', color: C.text, fontWeight: 700 }} className="group-hover:text-white transition-colors">
                          {tx.claimTitle}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-zinc-400">
                           <span className="text-xs font-semibold">Proof Model:</span>
                           <span className="text-xs font-mono bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded text-zinc-300 capitalize">{tx.proofType || 'None'}</span>
                        </div>
                      </div>

                      {/* Financial amounts row */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-1 font-mono text-xs">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">CAPITAL LOCKED</span>
                            <span className="font-bold text-white font-mono">${tx.amountUSDC} USDC</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">HONOR LOCK</span>
                            <span className="font-bold text-zinc-300 font-mono">⚡ {tx.amountHonor} HU</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-white/[0.03] text-zinc-400 font-mono hover:text-white px-2 py-1 rounded flex items-center gap-1.5 transition-all">
                          Verify Tx <ArrowUpRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: C.sub, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>No transactions recorded.</span>
                <span className="text-[10px] font-mono text-zinc-500">Upon staking USDC/Honor in any open consensus pool, transaction records populate.</span>
              </div>
            )
          ) : (
            // DEDICATED RECENT ANCHORS TAB LIST
            isLoadingRecent ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '15px' }}>
                <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-emerald-500 animate-spin" />
                <span className="text-xs font-mono text-zinc-500">Loading live on-chain anchors...</span>
              </div>
            ) : recentAnchors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentAnchors.map((anchor) => {
                  const stakeVal = anchor.capital_stake || anchor.capital || '5';
                  const formattedStake = parseFloat(stakeVal).toFixed(2);
                  const timestampStr = anchor.created_at || anchor.timestamp || Date.now();
                  const formattedDate = new Date(timestampStr).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const txHash = anchor.anchor_tx_hash || anchor.txHash || '';
                  const shortTx = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : 'On-Chain Ledger';

                  return (
                    <div
                      key={anchor.id}
                      onClick={() => {
                        const matchedClaim = claims.find(c => c.id === anchor.id);
                        if (matchedClaim) onSelectClaim(matchedClaim);
                      }}
                      className="group"
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: '16px',
                        padding: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.border2;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.background = C.elevated;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = C.card;
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                            ANCHORED COURT CALL
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {formattedDate}
                          </span>
                        </div>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded font-extrabold">
                          On-Chain Active
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <span style={{ fontSize: '14px', color: C.text, fontWeight: 700 }} className="group-hover:text-white transition-colors">
                          {anchor.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {anchor.category && <CatPill category={anchor.category} />}
                          <span className="text-[10px] font-mono text-zinc-500">BASE NETWORK</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-1 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 block mb-0.5">STAKE COLATERAL</span>
                          <span className="font-bold text-white font-mono">${formattedStake} USDC</span>
                        </div>
                        {txHash ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://sepolia.basescan.org/tx/${txHash}`, '_blank');
                            }}
                            className="bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08] px-2.5 py-1 rounded flex items-center gap-1.5 transition-all outline-none"
                          >
                            <span className="text-[10px] font-mono">{shortTx}</span>
                            <ArrowUpRight size={12} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono italic">Ledger Propagating</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: C.sub, background: C.card, borderRadius: '16px', border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>No completed anchors found.</span>
                <span className="text-[10px] font-mono text-zinc-500">Anchored consensus claims signed with your wallet will appear here.</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
export default ProfilePage;
