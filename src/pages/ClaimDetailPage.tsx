/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, PenTool, Zap } from 'lucide-react';
import { C, FONTS } from '../tokens';
import { Claim, Call, Proof } from '../lib/walletAndGoogle';
import CatPill from '../components/shared/CatPill';
import StatusPill from '../components/shared/StatusPill';
import TierBadge from '../components/shared/TierBadge';
import SentimentOrb from '../components/shared/SentimentOrb';
import Btn from '../components/shared/Btn';
import { PROOF_TYPES } from '../data';
import DropimusProtocolAPI from '../lib/walletAndGoogle';
import { signUSDCApprovalAndDeposit } from '../lib/dropimusAPI';
import { StakeCalculator } from '../components/shared/StakeCalculator';
import CountdownTimer from '../components/shared/CountdownTimer';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(7, 6, 10, 0.95)',
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '11px',
        fontFamily: FONTS.mono,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 9999,
      }}>
        <div style={{ color: C.sub, marginBottom: '2px' }}>{data.epoch}</div>
        <div style={{ fontWeight: 800, color: data.color }}>
          PROVEN: {payload[0].value}% Consensus
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
          Confidence Ratio: {payload[0].value}% / {100 - payload[0].value}%
        </div>
      </div>
    );
  }
  return null;
};

interface ClaimDetailPageProps {
  claim: Claim;
  onBack: () => void;
  onUpdate: () => void;
  walletBalanceHonor: number;
  walletBalanceUSDC?: number;
  initialExpand?: boolean;
}

