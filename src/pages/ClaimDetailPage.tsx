/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, PenTool, Zap } from 'lucide-react';
import { C, FONTS } from '../tokens';
import { Claim, Call, Proof, isClaimLive, getAppKit } from '../lib/walletAndGoogle';
import CatPill from '../components/shared/CatPill';
import StatusPill from '../components/shared/StatusPill';
import TierBadge from '../components/shared/TierBadge';
import MarketLines from '../components/shared/MarketLines';
import Avatar from '../components/shared/Avatar';
import Btn from '../components/shared/Btn';
import { Select } from '../components/shared/Select';
import { PROOF_TYPES } from '../data';
import { submitCallForClaim, DropimusAPI, AnchorProof } from '../lib/dropimusAPI';
import { authFetch } from '../lib/authClient';
import CountdownTimer from '../components/shared/CountdownTimer';

interface ClaimDetailPageProps {
  claim: Claim;
  onBack: () => void;
  onUpdate: () => void;
  walletConnected: boolean;
  walletAddress?: string;
  walletBalanceHonor: number;
  walletBalanceUSDC?: number;
  initialExpand?: boolean;
}

export function ClaimDetailPage({ claim: claimProp, onBack, onUpdate, walletConnected, walletAddress = '', walletBalanceHonor, walletBalanceUSDC = 0, initialExpand }: ClaimDetailPageProps) {
  const [makeCallExpanded, setMakeCallExpanded] = useState(initialExpand || false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  // The list passes a possibly-stale claim (e.g. still "pending_onchain" right
  // after anchoring). Fetch the latest by id on open and poll while it's still
  // confirming, so the status flips to active and the tx hash appears without a
  // manual reload. Fresh fields are merged onto the passed object.
  const [freshClaim, setFreshClaim] = useState<Claim | null>(null);
  const claim = freshClaim || claimProp;

  useEffect(() => {
    let cancelled = false;
    let timer: any;
    const load = async () => {
      try {
        const res = await DropimusAPI.getClaimById(claimProp.id);
        const d = res?.data ?? res;
        if (!cancelled && d && (d.status || d.anchor_tx_hash || d.content_hash)) {
          // Anchorer attribution + locked capital, tolerating backend field-name variants.
          // The Claim model only stores submitted_by (a user id), so a name/address
          // appears only when the backend enriches the response — accept any spelling.
          const aObj = (d.anchorer && typeof d.anchorer === 'object' ? d.anchorer : null)
            || (d.submitter && typeof d.submitter === 'object' ? d.submitter : null)
            || (d.submitted_by && typeof d.submitted_by === 'object' ? d.submitted_by : null);
          const anchorerAddr = (typeof d.anchorer === 'string' ? d.anchorer : '')
            || d.anchorer_address || d.submitter_address || d.submitted_by_address || d.creator_address
            || aObj?.address || aObj?.wallet_address || aObj?.primary_wallet || '';
          const anchorerName = d.anchorer_username || d.anchorer_name || d.submitter_username || d.submitted_by_username
            || aObj?.username || aObj?.display_name || aObj?.full_name || '';
          const capitalRaw = d.capital_staked ?? d.capital_stake ?? d.capital ?? d.total_capital ?? d.anchor_capital;
          const capitalNum = capitalRaw != null ? Math.round(Number(capitalRaw)) : NaN;
          setFreshClaim(prev => ({
            ...(prev || claimProp),
            status: d.status || claimProp.status,
            txHash: d.anchor_tx_hash || d.content_hash || d.tx_hash || (prev || claimProp).txHash || '',
            proven: d.proven !== undefined ? Number(d.proven) : (prev || claimProp).proven,
            faded: d.faded !== undefined ? Number(d.faded) : (prev || claimProp).faded,
            callers: d.callers !== undefined ? Number(d.callers) : (prev || claimProp).callers,
            onchainCallId: d.onchain_call_id ?? d.onchainCallId ?? (prev || claimProp).onchainCallId ?? null,
            anchorer: (typeof anchorerAddr === 'string' && anchorerAddr) ? anchorerAddr : (prev || claimProp).anchorer,
            anchorerName: anchorerName || (prev || claimProp).anchorerName,
            capital: Number.isFinite(capitalNum) && capitalNum > 0 ? capitalNum : (prev || claimProp).capital,
          }));
          // Keep polling while the claim is still confirming on-chain.
          if (d.status === 'pending_onchain') timer = setTimeout(load, 8000);
        }
      } catch { /* ignore — keep showing the passed claim */ }
    };
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [claimProp.id, claimProp.status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedSide, setSelectedSide] = useState<'proven' | 'faded' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Whether this market has any positions yet (drives the conviction bar state).
  const totalProven = claim.proven;
  const totalFaded = claim.faded;

  // MakeCall State
  const honorStake = 0;
  const [capitalStake, setCapitalStake] = useState<number>(5);
  const [capitalStakeInput, setCapitalStakeInput] = useState<string>('5');
  const [evidenceList, setEvidenceList] = useState<Proof[]>([]);

  // Anchor Evidence states
  const [anchorEvidence, setAnchorEvidence] = useState<any[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [addingAnchorEvidence, setAddingAnchorEvidence] = useState<boolean>(false);
  const [newAnchorProofType, setNewAnchorProofType] = useState<string>('on-chain');
  const [newAnchorProofTitle, setNewAnchorProofTitle] = useState<string>('');
  const [newAnchorProofDesc, setNewAnchorProofDesc] = useState<string>('');
  const [newAnchorProofMediaUrl, setNewAnchorProofMediaUrl] = useState<string>('');
  const [upgradeTier, setUpgradeTier] = useState<string>(''); // "" | "soft" | "hard"
  const [evidenceError, setEvidenceError] = useState<string>('');
  const [evidenceSuccess, setEvidenceSuccess] = useState<boolean>(false);

  const fetchAnchorEvidence = async () => {
    if (!claim.id) return;
    setLoadingEvidence(true);
    try {
      const res = await DropimusAPI.listClaimEvidence(claim.id);
      if (res && res.success && Array.isArray(res.data)) {
        setAnchorEvidence(res.data);
      } else if (res && Array.isArray(res.data)) {
        setAnchorEvidence(res.data);
      } else {
        setAnchorEvidence([]);
      }
    } catch (err) {
      console.warn("Could not load anchor evidence:", err);
      setAnchorEvidence([]);
    } finally {
      setLoadingEvidence(false);
    }
  };

  useEffect(() => {
    fetchAnchorEvidence();
  }, [claim.id]);
  
  // Wallet contract signature progress wizard states
  const [signingStage, setSigningStage] = useState<'idle' | 'approve' | 'deposit' | 'sign' | 'complete' | 'error'>('idle');
  const [signingMessage, setSigningMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
 
  const handleTriggerTransactionSigning = async () => {
    setSigningStage('approve');
    setSigningMessage('Opening your wallet…');

    // Resolve the connected wallet address — fall back to the live provider
    // account if the prop hasn't hydrated, so a connected wallet is never
    // blocked by a phantom "connect your wallet" error.
    let fromAddr = walletAddress;
    if (!fromAddr) {
      try {
        const kit = await getAppKit();
        const provider = kit?.getWalletProvider() || (window as any).ethereum;
        const accts = await provider?.request({ method: 'eth_accounts' });
        fromAddr = (accts && accts[0]) || '';
      } catch { /* ignore */ }
    }
    if (!fromAddr) {
      setSigningStage('error');
      setSigningMessage('No connected wallet address found. Reconnect your wallet and try again.');
      return;
    }

    // Pre-flight: catch the contract's revert conditions (honor gate, own claim,
    // already-called, window) BEFORE asking the wallet to sign, so the user gets
    // a clear reason instead of a wallet "unknown / failing transaction".
    setSigningMessage('Checking eligibility…');
    try {
      const pfRes = await authFetch(`/api/calls/preflight/${claim.id}?capital_stake=${capitalStake}`);
      if (pfRes.ok) {
        const pj = (await pfRes.json().catch(() => null))?.data;
        if (pj) {
          let reason = '';
          if (pj.is_own_claim) reason = 'You can’t take a position on your own claim.';
          else if (pj.already_called) reason = 'You already have a position on this claim.';
          else if (pj.claim_active === false) reason = 'This claim isn’t open for positions right now.';
          else if (pj.claim_onchain === false) reason = 'This claim is still confirming on-chain — try again shortly.';
          else if (pj.honor_gate_pass === false) reason = `You need ${pj.honor_minimum ?? 20}+ Honor to take a position (you have ${pj.honor_balance ?? 0}). Earn Honor on the Honor tab by labeling your past transactions.`;
          else if (pj.has_balance === false) reason = `Not enough test dUSD — you need ${pj.required_usdc ?? capitalStake} dUSD. Ask the team to top up your wallet.`;
          if (reason) { setSigningStage('error'); setSigningMessage(reason); return; }
        }
      }
    } catch { /* network issue — let the on-chain tx be the source of truth */ }

    // VerdictDirection: PROVEN = 0, FADED = 1 (matches the registry + backend).
    const direction: 0 | 1 = selectedSide === 'proven' ? 0 : 1;

    // The caller signs the on-chain submitCall (registry pulls their capital).
    const result = await submitCallForClaim({
      onchainCallId: claim.onchainCallId,
      direction,
      capitalUsd: capitalStake,
      userAddress: fromAddr,
      onProgress: (msg, stage) => { setSigningMessage(msg); setSigningStage(stage); },
    });

    if (result.success) {
      setTxHash(result.txHash || '');
      const accessToken = localStorage.getItem('dropimus_jwt_access_token') || '';
      if (!accessToken) {
        setSigningStage('error');
        setSigningMessage('Authentication session token missing. Please sign in again.');
        return;
      }
      // vote > 0 ⇒ PROVEN per the backend (expected_direction = vote > 0 ? 0 : 1).
      const vote = selectedSide === 'proven' ? 1 : 0;
      const callRes = await DropimusAPI.submitCall(claim.id, {
        vote,
        capital_stake: capitalStake.toString(),
        onchain_tx_hash: result.txHash || '',
        proof_type: evidenceList.length > 0 ? 'soft' : 'none',
      }, accessToken);

      if (!callRes?.success) {
        setSigningStage('error');
        setSigningMessage(callRes?.detail || 'The backend could not record your position. Your on-chain stake is safe.');
        return;
      }

      setSigningStage('complete');
      setSigningMessage('Position recorded.');
      setTimeout(() => {
        setSigningStage('idle');
        setSigningMessage('');
        setMakeCallExpanded(false);
        setSelectedSide(null);
        setEvidenceList([]);
        setShowConfirmModal(false);
        onUpdate();
      }, 2000);
    }
  };
  
  // New Proof input
  const [newProofType, setNewProofType] = useState<string>('article');
  const [newProofDesc, setNewProofDesc] = useState<string>('');
  const [newProofUrl, setNewProofUrl] = useState<string>('');
  const [addingProof, setAddingProof] = useState(false);
 
  // Accordion state tracker
  const [expandedCallIdx, setExpandedCallIdx] = useState<number | null>(null);
 
  // Sync state whenever the claim ID or expansion intent changes
  useEffect(() => {
    setMakeCallExpanded(initialExpand || false);
    setSelectedSide(null);
    setCapitalStake(5);
    setEvidenceList([]);
  }, [claim.id, initialExpand]);
 
  // Form validations
  const maxMultiplier = evidenceList.length > 0 
    ? Math.max(...evidenceList.map(p => PROOF_TYPES.find(t => t.id === p.type)?.multiplier || 0.02))
    : 0.02; // defaults to No Proof multiplier (0.02x)
 
  const computedWeight = Math.round(capitalStake * maxMultiplier * 10);
  const canSubmit = selectedSide !== null && capitalStake >= 5;

  const handleAddProofSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProofDesc) return;
    const p: Proof = {
      type: newProofType,
      content: newProofDesc,
      url: newProofUrl || null,
    };
    setEvidenceList([...evidenceList, p]);
    setNewProofDesc('');
    setNewProofUrl('');
    setAddingProof(false);
  };

  const toggleCallAccordion = (idx: number) => {
    setExpandedCallIdx(expandedCallIdx === idx ? null : idx);
  };

  // Get matching icon for proof types
  const getProofTypeLabel = (tid: string) => {
    const matched = PROOF_TYPES.find(p => p.id === tid);
    return matched ? matched.label : 'EVIDENCE';
  };

  const getProofColor = (tid: string) => {
    const matched = PROOF_TYPES.find(p => p.id === tid);
    return matched ? matched.color : '#fff';
  };

  return (
    <div
      style={{
        maxWidth: isDesktop ? '920px' : '560px',
        margin: '0 auto',
        padding: '0 16px 100px',
        animation: 'fadeUp 0.22s ease forwards',
      }}
    >
      {/* 1. Header Back Arrow */}
      <div
        onClick={onBack}
        style={{
          fontFamily: FONTS.body,
          fontSize: '13px',
          fontWeight: 600,
          color: C.sub,
          cursor: 'pointer',
          padding: '10px 0',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '10px',
        }}
      >
        ← Back to Claims
      </div>

      {/* 2. Core claim card */}
      <div
        style={{
          background: C.card,
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          border: `1px solid ${C.border}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        {/* Category Badge strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CatPill category={claim.category} />
            <span style={{ fontSize: '11px', color: C.sub, fontFamily: FONTS.mono, letterSpacing: '0.04em' }}>
              · {claim.chain.toUpperCase()} NETWORK
            </span>
          </div>
          <StatusPill status={claim.status} daysLeft={claim.daysLeft} />
        </div>

        {/* Claim Title */}
        <h1
          style={{
            fontFamily: FONTS.display,
            fontSize: '22px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: C.text,
            marginBottom: '14px',
            letterSpacing: '-0.027em',
          }}
        >
          {claim.title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: '13px',
            color: C.sub,
            lineHeight: 1.65,
            marginBottom: '18px',
          }}
        >
          {claim.description}
        </p>

        {/* Anchorer meta banner */}
        {(() => {
          const anchorLabel = claim.anchorerName
            || (claim.anchorer && claim.anchorer.startsWith('0x') && claim.anchorer.length > 10
              ? `${claim.anchorer.slice(0, 6)}…${claim.anchorer.slice(-4)}`
              : claim.anchorer) || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Avatar seed={anchorLabel || String(claim.id)} size={30} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>
                  Anchored by{' '}
                  <span style={{ fontFamily: claim.anchorerName ? FONTS.body : FONTS.mono }}>
                    {anchorLabel || 'an anonymous anchor'}
                  </span>
                </span>
                {claim.tier && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: C.sub }}>
                    Protocol role: <TierBadge tier={claim.tier} />
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Content Hash verification line */}
        <div
          style={{
            background: C.elevated,
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em' }}>
              {claim.txHash ? 'ANCHOR TX · BASE SEPOLIA' : 'ANCHOR TX · BASE SEPOLIA'}
            </span>
            {claim.txHash ? (
              <a
                href={`https://sepolia.basescan.org/tx/${claim.txHash.startsWith('0x') ? claim.txHash : '0x' + claim.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '11px', wordBreak: 'break-all', textDecoration: 'underline' }}
              >
                {claim.txHash.slice(0, 18)}… ↗
              </a>
            ) : (
              <span style={{ fontFamily: FONTS.mono, color: C.sub, fontSize: '11px' }}>
                {claim.status === 'pending_onchain' ? 'Confirming on-chain…' : 'Not yet available'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Anchorer Evidence Section */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} style={{ color: C.goldBright }} />
            <span style={{ fontSize: '10px', color: C.text, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              PRIMARY ANCHOR EVIDENCE
            </span>
          </div>
          {walletConnected && walletAddress && (
            (walletAddress.toLowerCase() === claim.anchorer?.toLowerCase() ||
            (claim.anchorer && claim.anchorer.startsWith('0x') && walletAddress.toLowerCase().startsWith(claim.anchorer.slice(0, 6).toLowerCase())))
          ) && !addingAnchorEvidence && (
            <button
              onClick={() => {
                setAddingAnchorEvidence(true);
                setNewAnchorProofTitle('');
                setNewAnchorProofDesc('');
                setNewAnchorProofMediaUrl('');
                setUpgradeTier('');
                setEvidenceError('');
                setEvidenceSuccess(false);
              }}
              style={{
                fontSize: '11px',
                color: C.blueLight,
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Add Evidence
            </button>
          )}
        </div>

        {/* Display Evidence Checklist */}
        {loadingEvidence ? (
          <span style={{ fontSize: '11px', color: C.sub, fontFamily: FONTS.mono }}>Loading claim evidence...</span>
        ) : anchorEvidence && anchorEvidence.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            {anchorEvidence.map((proof: any, idx: number) => (
              <div
                key={proof.id || idx}
                style={{
                  background: C.deep,
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '8px',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      background: '#111827',
                      color: C.goldBright,
                      border: `1px solid ${C.gold}33`,
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontFamily: FONTS.mono,
                    }}
                  >
                    {proof.proof_type || 'proof'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    {proof.title}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: C.sub, margin: 0 }}>{proof.content}</p>
                {proof.media_urls && proof.media_urls.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {proof.media_urls.map((url: string, uidx: number) => (
                      <a
                        key={uidx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '10px',
                          color: C.blueLight,
                          textDecoration: 'underline',
                          fontFamily: FONTS.mono,
                        }}
                      >
                        [Verification Asset #{uidx + 1}]
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '11px', color: C.sub, margin: 0, fontStyle: 'italic' }}>
            No verified proofs have been registered. Claim resolution resides at the baseline multiplier.
          </p>
        )}

        {/* Add evidence form for the anchorer */}
        {addingAnchorEvidence && (
          <div
            className="animate-fadeUp"
            style={{
              marginTop: '12px',
              borderTop: `1px solid ${C.border}`,
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>
              UPLOAD EVIDENCE SUB-LEDGER
            </span>

            {evidenceError && (
              <div style={{ color: '#EF4444', fontSize: '11px', fontFamily: FONTS.mono }}>
                ✕ {evidenceError}
              </div>
            )}
            {evidenceSuccess && (
              <div style={{ color: '#10B981', fontSize: '11px', fontFamily: FONTS.mono }}>
                ✓ Evidence registered on Base successfully!
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                Proof Type:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['on-chain', 'article', 'document', 'social'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewAnchorProofType(t)}
                    style={{
                      flex: 1,
                      padding: '5px 2px',
                      borderRadius: '6px',
                      background: newAnchorProofType === t ? 'rgba(0, 82, 255, 0.08)' : 'transparent',
                      border: `1px solid ${newAnchorProofType === t ? C.blueLight : C.border}`,
                      color: newAnchorProofType === t ? C.blueLight : C.sub,
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                Proof Title:
              </label>
              <input
                type="text"
                value={newAnchorProofTitle}
                onChange={(e) => setNewAnchorProofTitle(e.target.value)}
                placeholder="e.g., On-chain hash snapshot"
                style={{
                  width: '100%',
                  background: C.deep,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '6px 10px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                Description / Verification Content:
              </label>
              <textarea
                rows={2}
                value={newAnchorProofDesc}
                onChange={(e) => setNewAnchorProofDesc(e.target.value)}
                placeholder="Details of the proof block, article quotes, verification parameters..."
                style={{
                  width: '100%',
                  background: C.deep,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '6px 10px',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                Attached Document URL / Media URL (Optional):
              </label>
              <input
                type="text"
                value={newAnchorProofMediaUrl}
                onChange={(e) => setNewAnchorProofMediaUrl(e.target.value)}
                placeholder="https://example.com/snapshot.pdf"
                style={{
                  width: '100%',
                  background: C.deep,
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '6px 10px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                Upgrade Consensual Evidence Tier (Optional):
              </label>
              <Select
                value={upgradeTier}
                onChange={(v) => setUpgradeTier(v)}
                options={[
                  { value: '', label: 'Keep current tier' },
                  { value: 'soft', label: 'Soft Tier (2.0x Reward Multiplier)' },
                  { value: 'hard', label: 'Hard Tier (6.0x Reward Multiplier)' },
                ]}
                ariaLabel="Evidence tier"
                style={{ fontSize: '12px', padding: '6px 10px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setAddingAnchorEvidence(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.sub,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newAnchorProofTitle || !newAnchorProofDesc) {
                    setEvidenceError("Proof title and description are required.");
                    return;
                  }
                  const accessToken = localStorage.getItem('dropimus_jwt_access_token');
                  if (!accessToken) {
                    setEvidenceError("Authentication session expired. Please log in.");
                    return;
                  }

                  try {
                    const payload = {
                      proof_type: upgradeTier || undefined,
                      proofs: [
                        {
                          proof_type: newAnchorProofType,
                          title: newAnchorProofTitle,
                          content: newAnchorProofDesc,
                          media_urls: newAnchorProofMediaUrl ? [newAnchorProofMediaUrl] : [],
                        }
                      ]
                    };

                    const res = await DropimusAPI.addClaimEvidence(claim.id, payload, accessToken);
                    if (res && res.success) {
                      setEvidenceSuccess(true);
                      setNewAnchorProofTitle('');
                      setNewAnchorProofDesc('');
                      setNewAnchorProofMediaUrl('');
                      setUpgradeTier('');
                      setEvidenceError('');
                      fetchAnchorEvidence();
                      setTimeout(() => {
                        setAddingAnchorEvidence(false);
                        setEvidenceSuccess(false);
                      }, 2000);
                    } else {
                      setEvidenceError(res?.detail || "Could not save evidence on the backend.");
                    }
                  } catch (err: any) {
                    setEvidenceError(err?.message || "Failed to submit evidence.");
                  }
                }}
                style={{
                  flex: 2,
                  padding: '8px',
                  fontSize: '12px',
                  background: C.blueLight,
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Register Evidence
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolution countdown timer */}
      <div style={{ marginBottom: '18px' }}>
        <CountdownTimer daysLeft={claim.daysLeft} status={claim.status} />
      </div>

      {/* 3. Live analysis market ring (with the giant animated Sentiment Orb) */}
      <div
        style={{
          background: C.card,
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          border: `1px solid ${C.border}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Credibility Market
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isClaimLive(claim.status) ? '#10B981' : C.sub }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isClaimLive(claim.status) ? '#10B981' : C.sub, boxShadow: isClaimLive(claim.status) ? '0 0 8px #10B981' : 'none' }} />
            {isClaimLive(claim.status) ? 'Live' : 'Settled'}
          </span>
        </div>

        {/* Credibility market — believe vs doubt price lines */}
        <div style={{ width: '100%', padding: '4px 0' }}>
          <MarketLines
            proven={claim.proven}
            faded={claim.faded}
            sampledCalls={claim.sampledCalls}
            capital={claim.capital}
            callers={claim.callers}
            large
            hasPositions={(totalProven + totalFaded) > 0}
            live={isClaimLive(claim.status)}
          />
        </div>

        <div style={{ width: '100%', height: '1px', background: C.hairline }} />

        {/* Staked values list */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div style={{ padding: '8px 10px', background: C.elevated, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              TOTAL USDC
            </div>
            <div style={{ fontFamily: FONTS.mono, color: C.goldBright, fontSize: '15px', fontWeight: 700 }}>
              ${claim.capital}
            </div>
          </div>

          <div style={{ padding: '8px 10px', background: C.elevated, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              TOTAL HONOR
            </div>
            <div style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '15px', fontWeight: 700 }}>
              {claim.honorStaked}⚡
            </div>
          </div>

          <div style={{ padding: '8px 10px', background: C.elevated, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              CALLERS
            </div>
            <div style={{ fontFamily: FONTS.mono, color: C.text, fontSize: '15px', fontWeight: 700 }}>
              {claim.callers}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Make a call accordion block */}
      {isClaimLive(claim.status) && (
        <div style={{ marginBottom: '24px' }}>
          {!walletConnected ? (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '24px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  border: `1px solid ${C.border2}`,
                }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <h4 style={{ color: C.text, fontFamily: FONTS.display, fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                Wallet Connection Required
              </h4>
              <p style={{ color: C.sub, fontSize: '11px', marginBottom: '16px', lineHeight: '1.4', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                You must connect an active Web3 wallet in order to sign consensus evaluations or stake predictions on-chain.
              </p>
              <button
                onClick={async () => {
                  const { getAppKit } = await import('../lib/walletAndGoogle');
                  const kit = await getAppKit();
                  if (kit) {
                    try {
                      kit.open();
                    } catch (e) {
                      console.warn("AppKit.open failed: ", e);
                    }
                  } else {
                    console.warn("Wallet connection unavailable.");
                  }
                }}
                className="px-6 py-2 rounded-xl text-xs font-bold text-black"
                style={{
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Connect Wallet
              </button>
            </div>
          ) : !makeCallExpanded ? (
            <Btn
              variant="primary"
              fullWidth
              style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => setMakeCallExpanded(true)}
            >
              <Zap size={14} fill="currentColor" /> Take Your Position
            </Btn>
          ) : (
            <div
              className="animate-fadeUp"
              style={{
                background: C.card,
                border: `1px solid ${C.blueLight}44`,
                borderRadius: '24px',
                padding: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ color: C.text, fontFamily: FONTS.display, fontSize: '15px', fontWeight: 700 }}>
                  Take Your Position
                </span>
                <span
                  onClick={() => setMakeCallExpanded(false)}
                  style={{ color: C.sub, fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </span>
              </div>

              {/* Step 1: Choose outcome side */}
              <div
                style={{
                  position: 'sticky',
                  top: '56px',
                  zIndex: 80,
                  background: C.card,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '12px',
                  margin: '0 -10px 16px -10px',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: C.blueBright, fontWeight: 800, letterSpacing: '0.08em' }}>
                    STEP 1: BELIEVE OR DOUBT (REQUIRED)
                  </span>
                  {!selectedSide && (
                    <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: 700, animation: 'pulse 1.5s infinite', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> SELECTION REQUIRED
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedSide('proven')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      background: selectedSide === 'proven' ? 'rgba(0, 82, 255, 0.15)' : 'transparent',
                      border: `2px solid ${selectedSide === 'proven' ? C.blueLight : C.border}`,
                      color: selectedSide === 'proven' ? C.blueBright : C.sub,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedSide === 'proven' ? '0 0 16px rgba(0, 82, 255, 0.25)' : 'none',
                    }}
                  >
                    BELIEVE
                  </button>
                  <button
                    onClick={() => setSelectedSide('faded')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      background: selectedSide === 'faded' ? 'rgba(217, 48, 80, 0.15)' : 'transparent',
                      border: `2px solid ${selectedSide === 'faded' ? C.faded : C.border}`,
                      color: selectedSide === 'faded' ? C.fadedBright : C.sub,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedSide === 'faded' ? '0 0 16px rgba(217, 48, 80, 0.25)' : 'none',
                    }}
                  >
                    DOUBT
                  </button>
                </div>
              </div>

              {/* Collateral & Reputation (Honor Explainer) Info box */}
              <div
                style={{
                  background: 'rgba(0, 82, 255, 0.04)',
                  border: '1px solid rgba(0, 82, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: C.sub,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '10px', color: C.text, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', letterSpacing: '0.04em' }}>
                  <Zap size={12} style={{ color: C.blueLight }} /> WHAT IS HONOR? (ON-CHAIN REP)
                </div>
                Honor (⚡) is your reputation rating on the protocol. Correct resolutions earn you **extra USDC yield plus a protocol-computed boost to your standard Honor** balance. Wrong evaluations result in both USDC loss and reputation decay. Your reputation delta is determined automatically by the protocol at settlement based on the capital you risk and your proof quality, preventing strategic optimization behavior.
              </div>

              {/* Step 2: Custom input limits or sliders */}
              <div
                style={{
                  padding: '14px',
                  background: C.elevated,
                  borderRadius: '12px',
                  border: `1px solid ${C.border}`,
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '10px' }}>
                  <span>CONVICTION (dUSD)</span>
                </div>

                {/* Capital stake presets */}
                <div>
                  <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '6px' }}>
                    Conviction amount (min $5 dUSD):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    {[5, 20, 50, 100, 250].map((val) => {
                      const isSel = capitalStake === val;
                      return (
                        <button
                          key={val}
                          onClick={() => {
                            setCapitalStake(val);
                            setCapitalStakeInput(String(val));
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: '8px',
                            background: isSel ? C.goldDim : 'transparent',
                            border: `1px solid ${isSel ? C.gold : C.border}`,
                            color: isSel ? C.goldBright : C.sub,
                            fontSize: '12px',
                            fontFamily: FONTS.mono,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ${val}
                        </button>
                      );
                    })}
                  </div>
                   <input
                    type="number"
                    step="any"
                    min="5"
                    value={capitalStakeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCapitalStakeInput(val);
                      if (val === '') {
                        setCapitalStake(0);
                      } else {
                        const numVal = parseFloat(val);
                        setCapitalStake(isNaN(numVal) ? 0 : numVal);
                      }
                    }}
                    placeholder="Custom USDC collateral amount (e.g. 500)"
                    style={{
                      width: '100%',
                      background: C.deep,
                      border: `1px solid ${capitalStake < 5 ? '#EF4444' : C.border}`,
                      borderRadius: '8px',
                      color: capitalStake < 5 ? '#EF4444' : '#ffffff',
                      fontSize: '13px',
                      padding: '8px 12px',
                      fontFamily: FONTS.mono,
                      outline: 'none',
                    }}
                  />
                  {capitalStake < 5 && (
                    <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '6px', fontFamily: FONTS.mono, fontWeight: 600 }}>
                      ✕ Minimum collateral to deposit is $5 USDC. Please increase your stake amount.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Evidential attachments proofs */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.1em' }}>
                    SUPPORTING EVIDENCE ({evidenceList.length} ADDED)
                  </span>
                  {!addingProof && (
                    <span
                      onClick={() => setAddingProof(true)}
                      style={{ fontSize: '11px', color: C.blueLight, fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Add Evidence
                    </span>
                  )}
                </div>

                {/* Adding evidence logic */}
                {addingProof && (
                  <div
                    style={{
                      background: C.deep,
                      border: `1px solid ${C.border}`,
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                        Proof Category (Applies Multiplier):
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {PROOF_TYPES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewProofType(t.id)}
                            style={{
                              flex: 1,
                              padding: '5px 2px',
                              borderRadius: '6px',
                              background: newProofType === t.id ? C.blueDim : 'transparent',
                              border: `1px solid ${newProofType === t.id ? C.blueLight : C.border}`,
                              color: newProofType === t.id ? C.blueLight : C.sub,
                              fontSize: '10px',
                              fontWeight: 600,
                            }}
                          >
                            {t.label} ({t.multiplier}x)
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                        Description (What does this prove?):
                      </label>
                      <textarea
                        rows={2}
                        value={newProofDesc}
                        onChange={(e) => setNewProofDesc(e.target.value)}
                        placeholder="Reference block hash, tx logs, announcements..."
                        style={{
                          width: '100%',
                          background: C.elevated,
                          border: `1px solid ${C.border}`,
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '6px 10px',
                          outline: 'none',
                          resize: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '4px' }}>
                        Verification URL (Optional):
                      </label>
                      <input
                        type="text"
                        value={newProofUrl}
                        onChange={(e) => setNewProofUrl(e.target.value)}
                        placeholder="https://..."
                        style={{
                          width: '100%',
                          background: C.elevated,
                          border: `1px solid ${C.border}`,
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '6px 10px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <span
                        onClick={() => setAddingProof(false)}
                        style={{ fontSize: '11px', color: C.sub, cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Cancel
                      </span>
                      <button
                        onClick={handleAddProofSubmit}
                        style={{
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Save Proof
                      </button>
                    </div>
                  </div>
                )}

                {/* Evidence loop list */}
                {evidenceList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {evidenceList.map((e, pi) => (
                      <div
                        key={pi}
                        style={{
                          background: C.deep,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          borderLeft: `3px solid ${getProofColor(e.type)}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: getProofColor(e.type) }}>
                          <span>{getProofTypeLabel(e.type).toUpperCase()}</span>
                          {e.url && <span style={{ fontFamily: FONTS.mono }}>{e.url}</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: C.text, marginTop: '2px' }}>{e.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: C.sub, fontSize: '11px', fontStyle: 'italic', padding: '6px 0' }}>
                    Opinion only without validated sources (forces multiplier to 0.02x).
                  </div>
                )}
              </div>

              {/* Step 4: Live multiplier math preview */}
              {honorStake >= 20 && (
                <div
                  style={{
                    background: C.blueDim,
                    border: `1px solid ${C.blueLight}33`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700 }}>
                      MULTIPLIED EVALUATION WEIGHT
                    </span>
                    <span style={{ color: C.text, fontSize: '11px' }}>
                      ${capitalStake} USDC locked · releases at settlement
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: C.blueLight }}>
                      Stronger evidence increases the honor you earn if proven right.
                    </span>
                  </div>
                </div>
              )}

              {/* Reminder selection indicator if user scrolled down and missed it */}
              {!selectedSide && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12.5px',
                    fontSize: '11px',
                    color: '#FF6B6B',
                    fontWeight: 600,
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>POSITION REQUIRED: Scroll to Step 1 at the top of the panel and choose BELIEVE or DOUBT to continue.</span>
                </div>
              )}

              {/* Submit trigger with color styling mapping based on selectedSide */}
              <Btn
                variant="primary"
                fullWidth
                disabled={!canSubmit}
                onClick={() => setShowConfirmModal(true)}
                style={{
                  background: selectedSide === 'faded' ? C.faded : C.blue,
                  boxShadow: `0 8px 24px ${selectedSide === 'faded' ? C.fadedGlow : C.blueGlow}`,
                }}
              >
                Take Position →
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* 5. Existing participants evaluations list */}
      <div>
        <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {claim.calls.length} PARTICIPANT CALLS · SORTED BY COMPLETED WEIGHT
        </div>

        {claim.calls.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Sort calls beforehand by completed weight Desc */}
            {[...claim.calls].sort((a,b)=> b.weight - a.weight).map((call, idx) => {
              const isExpanded = expandedCallIdx === idx;
              const isProvenSide = call.side === 'proven';

              return (
                <div
                  key={idx}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s ease',
                    borderColor: isExpanded ? `${C.blueLight}33` : C.border,
                  }}
                >
                  {/* Collapsed Top Header element */}
                  <div
                    onClick={() => toggleCallAccordion(idx)}
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Side color strip */}
                      <span
                        style={{
                          display: 'inline-block',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: isProvenSide ? C.blueDim : C.fadedDim,
                          color: isProvenSide ? C.blueBright : C.fadedBright,
                          border: `1px solid ${isProvenSide ? C.blueLight + '44' : C.faded + '44'}`,
                        }}
                      >
                        {call.side.toUpperCase()}
                      </span>
                      
                      <span style={{ fontFamily: FONTS.mono, fontSize: '12px', color: C.text }}>
                        {call.wallet}
                      </span>

                      <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
                        <TierBadge tier={call.tier} />
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 700, color: C.text }}>
                        {call.weight} Weight
                      </span>
                      <span style={{ color: C.sub, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanded evidence details panel */}
                  {isExpanded && (
                    <div
                      className="animate-fadeUp"
                      style={{
                        padding: '14px',
                        background: C.deep,
                        borderTop: `1px solid ${C.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {/* Stake values breakdown */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, background: C.elevated, borderRadius: '8px', padding: '8px' }}>
                          <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700 }}>
                            HONOR STAKED
                          </span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: '13px', color: C.blueLight, fontWeight: 700 }}>
                            {call.honorStaked}⚡
                          </span>
                        </div>

                        <div style={{ flex: 1, background: C.elevated, borderRadius: '8px', padding: '8px' }}>
                          <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700 }}>
                            CAPITAL STAKED
                          </span>
                          <span style={{ fontFamily: FONTS.mono, fontSize: '13px', color: C.goldBright, fontWeight: 700 }}>
                            ${call.capitalStaked} USDC
                          </span>
                        </div>
                      </div>

                      {/* Evidence attached details */}
                      <div>
                        <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, marginBottom: '6px' }}>
                          EVIDENTIAL SOURCES ATTACHED
                        </span>
                        {call.proofs && call.proofs.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {call.proofs.map((proof, pi) => (
                              <div
                                key={pi}
                                style={{
                                  background: C.card,
                                  borderRadius: '8px',
                                  padding: '8px 10px',
                                  border: `1px solid ${C.border}`,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: C.blueLight }}>
                                  <span>{getProofTypeLabel(proof.type).toUpperCase()}</span>
                                  {proof.url && (
                                    <a
                                      href={proof.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: C.goldBright, textDecoration: 'none' }}
                                    >
                                      Verify Hash ↗
                                    </a>
                                  )}
                                </div>
                                <p style={{ fontSize: '11px', color: C.text, marginTop: '2px' }}>
                                  {proof.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: C.sub, fontStyle: 'italic' }}>
                            No evidence validated. Calculated at baseline (0.02x multiplier).
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: C.sub }}>
            <div style={{ fontSize: '13px' }}>No calls on this claim currently. Be the first to evaluate!</div>
          </div>
        )}
      </div>

      {createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(5, 4, 8, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflow: 'hidden',
            opacity: showConfirmModal ? 1 : 0,
            visibility: showConfirmModal ? 'visible' : 'hidden',
            pointerEvents: showConfirmModal ? 'auto' : 'none',
            transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.22s ease',
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${selectedSide === 'proven' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(217, 48, 80, 0.3)'}`,
              borderRadius: '24px',
              maxWidth: '430px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              padding: '24px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transform: showConfirmModal ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(8px)',
              opacity: showConfirmModal ? 1 : 0,
              transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', flexShrink: 0, paddingBottom: '4px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${C.border}`,
                  marginBottom: '10px',
                }}
              >
                <PenTool size={18} style={{ color: C.blueLight }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: C.text, fontFamily: FONTS.display, margin: 0 }}>
                Verify & Broadcast Call
              </h3>
              <p style={{ fontSize: '11px', color: C.sub, marginTop: '4px', margin: 0 }}>
                Please review your stake commitment before submitting to BASE.
              </p>
            </div>

            {/* Scrollable Body Content */}
            <div
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingRight: '6px',
                marginRight: '-6px',
              }}
            >
              {/* Selected side banner */}
              <div
                style={{
                  background: selectedSide === 'proven' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 48, 80, 0.08)',
                  border: `1px solid ${selectedSide === 'proven' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(217, 48, 80, 0.2)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  YOUR POSITION
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    fontFamily: FONTS.display,
                    letterSpacing: '0.02em',
                    color: selectedSide === 'proven' ? '#10B981' : C.fadedBright,
                  }}
                >
                  CALL {selectedSide ? selectedSide.toUpperCase() : '...'}
                </div>
              </div>

              {/* Impact Details Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: C.sub, fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  BALANCE IMPACT SUMMARY
                </div>

                {/* Your conviction (real, exact) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.elevated, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, display: 'block' }}>Your conviction</span>
                    <span style={{ fontSize: '9px', color: C.sub }}>Locked in escrow until the claim resolves</span>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 800, color: C.goldBright }}>
                    ${capitalStake} dUSD
                  </div>
                </div>

                {/* Honest reward mechanic — no fabricated numbers */}
                <div style={{ background: C.deep, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px', fontSize: '11px', color: C.sub, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: '#10B981', fontWeight: 800 }}>If you're right</span>
                    <span>you recover your conviction plus a share of the opposing pool, and gain honor. Going against the current majority earns more.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: C.fadedBright, fontWeight: 800 }}>If you're wrong</span>
                    <span>your conviction goes to the side that was right, and some honor is slashed.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                <span>
                  Settlement is decided on-chain by stake-weighted consensus once the claim resolves.
                </span>
              </div>

              {/* Signing Progress Visualizer */}
              {signingStage !== 'idle' && (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${C.border}`,
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '10px', color: C.sub, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    TRANSACTION PROGRESS SECURED BY REOWN APPKIT
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Step 1: Approve */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '1.5px solid #10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: signingStage !== 'approve' ? 'rgba(16,185,129,0.15)' : 'transparent',
                          fontSize: '9px',
                          color: '#10B981',
                        }}
                      >
                        {signingStage !== 'approve' ? '✓' : '●'}
                      </div>
                      <span style={{ color: signingStage === 'approve' ? C.text : C.sub, fontWeight: signingStage === 'approve' ? 700 : 500 }}>
                        USDC Allowance Approval Limit
                      </span>
                    </div>

                    {/* Step 2: Deposit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `1.5px solid ${['idle', 'approve'].includes(signingStage) ? C.border : '#10B981'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: ['sign', 'complete'].includes(signingStage) ? 'rgba(16,185,129,0.15)' : 'transparent',
                          fontSize: '9px',
                          color: '#10B981',
                        }}
                      >
                        {['sign', 'complete'].includes(signingStage) ? '✓' : ['idle', 'approve'].includes(signingStage) ? '' : '●'}
                      </div>
                      <span style={{ color: signingStage === 'deposit' ? C.text : ['idle', 'approve'].includes(signingStage) ? C.sub : C.text, fontWeight: signingStage === 'deposit' ? 700 : 500 }}>
                        Conviction escrow deposit
                      </span>
                    </div>

                    {/* Step 3: Sign SBT Verdict Hash */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `1.5px solid ${signingStage === 'complete' ? '#10B981' : signingStage === 'sign' ? '#3B82F6' : C.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: signingStage === 'complete' ? 'rgba(16,185,129,0.15)' : 'transparent',
                          fontSize: '9px',
                          color: '#10B981',
                        }}
                      >
                        {signingStage === 'complete' ? '✓' : signingStage === 'sign' ? '●' : ''}
                      </div>
                      <span style={{ color: signingStage === 'sign' ? C.text : signingStage === 'complete' ? C.sub : C.sub, fontWeight: signingStage === 'sign' ? 700 : 500 }}>
                        SBT Verdict Cryptographic Alignment
                      </span>
                    </div>
                  </div>

                  {/* Progress Log output */}
                  <div
                    style={{
                      background: '#040406',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontFamily: FONTS.mono,
                      fontSize: '10px',
                      color: signingStage === 'complete' ? '#10B981' : C.blueLight,
                      lineHeight: '1.4',
                      textAlign: 'left',
                    }}
                  >
                    {signingMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div style={{ flexShrink: 0, borderTop: `1px solid rgba(255, 255, 255, 0.08)`, paddingTop: '16px', marginTop: 'auto' }}>
              {signingStage === 'idle' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: `1px solid ${C.border}`,
                      background: 'transparent',
                      color: C.text,
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Back & Modify
                  </button>
                  <button
                    disabled={capitalStake < 5}
                    onClick={handleTriggerTransactionSigning}
                    style={{
                      flex: 1.3,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: selectedSide === 'faded' ? C.faded : C.blue,
                      color: '#000000',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: capitalStake < 5 ? 'not-allowed' : 'pointer',
                      opacity: capitalStake < 5 ? 0.35 : 1,
                      boxShadow: `0 8px 24px ${selectedSide === 'faded' ? C.fadedGlow : C.blueGlow}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Confirm Position
                  </button>
                </div>
              ) : (
                <div style={{ textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: C.sub }}>
                  Transaction securing via Smart Contract...
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default ClaimDetailPage;
