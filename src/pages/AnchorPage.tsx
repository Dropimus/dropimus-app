/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock, AlertTriangle, Zap, CheckCircle2, Shield, Rocket, ClipboardList,
  ArrowRight, ArrowLeft, Plus, X, Copy, Check, RefreshCw, Info, Wallet as WalletIcon,
} from 'lucide-react';
import { C, FONTS } from '../tokens';
import { IconParachute } from '../components/icons';
import { CLAIM_TYPES, METRICS, RELATIVE_WINDOWS, PROOF_TYPES } from '../data';
import Btn from '../components/shared/Btn';
import { Claim, getAppKit } from '../lib/walletAndGoogle';
import { DropimusAPI, signUSDCApprovalAndDeposit } from '../lib/dropimusAPI';
import { authFetch } from '../lib/authClient';

// ─── On-chain calldata helpers ──────────────────────────────────────────────
function encodeCalldata(selector: string, targetAddress: string, amountUnits: string | number): string {
  const cleanAddr = targetAddress.startsWith('0x') ? targetAddress.slice(2) : targetAddress;
  const paddedAddr = cleanAddr.toLowerCase().padStart(64, '0');
  const bigAmt = typeof amountUnits === 'number' ? BigInt(Math.round(amountUnits)) : BigInt(amountUnits);
  const paddedAmt = bigAmt.toString(16).padStart(64, '0');
  return selector + paddedAddr + paddedAmt;
}

function sanitizeEtherAddress(addr: string | null | undefined, fallback: string): string {
  if (!addr || typeof addr !== 'string') return fallback;
  const cleaned = addr.trim();
  if (cleaned.startsWith('0x')) {
    if (cleaned.length === 42) return cleaned;
    if (cleaned.length < 42) return '0x' + cleaned.slice(2).padEnd(40, '0');
    return cleaned.slice(0, 42);
  }
  return fallback;
}

const CATEGORIES = [
  { id: 'Airdrops', label: 'Airdrops', icon: IconParachute, blurb: 'Will an airdrop happen, and how big?' },
  { id: 'Accountability', label: 'Accountability', icon: ClipboardList, blurb: 'Will a team keep its promise?' },
  { id: 'Security', label: 'Security', icon: Shield, blurb: 'Is a protocol safe or at risk?' },
  { id: 'Projects', label: 'Projects', icon: Rocket, blurb: 'Will a project ship or hit a target?' },
  { id: 'Trust', label: 'Trust', icon: AlertTriangle, blurb: 'Is a claim or actor trustworthy?' },
];

const MIN_CAPITAL = 5;
const STEPS = ['Your claim', 'Terms', 'Review & anchor'];

interface AnchorPageProps {
  onAddClaim: (claim: Claim) => void;
  walletBalanceUSDC: number;
  wallet?: any;
}