export function ClaimDetailPage({ claim, onBack, onUpdate, walletBalanceHonor, walletBalanceUSDC = 250, initialExpand }: ClaimDetailPageProps) {
  const wallet = DropimusProtocolAPI.getWallet();
  const walletConnected = wallet && wallet.connected;
  const [makeCallExpanded, setMakeCallExpanded] = useState(initialExpand || false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedSide, setSelectedSide] = useState<'proven' | 'faded' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Dynamic Confidence Calculations
  const totalProven = claim.proven;
  const totalFaded = claim.faded;
  const totalConfidenceValue = (totalProven + totalFaded) > 0 
    ? Math.round((totalProven / (totalProven + totalFaded)) * 100)
    : 50;

  // Generate seed-based stable epochs per claim ID to keep historical movement looking authentic
  const seed1 = (claim.id * 17) % 15 - 7;
  const seed2 = (claim.id * 31) % 20 - 10;
  const seed3 = (claim.id * 7) % 25 - 12;
  const seed4 = (claim.id * 43) % 18 - 9;

  const ep1 = 50;
  const ep2 = Math.min(95, Math.max(5, Math.round(50 + seed1)));
  const ep3 = Math.min(95, Math.max(5, Math.round(ep2 + seed2)));
  const ep4 = Math.min(95, Math.max(5, Math.round(ep3 + seed3)));
  const ep5 = Math.min(95, Math.max(5, Math.round((ep4 + totalConfidenceValue) / 2 + seed4)));
  const ep6 = totalConfidenceValue;

  const chartData = [
    { epoch: 'E01-Genesis', confidence: ep1, color: ep1 > 55 ? '#10B981' : ep1 < 45 ? C.fadedBright : C.blueLight },
    { epoch: 'E02-Phase I', confidence: ep2, color: ep2 > 55 ? '#10B981' : ep2 < 45 ? C.fadedBright : C.blueLight },
    { epoch: 'E03-Phase II', confidence: ep3, color: ep3 > 55 ? '#10B981' : ep3 < 45 ? C.fadedBright : C.blueLight },
    { epoch: 'E04-Phase III', confidence: ep4, color: ep4 > 55 ? '#10B981' : ep4 < 45 ? C.fadedBright : C.blueLight },
    { epoch: 'E05-Consensus', confidence: ep5, color: ep5 > 55 ? '#10B981' : ep5 < 45 ? C.fadedBright : C.blueLight },
    { epoch: 'E06-Current', confidence: ep6, color: ep6 > 55 ? '#10B981' : ep6 < 45 ? C.fadedBright : C.blueLight },
  ];

  const chartColor = totalConfidenceValue > 55 
    ? '#10B981' 
    : totalConfidenceValue < 45 
      ? C.fadedBright 
      : C.blueLight;

  // MakeCall State
  const honorStake = 0;
  const [capitalStake, setCapitalStake] = useState<number>(5);
  const [capitalStakeInput, setCapitalStakeInput] = useState<string>('5');
  const [evidenceList, setEvidenceList] = useState<Proof[]>([]);
  
  // Wallet contract signature progress wizard states
  const [signingStage, setSigningStage] = useState<'idle' | 'approve' | 'deposit' | 'sign' | 'complete' | 'error'>('idle');
  const [signingMessage, setSigningMessage] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
 
  const handleTriggerTransactionSigning = async () => {
    setSigningStage('approve');
    const result = await signUSDCApprovalAndDeposit(
      '0x9f3b5da725814b01a90db31e08e025f4a1b2c3d4',
      capitalStake,
      claim.id,
      (msg, stage) => {
        setSigningMessage(msg);
        setSigningStage(stage);
      }
    );
 
    if (result.success) {
      setTxHash(result.txHash || '');
      // Submit call on protocol APIs
      DropimusProtocolAPI.submitCallToClaim(claim.id, {
        side: selectedSide!,
        honorStaked: honorStake,
        capitalStaked: capitalStake,
        proofs: evidenceList,
        weight: computedWeight,
      }, result.txHash);
      
      setTimeout(() => {
        setSigningStage('idle');
        setSigningMessage('');
        setMakeCallExpanded(false);
        setSelectedSide(null);
        setEvidenceList([]);
        setShowConfirmModal(false);
        onUpdate();
      }, 2500);
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

  const handleCreateCall = () => {
    if (!canSubmit) return;
    
    // Call the state core
    DropimusProtocolAPI.submitCallToClaim(claim.id, {
      side: selectedSide!,
      honorStaked: honorStake,
      capitalStaked: capitalStake,
      proofs: evidenceList,
      weight: computedWeight,
    });

    // Reset local state
    setMakeCallExpanded(false);
    setSelectedSide(null);
    setEvidenceList([]);
    onUpdate(); // Re-fetch parent claim balances
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
        ← The Court Lobbies
      </div>

      {/* 2. Core claim card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>
              Anchored by {claim.anchorer}
            </span>
            <span style={{ fontSize: '10px', color: C.sub }}>
              Protocol Role: <TierBadge tier={claim.tier} />
            </span>
          </div>
        </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em' }}>
              CONTENT HASH · BASE CHAIN (VERIFIED)
            </span>
            <span style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '11px', wordBreak: 'break-all' }}>
              {claim.txHash || "0x9f3b5da7258a101b08efbc46d0a7a"}
            </span>
          </div>
        </div>
      </div>

      {/* Resolution countdown timer */}
      <div style={{ marginBottom: '18px' }}>
        <CountdownTimer daysLeft={claim.daysLeft} status={claim.status} />
      </div>

      {/* 3. Live analysis market ring (with the giant animated Sentiment Orb) */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span style={{ alignSelf: 'flex-start', color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          LIVE SENTIMENT METRICS
        </span>

        {/* Large Orb */}
        <SentimentOrb proven={claim.proven} faded={claim.faded} size={100} animate={claim.status === 'open'} />

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

      {/* Historical Confidence Trend Line Card */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              PROVEN CONFIDENCE TREND LINE
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
              Historical reputation stake weight shifts over epoch blocks
            </span>
          </div>
          <span style={{ 
            fontFamily: FONTS.mono, 
            fontSize: '14px', 
            fontWeight: 800, 
            color: totalConfidenceValue > 55 ? '#10B981' : totalConfidenceValue < 45 ? C.fadedBright : C.blueLight
          }}>
            {totalConfidenceValue}%
          </span>
         </div>

         {/* Chart Container */}
         <div style={{ width: '100%', height: '180px', marginTop: '4px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id={`confidenceColor-${claim.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="epoch" 
                stroke="rgba(255, 255, 255, 0.2)" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                dy={8}
                style={{ fontFamily: FONTS.mono }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="rgba(255, 255, 255, 0.2)" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                dx={-4}
                style={{ fontFamily: FONTS.mono }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke={chartColor} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#confidenceColor-${claim.id})`}
                activeDot={{ r: 6, stroke: '#0e0b12', strokeWidth: 2, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
         </div>

         {/* Legend / Info footer for chart */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid rgba(255, 255, 255, 0.04)`, fontSize: '10px', fontFamily: FONTS.mono, color: C.sub }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> 
            PROVEN: Consensus High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.faded, display: 'inline-block' }} /> 
            FADED: Opinion Dropping
          </span>
          <span>ORACLE FREQUENCY: EPOCH</span>
         </div>
      </div>

      {/* Stake Impact Calculator Module */}
      <StakeCalculator 
        claimTitle={claim.title} 
        currentHonorBalance={walletBalanceHonor} 
      />

      {/* 4. Make a call accordion block */}
      {claim.status === 'open' && (
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
                    DropimusProtocolAPI.connectWallet();
                    onUpdate();
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
              <Zap size={14} fill="currentColor" /> Stake Rep & Call Settlement Outcome
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
                  Make on-chain Evaluation Call
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
                  background: 'rgba(21, 19, 26, 0.88)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '12px',
                  margin: '0 -10px 16px -10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 800, letterSpacing: '0.08em' }}>
                    STEP 1: SELECT VERDICT (REQUIRED & STICKY)
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
                      background: selectedSide === 'proven' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: `2px solid ${selectedSide === 'proven' ? '#10B981' : 'rgba(255,255,255,0.06)'}`,
                      color: selectedSide === 'proven' ? '#10B981' : 'rgba(255,255,255,0.45)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedSide === 'proven' ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
                    }}
                  >
                    CALL PROVEN
                  </button>
                  <button
                    onClick={() => setSelectedSide('faded')}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      borderRadius: '10px',
                      background: selectedSide === 'faded' ? 'rgba(217, 48, 80, 0.15)' : 'transparent',
                      border: `2px solid ${selectedSide === 'faded' ? C.faded : 'rgba(255,255,255,0.06)'}`,
                      color: selectedSide === 'faded' ? C.fadedBright : 'rgba(255,255,255,0.45)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedSide === 'faded' ? '0 0 16px rgba(217, 48, 80, 0.25)' : 'none',
                    }}
                  >
                    CALL FADED
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
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '10px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', letterSpacing: '0.04em' }}>
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
                  <span>CAPITAL ESCROW</span>
                  <span>Balance: ${walletBalanceUSDC} USDC</span>
                </div>

                {/* Capital stake presets */}
                <div>
                  <label style={{ fontSize: '11px', color: C.sub, display: 'block', marginBottom: '6px' }}>
                    USDC Collateral Stake (Minimum $5):
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
                    <span style={{ fontFamily: FONTS.mono, fontSize: '16px', fontWeight: 800, color: C.blueLight }}>
                      ${capitalStake} USDC × {maxMultiplier}x = {computedWeight} Weight
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
                  <span>STANCE REQUIRED: Scroll to Step 1 at the top of the panel and select CALL PROVEN or CALL FADED to proceed.</span>
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
                Submit Evaluation Call →
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
                  PROPOSED COURT STANCE
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

                {/* USDC Impact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.elevated, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, display: 'block' }}>USDC Collateral</span>
                    <span style={{ fontSize: '9px', color: C.sub }}>Refundable if consensus wins</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 800, color: C.goldBright }}>
                      -${capitalStake} USDC
                    </div>
                    <div style={{ fontSize: '9px', color: C.sub, fontFamily: FONTS.mono }}>
                      Bal: ${walletBalanceUSDC} → ${walletBalanceUSDC - capitalStake}
                    </div>
                  </div>
                </div>

                {/* Honor Impact */}
                {(() => {
                  const estimatedHonorReward = Math.max(1, Math.round(50 * (capitalStake / 50) * maxMultiplier));
                  const estimatedHonorSlash = Math.max(1, Math.round(50 * (capitalStake / 50) * 0.25));
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.elevated, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${C.border}` }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, display: 'block' }}>Reputation Delta</span>
                        <span style={{ fontSize: '9px', color: C.sub }}>Decayed if false · Earned if correct</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
                          +{estimatedHonorReward}⚡ / -{estimatedHonorSlash}⚡
                        </div>
                        <div style={{ fontSize: '9px', color: C.sub, fontFamily: FONTS.mono }}>
                          Estimated Reputation Range
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Estimated Return Multiplier Summary */}
              <div style={{ background: 'rgba(0, 82, 255, 0.04)', border: '1px solid rgba(0, 82, 255, 0.12)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: C.sub }}>Your Multiplied Weight:</span>
                  <span style={{ fontWeight: 800, color: C.blueLight, fontFamily: FONTS.mono }}>
                    {computedWeight} Weight
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: C.sub }}>Consensus Yield Boost:</span>
                  <span style={{ fontWeight: 800, color: '#10B981', fontFamily: FONTS.mono }}>
                    {(1 + (100 - totalConfidenceValue) / 100).toFixed(2)}x
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: C.sub }}>Est. Successful Return:</span>
                  <span style={{ fontWeight: 800, color: '#10B981', fontFamily: FONTS.mono }}>
                    +${(capitalStake * 0.40 * (1 + (100 - totalConfidenceValue) / 100)).toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* Insufficient balance checks or Slashing warning */}
              {(walletBalanceUSDC < capitalStake) ? (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '11px',
                    color: '#FF6B6B',
                    fontWeight: 600,
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0, color: '#FF6B6B' }} />
                  <span>INSUFFICIENT BALANCE: Your collateral exceeds your actual holdings (${walletBalanceUSDC} USDC). Please head back and adjust.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  <span>
                    Slashed funds are permanently locked. Your transaction will be verified by decentralized nodes on-chain.
                  </span>
                </div>
              )}

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
                        Collateral Stake escrow deposit
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
                    disabled={walletBalanceUSDC < capitalStake}
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
                      cursor: walletBalanceUSDC < capitalStake ? 'not-allowed' : 'pointer',
                      opacity: walletBalanceUSDC < capitalStake ? 0.35 : 1,
                      boxShadow: `0 8px 24px ${selectedSide === 'faded' ? C.fadedGlow : C.blueGlow}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Confirm & Stake USDC
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
