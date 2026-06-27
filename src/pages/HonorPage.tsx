/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, Shield, Settings, Scale, Link, AlertTriangle, Coins, TrendingUp, ChevronUp, ChevronDown, Award, Landmark, Trophy, Folder, Lock, CheckCircle2, RefreshCw, HelpCircle } from 'lucide-react';
import { C, FONTS } from '../tokens';
import { authFetch } from '../lib/authClient';
import { IconParachute } from '../components/icons';
import HonorRing from '../components/shared/HonorRing';
import { Wallet } from '../lib/walletAndGoogle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TermTooltip } from '../components/shared/TermTooltip';

interface HonorPageProps {
  wallet: Wallet;
}

export function HonorPage({ wallet }: HonorPageProps) {
  const [activeTab, setActiveTab] = useState<'honor' | 'capacity' | 'usdc'>('honor');
  const [showExplainer, setShowExplainer] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);
  const [usageData, setUsageData] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoadingUsage(true);
      try {
        const res = await authFetch('/api/me/usage');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setUsageData(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load backend usage parameters:", err);
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
  }, [wallet.balanceHonor]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cumulative USDC yield balance over time for chart representation
  const yieldChartData = [
    { date: '05-24', cumulativeYield: 0, label: 'Genesis' },
    { date: '05-28', cumulativeYield: 85, label: 'Release' },
    { date: '06-04', cumulativeYield: 455, label: 'Verdict Payout' },
    { date: '06-08', cumulativeYield: 405, label: 'Anchoring' },
    { date: '06-10', cumulativeYield: 385, label: 'Stake' },
  ];

  // Archetypal honor event examples
  const honorHistory = [
    { label: "Evaluation Reward (Base Token)", date: "2026-06-10", delta: "+10", isGain: true },
    { label: "Claim Anchored (Polymarket Airdrop)", date: "2026-06-08", delta: "-100", isGain: false },
    { label: "Outcome Verified Payout (Hyperliquid S1)", date: "2026-06-04", delta: "+450", isGain: true },
    { label: "Active Reputation Decay (-1%)", date: "2026-06-01", delta: "-3", isGain: false, isDecay: true },
  ];

  const usdcHistory = [
    { label: "Evaluation Stake (Base Token)", date: "2026-06-10", delta: "-20", isGain: false },
    { label: "Claim Anchoring deposit", date: "2026-06-08", delta: "-50", isGain: false },
    { label: "Outcome Verdict Payout (Hyperliquid S1)", date: "2026-06-04", delta: "+370", isGain: true },
    { label: "Evaluation stake release", date: "2026-05-28", delta: "+85", isGain: true },
  ];

  return (
    <div
      style={{
        maxWidth: isDesktop ? '1100px' : '560px',
        margin: '0 auto',
        padding: '0 16px 100px',
        animation: 'fadeUp 0.22s ease forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 10px' }}>
        REPUTATION CREDENTIALS GAUGE
        <TermTooltip term="honor" underline={false}>
          <HelpCircle size={10} style={{ color: '#10B981', cursor: 'pointer', verticalAlign: 'middle' }} />
        </TermTooltip>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1.2fr 1.1fr' : '1fr',
          gap: isDesktop ? '24px' : '0px',
          alignItems: 'start',
        }}
      >
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Interactive Honor Protocol Explainer Hover Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(0, 82, 255, 0.03) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setShowExplainer(!showExplainer)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: '8px', padding: '6px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Zap size={16} fill="#10B981" color="#10B981" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                DropimusHonor.sol Verified SBT Contract
              </span>
              <span style={{ fontSize: '10px', color: C.sub, display: 'block', marginTop: '2px' }}>
                {showExplainer ? 'Hide smart contract parameters' : 'Show soulbound reputation rules & thresholds'}
              </span>
            </div>
          </div>
          <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
            <span>{showExplainer ? 'COLLAPSE' : 'VIEW SPECS'}</span>
            {showExplainer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {showExplainer && (
          <div style={{ marginTop: '14px', fontSize: '12px', color: C.sub, lineHeight: '1.6', borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
            <p style={{ marginBottom: '10px', color: C.text }}>
              The <strong>DropimusHonor</strong> contract is a <strong>Soulbound, Non-Transferable (<TermTooltip term="sbt">SBT</TermTooltip>) <TermTooltip term="honor">reputation model</TermTooltip></strong>. Since <TermTooltip term="honor">Honor</TermTooltip> is cryptographically bound to your specific wallet, it cannot be transferred, sold, or pooled:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '14px', marginBottom: '12px' }}>
              <div style={{ background: C.deep, borderRadius: '10px', padding: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 800, color: C.goldBright, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  <Settings size={12} color={C.goldBright} /> CORE RULES
                </span>
                <ul style={{ paddingLeft: '12px', listStyleType: 'disc', fontSize: '11px', color: C.sub, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>No Token Decimals:</strong> Dealt exclusively in whole, non-fractional units.</li>
                  <li><strong>Zero-Floor Guarantee:</strong> Honor balance can never drop below zero.</li>
                  <li><strong>Inactivity Decay:</strong> idle accounts lose 1% daily computed via off-chain cron.</li>
                  <li><strong>Digital Apoptosis:</strong> Incorrect <TermTooltip term="consensus">consensus calls</TermTooltip> on <TermTooltip term="faded">Faded claims</TermTooltip> slash up to 25% of balance.</li>
                </ul>
              </div>
              <div style={{ background: C.deep, borderRadius: '10px', padding: '10px', border: `1px solid ${C.border}` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 800, color: C.blueLight, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  <Shield size={12} color={C.blueLight} /> THRESHOLDS & Tiers
                </span>
                <ul style={{ paddingLeft: '12px', listStyleType: 'disc', fontSize: '11px', color: C.sub, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Novice Tier:</strong> 0 - 149 <TermTooltip term="honor">Honor SBT</TermTooltip></li>
                  <li><strong>Contributor Tier:</strong> 150 - 799 <TermTooltip term="honor">Honor SBT</TermTooltip></li>
                  <li><strong>Analyst Tier:</strong> 800 - 3,499 <TermTooltip term="honor">Honor SBT</TermTooltip></li>
                  <li><strong>Arbiter Tier:</strong> 3,500 - 11,999 <TermTooltip term="honor">Honor SBT</TermTooltip></li>
                  <li><strong>Steward Tier:</strong> 12,000+ <TermTooltip term="honor">Honor SBT</TermTooltip></li>
                </ul>
              </div>
            </div>
            
            <div style={{ background: C.deep, borderRadius: '8px', padding: '10px', border: `1px solid ${C.border}`, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Coins size={12} style={{ marginTop: '2px', flexShrink: 0, color: C.blueLight }} />
                <span><strong>MIN_HONOR_TO_CALL = 20 SBT</strong>: You must possess a minimum balance of 20 SBT reputation to cast calls or submit proofs.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Scale size={13} style={{ marginTop: '2px', flexShrink: 0, color: C.goldBright }} />
                <span><strong>DEMOTION_BUFFER_BPS = 8,000 (80%)</strong>: Restricts arbitrary demotion. If reputation fluctuates due to decay, you only lose your tier if honor falls past 80% of that tier's floor.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link size={12} style={{ flexShrink: 0, color: C.sub }} />
                <span><strong>SOULBOUND CONTRACT ADDR:</strong> <code style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '10px' }}>0x7041B8d76D433Acc577f50e09c6e...</code></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Main credentials block */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.blueLight}33`,
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Circular SVG Ring */}
          <HonorRing honor={wallet.balanceHonor} tier={wallet.tier} size={120} />

          {/* Right tier meta limits descriptions */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: C.sub }}>
              Status: <span style={{ color: C.blueLight, fontWeight: 700 }}>Soulbound Wallet Guild</span>
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {wallet.tier} Rank
                <TermTooltip term="honor" underline={false}>
                  <HelpCircle size={11} style={{ color: C.blueLight, cursor: 'pointer' }} />
                </TermTooltip>
              </span>
              <span style={{ fontSize: '11px', fontFamily: FONTS.mono, color: C.blueLight }}>
                {wallet.balanceHonor} SBT
              </span>
            </div>

            {(() => {
              const currentHonor = wallet.balanceHonor;
              let prevFloor = 0;
              let nextTierName = "Contributor";
              let nextTierFloor = 150;
              
              if (currentHonor >= 12000) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ width: '100%', height: '4px', background: C.elevated, borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: C.gold }} />
                    </div>
                    <span style={{ fontSize: '10px', color: C.goldBright, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🏆 STEWARD TIER SECURED (Maximum Elite Class)
                    </span>
                  </div>
                );
              } else if (currentHonor >= 3500) {
                prevFloor = 3500;
                nextTierName = "Steward";
                nextTierFloor = 12000;
              } else if (currentHonor >= 800) {
                prevFloor = 800;
                nextTierName = "Arbiter";
                nextTierFloor = 3500;
              } else if (currentHonor >= 150) {
                prevFloor = 150;
                nextTierName = "Analyst";
                nextTierFloor = 800;
              }

              const relativePercent = Math.min(100, Math.max(5, ((currentHonor - prevFloor) / (nextTierFloor - prevFloor)) * 100));
              const gapToNext = nextTierFloor - currentHonor;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ width: '100%', height: '4px', background: C.elevated, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${relativePercent}%`, background: C.blueLight }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                    <span style={{ color: C.sub }}>
                      Progress to <strong style={{ color: C.gold }}>{nextTierName}</strong> ({nextTierFloor} SBT floor)
                    </span>
                    <span style={{ fontFamily: FONTS.mono, color: C.goldBright, fontWeight: 700 }}>
                      -{gapToNext} SBT
                    </span>
                  </div>

                  {/* Visual warning/approaching indicator when close to Steward (12,000 SBT) */}
                  {nextTierName === "Steward" && gapToNext <= 1500 ? (
                    <span style={{ 
                      fontSize: '9px', 
                      background: 'rgba(239, 68, 68, 0.12)', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      color: C.fadedBright, 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700, 
                      marginTop: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      width: 'fit-content'
                    }}>
                      <Award size={10} style={{ color: C.fadedBright }} /> STEWARD APPROACHING: Only {gapToNext} SBT needed!
                    </span>
                  ) : gapToNext <= 120 ? (
                    /* General close-to-threshold warning */
                    <span style={{ 
                      fontSize: '9px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.25)', 
                      color: '#10B981', 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 700, 
                      marginTop: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      width: 'fit-content'
                    }}>
                      <TrendingUp size={10} /> THRESHOLD NEAR: Only {gapToNext} SBT to trigger {nextTierName}!
                    </span>
                  ) : null}
                </div>
              );
            })()}
            <span style={{ fontSize: '10px', color: C.fadedBright, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} style={{ flexShrink: 0 }} /> <span>Active decay vector status: −1%/inactive days (calculated natively on-chain)</span>
            </span>
          </div>
        </div>

        <div style={{ height: '1px', background: C.hairline }} />

        {/* Dynamic credentials cards inside */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Foresight certificate */}
          <div
            style={{
              background: C.elevated,
              border: `1px solid ${C.blueLight}22`,
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              CONCORDANCE EVAL PROTOCOL
              <TermTooltip term="consensus" underline={false}>
                <HelpCircle size={10} style={{ color: C.blueLight, cursor: 'pointer' }} />
              </TermTooltip>
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '28px', fontWeight: 800, color: C.text }}>
                85
              </span>
              <span style={{ fontSize: '11px', color: C.blueLight, fontWeight: 700 }}>SBT SCORE</span>
            </div>
          </div>

          {/* Evaluation score certificate */}
          <div
            style={{
              background: C.elevated,
              border: `1px solid ${C.gold}22`,
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              DECISION TRUTH WEIGHT (HP)
              <TermTooltip term="honor" underline={false}>
                <HelpCircle size={10} style={{ color: C.goldBright, cursor: 'pointer' }} />
              </TermTooltip>
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '28px', fontWeight: 800, color: C.text }}>
                {wallet.balanceHonor}
              </span>
              <span style={{ fontSize: '11px', color: C.goldBright, fontWeight: 700 }}>SBT POWER</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. P&L collateral summary */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.gold}44`,
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.1em' }}>
            ON-CHAIN ESCROW DEPOSIT COLLATERAL
            <TermTooltip term="capital" underline={false}>
              <HelpCircle size={10} style={{ color: C.goldBright, cursor: 'pointer' }} />
            </TermTooltip>
          </span>
          <span style={{ fontSize: '12px', color: C.sub, marginTop: '2px' }}>
            Escrowed USDC <TermTooltip term="capital">staked</TermTooltip> across active <TermTooltip term="consensus">consensus cycles</TermTooltip>
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: FONTS.display, color: C.goldBright, fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
            +$385.00
          </span>
        </div>
      </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: isDesktop ? '14px' : '0px' }}>
          {/* 3. Transaction history logs tab toggler */}
          <div
        style={{
          display: 'flex',
          background: C.deep,
          border: `1px solid ${C.border}`,
          borderRadius: '99px',
          padding: '4px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('honor')}
          style={{
            flex: 1,
            padding: '10px 6px',
            borderRadius: '99px',
            background: activeTab === 'honor' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
            color: activeTab === 'honor' ? '#000000' : C.sub,
            border: 'none',
            fontWeight: 700,
            fontSize: '11px',
            fontFamily: FONTS.display,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={11} fill={activeTab === 'honor' ? '#000000' : 'none'} stroke={activeTab === 'honor' ? '#000000' : 'currentColor'} /> Ledger
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          style={{
            flex: 12,
            padding: '10px 6px',
            borderRadius: '99px',
            background: activeTab === 'capacity' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
            color: activeTab === 'capacity' ? '#000000' : C.sub,
            border: 'none',
            fontWeight: 700,
            fontSize: '11px',
            fontFamily: FONTS.display,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <Scale size={11} stroke={activeTab === 'capacity' ? '#000000' : 'currentColor'} /> Quota
        </button>
        <button
          onClick={() => setActiveTab('usdc')}
          style={{
            flex: 1,
            padding: '10px 6px',
            borderRadius: '99px',
            background: activeTab === 'usdc' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
            color: activeTab === 'usdc' ? '#000000' : C.sub,
            border: 'none',
            fontWeight: 700,
            fontSize: '11px',
            fontFamily: FONTS.display,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <TrendingUp size={11} stroke={activeTab === 'usdc' ? '#000000' : 'currentColor'} /> Yields
        </button>
      </div>

      {/* 4. Tab list results rendering */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeTab === 'honor' ? (
          honorHistory.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 600, display: 'block' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '10px', color: C.sub, fontFamily: FONTS.mono }}>
                  {item.date}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: item.isDecay ? '#444' : item.isGain ? C.blueLight : C.fadedBright,
                  }}
                >
                  {item.delta} SBT
                </span>
              </div>
            </div>
          ))
        ) : activeTab === 'capacity' ? (
          // DEDICATED PROTOCOL CAPACITY LIMITS & SPECS VIEW (USAGE.PY)
          loadingUsage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px' }}>
              <RefreshCw className="animate-spin text-emerald-400" size={24} />
              <span className="text-xs font-mono text-zinc-500">Querying live backend capacities...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Sandbox indicator if not connected */}
              {!localStorage.getItem('dropimus_jwt_access_token') && (
                <div style={{ padding: '10px 14px', background: 'rgba(230,193,92,0.06)', border: `1px solid rgba(230,193,92,0.15)`, borderRadius: '10px', fontSize: '11px', color: C.goldBright, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} />
                  <span>Showing fallback limits. Please sign in to synchronize real-time usage metrics.</span>
                </div>
              )}

              {/* Account Tier Display Card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} style={{ color: C.blueLight }} />
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>ACCOUNT TIER LEVEL</span>
                  <span style={{ fontSize: '16px', color: C.text, fontWeight: 900, display: 'block', textTransform: 'capitalize' }}>
                    {usageData?.account_tier?.name || wallet.tier || "Initiate Wallet"}
                  </span>
                </div>
              </div>

              {/* Daily Quota Limits progress indicators */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.text, letterSpacing: '0.04em' }}>DAILY WALLET CAPACITY USAGE</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(usageData?.daily_usage?.actions || [
                    { action: "Calls", used: 0, limit: 3, percent: 0, remaining: 3 },
                    { action: "Proofs", used: 0, limit: 3, percent: 0, remaining: 3 },
                    { action: "Labels", used: 0, limit: 15, percent: 0, remaining: 15 },
                    { action: "Actions", used: 0, limit: 50, percent: 0, remaining: 50 }
                  ]).map((act: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ fontWeight: 600, color: C.text }}>{act.action}</span>
                        <span style={{ fontFamily: FONTS.mono, color: C.sub }}>
                          Used {act.used} / {act.limit} ({act.remaining} left)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, act.percent)}%`, 
                            height: '100%', 
                            background: act.critical ? '#FF3D5A' : act.warning ? C.goldBright : C.blueLight,
                            borderRadius: '4px',
                            boxShadow: `0 0 8px ${act.critical ? '#FF3D5A' : act.warning ? C.goldBright : C.blueLight}80` 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {usageData?.daily_usage?.hours_remaining && (
                  <span style={{ fontSize: '10px', color: C.sub, fontFamily: FONTS.mono, textAlign: 'right', display: 'block', marginTop: '4px' }}>
                    Quota resets in {usageData.daily_usage.hours_remaining} hours.
                  </span>
                )}
              </div>

              {/* Monthly Honor Mint Caps */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.text, letterSpacing: '0.04em' }}>MONTHLY HONOR REPUTATION MINT LIMITS</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(usageData?.monthly_mint_caps?.categories || [
                    { category: "Airdrops", minted_this_month: 0, cap: 150.0, percent: 0 },
                    { category: "Crypto", minted_this_month: 0, cap: 250.0, percent: 0 },
                    { category: "Politics", minted_this_month: 0, cap: 100.0, percent: 0 },
                    { category: "Sports", minted_this_month: 0, cap: 50.0, percent: 0 }
                  ]).map((cap: any, index: number) => {
                    const CAT_ICONS: Record<string, React.ComponentType<any>> = {
                      Crypto: Coins,
                      Airdrops: IconParachute,
                      Politics: Landmark,
                      Sports: Trophy,
                    };
                    const IconComponent = CAT_ICONS[cap.category] || Folder;
                    return (
                      <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px', color: C.sub }}>
                          <IconComponent size={14} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, color: C.text }}>{cap.category}</span>
                              {cap.percent >= 80 && (
                                <span style={{ 
                                  fontSize: '8px', 
                                  background: 'rgba(239, 68, 68, 0.12)', 
                                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                                  color: C.fadedBright, 
                                  padding: '1px 4px', 
                                  borderRadius: '3px', 
                                  fontWeight: 700, 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.04em' 
                                }}>
                                  Near Cap Limit
                                </span>
                              )}
                            </div>
                            <span style={{ fontFamily: FONTS.mono, color: C.sub }}>
                              {cap.minted_this_month === "∞" ? "∞" : `${Math.round(cap.minted_this_month)} / ${cap.cap}`} SBT
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: cap.cap === "∞" ? '100%' : `${Math.min(100, cap.percent)}%`, 
                              height: '100%', 
                              background: cap.percent >= 80 ? C.fadedBright : C.blueLight, 
                              borderRadius: '4px' 
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Influence Staking thresholds */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Lock size={14} style={{ color: C.sub, marginBottom: '2px' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: C.sub, fontWeight: 700 }}>
                    STAKE CEILING / CALL
                    <TermTooltip term="capital" underline={false}>
                      <HelpCircle size={10} style={{ color: C.sub, cursor: 'pointer' }} />
                    </TermTooltip>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.text, fontFamily: FONTS.display }}>
                    {usageData?.influence_capacity?.max_stake_per_call === "∞" ? "∞ (Unlimited)" : `$${usageData?.influence_capacity?.max_stake_per_call || 100} USDC`}
                  </span>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Scale size={14} style={{ color: C.sub, marginBottom: '2px' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: C.sub, fontWeight: 700 }}>
                    TOTAL CAPACITY ALLOWED
                    <TermTooltip term="capital" underline={false}>
                      <HelpCircle size={10} style={{ color: C.sub, cursor: 'pointer' }} />
                    </TermTooltip>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: C.text, fontFamily: FONTS.display }}>
                    {usageData?.influence_capacity?.max_total_stake === "∞" ? "∞ (Unlimited)" : `$${usageData?.influence_capacity?.max_total_stake || 500} USDC`}
                  </span>
                </div>
              </div>

              {/* Informative note about Honor-weighted sentiment */}
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: `1px dashed rgba(59, 130, 246, 0.25)`, borderRadius: '12px', padding: '12px', fontSize: '11px', color: C.sub, display: 'flex', gap: '8px' }}>
                <Scale size={16} style={{ color: C.blueLight, flexShrink: 0 }} />
                <span>
                  <strong>Honor-Weighted Stake:</strong> Stakes are protocol-wide uncapped. Your capacity to shift consensus or sentiment scales directly with your accrued <strong>Honor (reputation)</strong>, not raw capital size.
                </span>
              </div>

              {/* operator upgrade card campaign */}
              {(usageData?.upgrade_nudge || {
                title: "Accelerate to Operator Tier",
                message: "You are currently running with basic evaluation capacities. Upgrade to unlock full validator power.",
                benefits: [
                  "Uncapped protocol staking — influence scales with your Honor",
                  "Gain full priority consensus weight on Base Mainnet",
                  "Unlock completely unlimited daily evaluation actions"
                ]
              }) && (
                <div 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(230,193,92,0.11) 0%, rgba(16,185,129,0.03) 100%)', 
                    border: `1px solid ${C.gold}55`, 
                    borderRadius: '16px', 
                    padding: '18px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Subtle ambient light */}
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '100px', height: '100px', background: `${C.gold}1a`, filter: 'blur(30px)', borderRadius: '50%' }} />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Zap size={14} style={{ color: C.goldBright }} fill={C.goldBright} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: C.goldBright, letterSpacing: '-0.01em' }}>
                      {usageData?.upgrade_nudge?.title || "Accelerate to Operator Tier"}
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: C.sub, lineHeight: 1.5, margin: 0 }}>
                    {usageData?.upgrade_nudge?.message || "You are currently running with basic evaluation capacities. Upgrade to unlock full validator power."}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
                    {(usageData?.upgrade_nudge?.benefits || [
                      "Uncapped protocol staking — influence scales with your Honor",
                      "Gain full priority consensus weight on Base Mainnet",
                      "Unlock completely unlimited daily evaluation actions"
                    ]).map((bf: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: C.sub }}>
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span>{bf}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    style={{
                      background: C.gold,
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textTransform: 'uppercase',
                      fontFamily: FONTS.display,
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.01)';
                      e.currentTarget.style.boxShadow = `0 0 12px ${C.gold}80`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>{usageData?.upgrade_nudge?.cta || "Upgrade Tier Level"}</span>
                  </button>
                </div>
              )}

            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Interactive vector Area Chart */}
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.gold}33`,
                borderRadius: '16px',
                padding: '16px',
                height: '240px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700, letterSpacing: '0.08em' }}>
                  YIELD TRAJECTORY CUMULATIVE BALANCE (USDC)
                </span>
                <span style={{ fontSize: '11px', fontFamily: FONTS.mono, color: C.goldBright, fontWeight: 700 }}>
                  Active Pool
                </span>
              </div>
              <div style={{ width: '100%', height: '170px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={yieldChartData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontFamily: FONTS.mono }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#888888', fontSize: 10, fontFamily: FONTS.mono }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#131118',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#888', fontFamily: FONTS.mono, fontSize: 10 }}
                      itemStyle={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeYield"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorYield)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List entries for context list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usdcHistory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '12px', color: C.text, fontWeight: 600, display: 'block' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '10px', color: C.sub, fontFamily: FONTS.mono }}>
                      {item.date}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: item.isGain ? C.goldBright : C.sub,
                      }}
                    >
                      {item.delta.startsWith('+') || item.delta.startsWith('-') ? item.delta : `${item.delta}`} USDC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
export default HonorPage;