export function AnchorPage({ onAddClaim, wallet }: AnchorPageProps) {
  const [step, setStep] = useState<number>(1); // 1 | 2 | 3
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Step 1 — the claim
  const [claimType, setClaimType] = useState<string>('binary');
  const [subject, setSubject] = useState<string>('');
  const [subjectB, setSubjectB] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Airdrops');
  const [selectedMetricId, setSelectedMetricId] = useState<string>('price');
  const [direction, setDirection] = useState<'above' | 'below' | 'equals'>('above');
  const [threshold, setThreshold] = useState<string>('');

  // Step 2 — terms
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  const [resolutionDateStr, setResolutionDateStr] = useState<string>(defaultDate.toISOString().split('T')[0]);
  const [capitalStake, setCapitalStake] = useState<number>(MIN_CAPITAL);
  const [capitalStakeInput, setCapitalStakeInput] = useState<string>(String(MIN_CAPITAL));
  const [evidenceTier, setEvidenceTier] = useState<'none' | 'soft' | 'hard'>('none');
  const [proofsList, setProofsList] = useState<any[]>([]);
  const [showAddProofForm, setShowAddProofForm] = useState<boolean>(false);
  const [proofType, setProofType] = useState<string>('on-chain');
  const [proofTitle, setProofTitle] = useState<string>('');
  const [proofContent, setProofContent] = useState<string>('');
  const [proofMediaUrl, setProofMediaUrl] = useState<string>('');

  // Step 3 — funding + signing
  const [signingStage, setSigningStage] = useState<'idle' | 'approve' | 'deposit' | 'sign' | 'complete' | 'error'>('idle');
  const [signingMessage, setSigningMessage] = useState<string>('');
  const [preflightState, setPreflightState] = useState<'idle' | 'checking' | 'not_ready' | 'approving' | 'ready'>('idle');
  const [preflightData, setPreflightData] = useState<any>(null);
  const [preflightError, setPreflightError] = useState<string>('');
  const [successClaimHash, setSuccessClaimHash] = useState<string>('');

  // ─── Wallet gate ───────────────────────────────────────────────────────────
  if (!wallet || !wallet.connected) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn" style={{ color: C.text, fontFamily: FONTS.body }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '36px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: C.deep, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `1px solid ${C.border}` }}>
            <Lock size={18} style={{ color: C.blueLight }} />
          </div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Connect a wallet to anchor</h2>
          <p style={{ color: C.sub, fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
            Anchoring a claim locks a small stake on Base. Google sign-in is read-only — link a wallet to put a claim forward.
          </p>
          <Btn variant="primary" fullWidth onClick={async () => { const kit = await getAppKit(); try { kit?.open(); } catch (e) { console.warn('AppKit.open failed:', e); } }}>
            Connect Wallet
          </Btn>
        </div>
      </div>
    );
  }

  // ─── Derived state ───────────────────────────────────────────────────────────
  const resolutionDateObject = new Date(resolutionDateStr);
  const daysUntilResolution = Math.ceil((resolutionDateObject.getTime() - Date.now()) / 86400000);
  const meetsTimeframeRule = daysUntilResolution >= 7 && daysUntilResolution <= 730;

  const currentMetric = METRICS[selectedMetricId as keyof typeof METRICS] || METRICS.price;
  const availableMetrics = Object.values(METRICS).filter((m) => m.availableFor.includes(claimType));
  const isBool = currentMetric.unit === 'BOOL';
  const isThresholdConfigured = isBool || (threshold !== '' && Number(threshold) > 0);

  const subjectOk = subject.trim().length >= 3 && (claimType !== 'comparative' || subjectB.trim().length >= 3);
  const step1Ok = subjectOk && isThresholdConfigured && !!selectedCategory;
  const step2Ok = meetsTimeframeRule && capitalStake >= MIN_CAPITAL && (evidenceTier === 'none' || proofsList.length > 0);

  const formattedThreshold = isBool
    ? 'happen'
    : `${currentMetric.unit === 'USD' ? '$' : ''}${threshold}${currentMetric.unit === '%' ? '%' : ''}`;
  const dirWord = direction === 'above' ? 'above' : direction === 'below' ? 'below' : 'exactly';

  const buildClaimStatement = (): string => {
    if (!subject) return 'Your claim will appear here as you fill it in';
    if (claimType === 'comparative') {
      const b = subjectB || '[other project]';
      return `${subject} will out-perform ${b} on ${currentMetric.label} (${dirWord} ${formattedThreshold}) by ${resolutionDateStr}`;
    }
    if (isBool) return `${subject} — ${currentMetric.label} will ${formattedThreshold} by ${resolutionDateStr}`;
    return `${subject}'s ${currentMetric.label} will be ${dirWord} ${formattedThreshold} by ${resolutionDateStr}`;
  };

  // Real example claims per category — illustrate what a good claim looks like.
  // Clicking one pre-fills the subject so newcomers aren't staring at a blank box.
  const EXAMPLE_CLAIMS: Record<string, { text: string; subject: string }[]> = {
    Airdrops: [
      { text: 'EigenLayer confirms a token airdrop before 2027', subject: 'EigenLayer' },
      { text: 'LayerZero’s next season converts points to a token by Q4', subject: 'LayerZero' },
    ],
    Accountability: [
      { text: 'Project X ships its roadmap milestone by its stated deadline', subject: 'Project X' },
      { text: 'A team unlocks no insider tokens before the cliff date', subject: 'Team X' },
    ],
    Security: [
      { text: 'Protocol Y has no exploit over the next 90 days', subject: 'Protocol Y' },
      { text: 'Bridge Z stays fully solvent through year-end', subject: 'Bridge Z' },
    ],
    Projects: [
      { text: 'Base passes 1M daily active addresses by Q4', subject: 'Base' },
      { text: 'A project mainnet launches before its promised date', subject: 'Project X' },
    ],
    Trust: [
      { text: 'Wallet 0x… is not an insider dump address', subject: 'Wallet 0x…' },
      { text: 'An influencer’s called token is not a paid promo', subject: 'Token X' },
    ],
  };
  const exampleClaims = EXAMPLE_CLAIMS[selectedCategory] || EXAMPLE_CLAIMS.Airdrops;

  const handleRelativeOptionSelect = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setResolutionDateStr(d.toISOString().split('T')[0]);
  };

  // ─── Evidence handlers ──────────────────────────────────────────────────────
  const addProof = () => {
    if (!proofTitle.trim() || !proofContent.trim()) return;
    setProofsList((prev) => [...prev, { proof_type: proofType, title: proofTitle.trim(), content: proofContent.trim(), media_urls: proofMediaUrl.trim() ? [proofMediaUrl.trim()] : [] }]);
    setProofTitle(''); setProofContent(''); setProofMediaUrl(''); setShowAddProofForm(false);
  };
  const removeProof = (idx: number) => setProofsList((prev) => prev.filter((_, i) => i !== idx));

  // ─── Preflight / funding ────────────────────────────────────────────────────
  const runPreflightCheck = async (stakeAmount: number) => {
    setPreflightState('checking');
    setPreflightError('');
    setPreflightData(null);
    try {
      const res = await authFetch(`/api/claims/preflight?amount=${stakeAmount}`);
      if (!res.ok) throw new Error(`Funding check failed (HTTP ${res.status})`);
      const json = await res.json();
      if (!json || json.success === false || !json.data) throw new Error(json?.detail || 'Funding check response invalid.');
      setPreflightData(json.data);
      setPreflightState(json.data.ready ? 'ready' : 'not_ready');
    } catch (err: any) {
      setPreflightState('not_ready');
      setPreflightError(err?.message || 'Funding check failed. Please try again.');
      setPreflightData(null);
    }
  };

  const goToReview = () => {
    if (!step2Ok) return;
    setStep(3);
    runPreflightCheck(capitalStake);
  };

  const handleApproveTreasury = async () => {
    if (!preflightData) return;
    setPreflightState('approving');
    setPreflightError('');
    try {
      const kit = await getAppKit();
      const provider = kit?.getWalletProvider() || (window as any).ethereum;
      if (!provider?.request) throw new Error('No active wallet provider found. Please reconnect your wallet.');
      const userAddr = sanitizeEtherAddress(wallet?.address || preflightData.address, preflightData.address);
      if (!preflightData.treasury_address || !preflightData.mock_usdc_address) throw new Error('Missing contract addresses from the backend.');
      const treasuryAddr = sanitizeEtherAddress(preflightData.treasury_address, preflightData.treasury_address);
      const mockUsdcAddr = sanitizeEtherAddress(preflightData.mock_usdc_address, preflightData.mock_usdc_address);
      const approveCalldata = encodeCalldata('0x095ea7b3', treasuryAddr, preflightData.required_units);
      const txHash = await provider.request({ method: 'eth_sendTransaction', params: [{ from: userAddr, to: mockUsdcAddr, data: approveCalldata }] });
      setPreflightError(`Approval sent (${txHash.slice(0, 12)}…). Confirming…`);
      await new Promise((r) => setTimeout(r, 6000));
      await runPreflightCheck(capitalStake);
    } catch (err: any) {
      setPreflightState('not_ready');
      setPreflightError(`Approval failed: ${err?.message || 'transaction rejected'}`);
    }
  };

  // ─── Anchor submit ──────────────────────────────────────────────────────────
  const handleFinalAnchorSubmit = async () => {
    if (!wallet?.address) { setSigningStage('error'); setSigningMessage('Connect your wallet to anchor a claim.'); return; }
    setSigningStage('approve');
    setSigningMessage('Preparing your on-chain stake…');
    try {
      const result = await signUSDCApprovalAndDeposit(wallet.address, capitalStake, 0, (msg, stage) => { setSigningMessage(msg); setSigningStage(stage); });
      if (!result.success) throw new Error(result.error || 'Transaction rejected');

      setSigningStage('sign');
      setSigningMessage('Recording your claim…');

      const payloadDate = new Date(resolutionDateStr).toISOString();
      const description = claimType === 'comparative'
        ? `${subject} will out-perform ${subjectB} on ${currentMetric.label} (${dirWord} ${formattedThreshold}) by ${resolutionDateStr}. Verified via ${currentMetric.source}.`
        : `${subject}'s ${currentMetric.label} will be ${dirWord} ${formattedThreshold} by ${resolutionDateStr}. Verified via ${currentMetric.source}.`;

      const payload = {
        title: buildClaimStatement(),
        description,
        category: selectedCategory.toLowerCase(),
        resolution_date: payloadDate,
        capital_stake: Number(capitalStake),
        proof_type: evidenceTier,
        proofs: evidenceTier === 'none' ? [] : proofsList.map((p) => ({ proof_type: p.proof_type, title: p.title, content: p.content, media_urls: p.media_urls || [] })),
      };

      const backendRes = await DropimusAPI.anchorClaim(payload);
      if (!backendRes?.success) throw new Error(backendRes?.detail || 'Backend rejected the claim.');

      const claimData = backendRes?.data || {};
      const realTxHash = claimData.anchor_tx_hash || claimData.content_hash || result.txHash || '';
      setSuccessClaimHash(realTxHash);

      // Refresh from backend (no fabricated local claim values).
      onAddClaim({} as Claim);
      setSigningStage('complete');
      setSigningMessage('Your claim is anchored.');
      setSubmitted(true);
    } catch (err: any) {
      setSigningStage('error');
      setSigningMessage(err?.message || 'Failed to anchor. Please try again.');
    }
  };

  const reset = () => {
    setStep(1); setSubmitted(false); setSubject(''); setSubjectB(''); setThreshold('');
    setCapitalStake(MIN_CAPITAL); setCapitalStakeInput(String(MIN_CAPITAL)); setEvidenceTier('none');
    setProofsList([]); setShowAddProofForm(false); setSigningStage('idle'); setSigningMessage('');
    setPreflightState('idle'); setPreflightData(null); setPreflightError(''); setSuccessClaimHash('');
  };

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn" style={{ color: C.text, fontFamily: FONTS.body }}>
        <div style={{ background: C.card, border: `1px solid ${C.blueLight}33`, borderRadius: '24px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: C.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', border: `1px solid ${C.blueLight}44` }}>
            <CheckCircle2 size={28} style={{ color: C.blueBright }} />
          </div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Claim anchored</h2>
          <p style={{ color: C.sub, fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
            Your stake is locked in escrow while the network confirms it on Base. It’ll appear in Claims shortly.
          </p>
          <div style={{ background: C.deep, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: C.sub, fontWeight: 600 }}>Your claim</span>
            <p style={{ fontSize: '13px', color: C.text, fontWeight: 600, marginTop: '4px', lineHeight: 1.4 }}>{buildClaimStatement()}</p>
            {successClaimHash && (
              <button
                onClick={() => { navigator.clipboard?.writeText(successClaimHash); setCopiedHash(true); setTimeout(() => setCopiedHash(false), 1500); }}
                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: C.blueLight, fontFamily: FONTS.mono, fontSize: '11px' }}
              >
                {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                {successClaimHash.slice(0, 10)}…{successClaimHash.slice(-8)}
              </button>
            )}
          </div>
          <Btn variant="primary" fullWidth onClick={reset}>Anchor another claim</Btn>
        </div>
      </div>
    );
  }

  // ─── Signing overlay ────────────────────────────────────────────────────────
  const signingActive = signingStage !== 'idle' && signingStage !== 'complete';

  // ─── Shells ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 pb-28 animate-fadeIn" style={{ color: C.text, fontFamily: FONTS.body }}>
      {/* Header + stepper */}
      <div style={{ paddingTop: '16px', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px' }}>Anchor a claim</h1>
        <p style={{ color: C.sub, fontSize: '13px', marginBottom: '18px' }}>State something that can be proven true or false by a date. Stake on it. The network decides.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '4px', borderRadius: '99px', background: active || done ? C.blueLight : C.elevated, transition: 'background 0.2s' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: active ? C.text : C.sub, letterSpacing: '0.02em' }}>
                  {done ? '✓ ' : `${n}. `}{label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live claim preview (steps 1-2) */}
      {step < 3 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '18px' }}>
          <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your claim, in plain English</span>
          <p style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 700, color: subject ? C.text : C.faint, marginTop: '6px', lineHeight: 1.4 }}>
            {buildClaimStatement()}
          </p>
        </div>
      )}

      {step === 1 && StepOne()}
      {step === 2 && StepTwo()}
      {step === 3 && StepThree()}

      {/* Signing modal */}
      {signingActive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px 24px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <RefreshCw className="animate-spin" size={28} style={{ color: C.blueLight, margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Confirming in your wallet</h3>
            <p style={{ color: C.sub, fontSize: '13px', lineHeight: 1.5 }}>{signingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Step 1: define the claim ────────────────────────────────────────────────
  function StepOne() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Section title="What kind of claim is this?" hint="Pick the area it belongs to.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={tile(active)}>
                  <Icon size={18} style={{ color: active ? C.blueLight : C.sub }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: active ? C.text : C.sub }}>{cat.label}</span>
                  <span style={{ fontSize: '10px', color: C.faint, lineHeight: 1.3 }}>{cat.blurb}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="How should it be measured?" hint="This keeps the outcome objective.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            {CLAIM_TYPES.map((t) => {
              const active = claimType === t.id;
              return (
                <button key={t.id} onClick={() => {
                  setClaimType(t.id);
                  const fit = Object.values(METRICS).filter((m) => m.availableFor.includes(t.id));
                  if (!fit.some((m) => m.id === selectedMetricId) && fit[0]) setSelectedMetricId(fit[0].id);
                }} style={tile(active)}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: active ? C.text : C.sub }}>{t.label}</span>
                  <span style={{ fontSize: '10px', color: C.faint, lineHeight: 1.3 }}>{t.example}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={claimType === 'comparative' ? 'Which two things are you comparing?' : 'What are you making a claim about?'}>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. a project, a team, a wallet" style={input} />
          {claimType === 'comparative' && (
            <input value={subjectB} onChange={(e) => setSubjectB(e.target.value)} placeholder="Compared against…" style={{ ...input, marginTop: '8px' }} />
          )}
          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: C.faint, fontWeight: 600 }}>Examples of good {selectedCategory.toLowerCase()} claims — tap to start from one:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {exampleClaims.map((ex) => (
                <button
                  key={ex.text}
                  onClick={() => setSubject(ex.subject)}
                  style={{ textAlign: 'left', background: C.deep, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '9px 12px', color: C.sub, fontSize: '12px', cursor: 'pointer', lineHeight: 1.4 }}
                >
                  “{ex.text}”
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="The exact condition" hint="What has to be true for the claim to resolve YES?">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select value={selectedMetricId} onChange={(e) => setSelectedMetricId(e.target.value)} style={{ ...input, flex: '1 1 140px' }}>
              {availableMetrics.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {!isBool && (
              <>
                <select value={direction} onChange={(e) => setDirection(e.target.value as any)} style={{ ...input, flex: '0 0 110px' }}>
                  <option value="above">is above</option>
                  <option value="below">is below</option>
                  <option value="equals">equals</option>
                </select>
                <input value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="value" inputMode="decimal" style={{ ...input, flex: '1 1 100px' }} />
              </>
            )}
          </div>
          <p style={{ fontSize: '11px', color: C.faint, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={12} /> Verified via {currentMetric.source}.
          </p>
        </Section>

        <Btn variant="primary" fullWidth disabled={!step1Ok} onClick={() => step1Ok && setStep(2)} style={{ padding: '13px' }}>
          Continue <ArrowRight size={15} />
        </Btn>
      </div>
    );
  }

  // ─── Step 2: terms ───────────────────────────────────────────────────────────
  function StepTwo() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Section title="When does it resolve?" hint="Between 7 days and 2 years from now.">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {RELATIVE_WINDOWS.map((w) => (
              <button key={w.days} onClick={() => handleRelativeOptionSelect(w.days)} style={chip}>{w.label}</button>
            ))}
          </div>
          <input type="date" value={resolutionDateStr} onChange={(e) => setResolutionDateStr(e.target.value)} style={input} />
          <p style={{ fontSize: '11px', marginTop: '8px', color: meetsTimeframeRule ? C.sub : C.fadedBright }}>
            {meetsTimeframeRule ? `Resolves in ${daysUntilResolution} days.` : 'Pick a date 7 days to 2 years out.'}
          </p>
        </Section>

        <Section title="How much do you want to stake?" hint={`Test dUSD on Base Sepolia. Minimum ${MIN_CAPITAL} dUSD.`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.goldBright }}>$</span>
            <input
              value={capitalStakeInput}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                setCapitalStakeInput(v);
                const n = parseFloat(v);
                setCapitalStake(Number.isFinite(n) ? n : 0);
              }}
              onBlur={() => { const n = Math.max(MIN_CAPITAL, parseFloat(capitalStakeInput) || MIN_CAPITAL); setCapitalStake(n); setCapitalStakeInput(String(n)); }}
              inputMode="decimal"
              style={{ ...input, fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '13px', color: C.sub, fontWeight: 600 }}>dUSD</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {[5, 25, 100, 500].map((v) => (
              <button key={v} onClick={() => { setCapitalStake(v); setCapitalStakeInput(String(v)); }} style={chip}>${v}</button>
            ))}
          </div>
          {capitalStake < MIN_CAPITAL && <p style={{ fontSize: '11px', color: C.fadedBright, marginTop: '8px' }}>Minimum stake is {MIN_CAPITAL} dUSD.</p>}
        </Section>

        <Section title="Back it with evidence (optional)" hint="Stronger evidence earns more honor when you’re proven right.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: proofsList.length || showAddProofForm ? '12px' : '0' }}>
            {([
              { id: 'none', label: 'No evidence', desc: 'Opinion only' },
              { id: 'soft', label: 'Soft proof', desc: 'Articles, posts' },
              { id: 'hard', label: 'Hard proof', desc: 'On-chain, docs' },
            ] as const).map((t) => {
              const active = evidenceTier === t.id;
              return (
                <button key={t.id} onClick={() => { setEvidenceTier(t.id); if (t.id === 'none') { setProofsList([]); setShowAddProofForm(false); } }} style={tile(active)}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: active ? C.text : C.sub }}>{t.label}</span>
                  <span style={{ fontSize: '10px', color: C.faint }}>{t.desc}</span>
                </button>
              );
            })}
          </div>

          {evidenceTier !== 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proofsList.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.deep, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.text, display: 'block' }}>{p.title}</span>
                    <span style={{ fontSize: '10px', color: C.sub }}>{PROOF_TYPES.find((pt) => pt.id === p.proof_type)?.label || p.proof_type}</span>
                  </div>
                  <button onClick={() => removeProof(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fadedBright }}><X size={15} /></button>
                </div>
              ))}

              {showAddProofForm ? (
                <div style={{ background: C.deep, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select value={proofType} onChange={(e) => setProofType(e.target.value)} style={input}>
                    {PROOF_TYPES.filter((pt) => pt.id !== 'none').map((pt) => <option key={pt.id} value={pt.id}>{pt.label}</option>)}
                  </select>
                  <input value={proofTitle} onChange={(e) => setProofTitle(e.target.value)} placeholder="Short title (e.g. Snapshot tx)" style={input} />
                  <textarea value={proofContent} onChange={(e) => setProofContent(e.target.value)} placeholder="Explain how this supports the claim" rows={2} style={{ ...input, resize: 'vertical' }} />
                  <input value={proofMediaUrl} onChange={(e) => setProofMediaUrl(e.target.value)} placeholder="Link (optional)" style={input} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn variant="primary" style={{ flex: 1, padding: '9px' }} disabled={!proofTitle.trim() || !proofContent.trim()} onClick={addProof}>Add</Btn>
                    <Btn variant="secondary" style={{ flex: 1, padding: '9px' }} onClick={() => setShowAddProofForm(false)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <Btn variant="ghost" fullWidth style={{ padding: '10px' }} onClick={() => setShowAddProofForm(true)}>
                  <Plus size={14} /> Add a piece of evidence
                </Btn>
              )}
              {proofsList.length === 0 && !showAddProofForm && (
                <p style={{ fontSize: '11px', color: C.fadedBright }}>Add at least one piece of evidence, or switch to “No evidence”.</p>
              )}
            </div>
          )}
        </Section>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn variant="secondary" style={{ flex: '0 0 auto', padding: '13px 18px' }} onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Btn>
          <Btn variant="primary" style={{ flex: 1, padding: '13px' }} disabled={!step2Ok} onClick={goToReview}>Review & anchor <ArrowRight size={15} /></Btn>
        </div>
      </div>
    );
  }

  // ─── Step 3: review + funding + anchor ───────────────────────────────────────
  function StepThree() {
    const hasBalance = !!preflightData?.has_balance;
    const hasAllowance = !!preflightData?.has_allowance;
    const ready = preflightState === 'ready';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Summary */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '18px' }}>
          <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>You're anchoring</span>
          <p style={{ fontFamily: FONTS.display, fontSize: '16px', fontWeight: 800, color: C.text, margin: '8px 0 16px', lineHeight: 1.4 }}>{buildClaimStatement()}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <SummaryItem label="Category" value={selectedCategory} />
            <SummaryItem label="Resolves" value={`${resolutionDateStr} (${daysUntilResolution}d)`} />
            <SummaryItem label="Your stake" value={`$${capitalStake} dUSD`} />
            <SummaryItem label="Evidence" value={evidenceTier === 'none' ? 'None' : `${evidenceTier} · ${proofsList.length} item${proofsList.length === 1 ? '' : 's'}`} />
          </div>
        </div>

        {/* Funding */}
        <div style={{ background: C.card, border: `1px solid ${ready ? C.blueLight + '44' : C.border}`, borderRadius: '18px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <WalletIcon size={15} style={{ color: C.blueLight }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>Funding check</span>
          </div>

          {preflightState === 'checking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.sub, fontSize: '13px' }}>
              <RefreshCw className="animate-spin" size={15} /> Checking your test dUSD on Base…
            </div>
          )}

          {preflightData && preflightState !== 'checking' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: C.sub }}>Your balance</span>
                <span style={{ fontFamily: FONTS.mono, color: hasBalance ? C.text : C.fadedBright }}>{Number(preflightData.balance_usdc ?? 0).toLocaleString()} dUSD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '14px' }}>
                <span style={{ color: C.sub }}>Needed for this stake</span>
                <span style={{ fontFamily: FONTS.mono, color: C.text }}>{Number(preflightData.required_usdc ?? capitalStake).toLocaleString()} dUSD</span>
              </div>

              {ready ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.blueBright, fontSize: '13px', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Funded and approved — ready to anchor.
                </div>
              ) : !hasBalance ? (
                <div style={{ background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: '12px', padding: '12px' }}>
                  <p style={{ fontSize: '12px', color: C.goldBright, fontWeight: 700, marginBottom: '4px' }}>You need more test dUSD</p>
                  <p style={{ fontSize: '12px', color: C.sub, lineHeight: 1.5 }}>
                    During testing, the Dropimus team funds wallets with test dUSD. Reach out to get topped up, then re-check below. (At mainnet launch this becomes real USDC on Base.)
                  </p>
                  <Btn variant="ghost" fullWidth style={{ padding: '9px', marginTop: '10px' }} onClick={() => runPreflightCheck(capitalStake)}><RefreshCw size={13} /> Re-check balance</Btn>
                </div>
              ) : !hasAllowance ? (
                <div>
                  <p style={{ fontSize: '12px', color: C.sub, lineHeight: 1.5, marginBottom: '10px' }}>
                    One-time approval: let the Dropimus escrow move {Number(preflightData.required_usdc ?? capitalStake).toLocaleString()} dUSD for this stake.
                  </p>
                  <Btn variant="primary" fullWidth style={{ padding: '11px' }} disabled={preflightState === 'approving'} onClick={handleApproveTreasury}>
                    {preflightState === 'approving' ? 'Approving…' : 'Approve dUSD'}
                  </Btn>
                </div>
              ) : null}
            </>
          )}

          {preflightError && <p style={{ fontSize: '11px', color: signingStage === 'error' ? C.fadedBright : C.sub, marginTop: '10px', lineHeight: 1.4 }}>{preflightError}</p>}
        </div>

        {signingStage === 'error' && (
          <div style={{ background: C.fadedDim, border: `1px solid ${C.faded}44`, borderRadius: '12px', padding: '12px', fontSize: '12px', color: C.fadedBright, display: 'flex', gap: '8px' }}>
            <AlertTriangle size={15} /> {signingMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn variant="secondary" style={{ flex: '0 0 auto', padding: '13px 18px' }} onClick={() => { setStep(2); setSigningStage('idle'); }}><ArrowLeft size={15} /> Back</Btn>
          <Btn variant="primary" style={{ flex: 1, padding: '13px' }} disabled={!ready} onClick={handleFinalAnchorSubmit}>
            <Zap size={15} fill="currentColor" /> Anchor claim · ${capitalStake} dUSD
          </Btn>
        </div>
      </div>
    );
  }
}

// ─── Small presentational helpers ──────────────────────────────────────────────
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 800, color: C.text, marginBottom: hint ? '2px' : '10px' }}>{title}</h3>
      {hint && <p style={{ fontSize: '12px', color: C.sub, marginBottom: '10px' }}>{hint}</p>}
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.deep, borderRadius: '10px', padding: '10px 12px' }}>
      <span style={{ fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>{label}</span>
      <span style={{ fontSize: '13px', color: C.text, fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  background: C.deep,
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '11px 12px',
  color: C.text,
  fontSize: '14px',
  fontFamily: FONTS.body,
  outline: 'none',
};

const chip: React.CSSProperties = {
  background: C.elevated,
  border: `1px solid ${C.border}`,
  borderRadius: '99px',
  padding: '6px 12px',
  color: C.sub,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const tile = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '4px',
  textAlign: 'left',
  background: active ? C.blueDim : C.deep,
  border: `1px solid ${active ? C.blueLight + '66' : C.border}`,
  borderRadius: '12px',
  padding: '12px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

export default AnchorPage;
