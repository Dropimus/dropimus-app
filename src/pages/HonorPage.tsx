/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, Shield, Settings, Scale, Link, AlertTriangle, Coins, TrendingUp, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { C, FONTS } from '../tokens';
import HonorRing from '../components/shared/HonorRing';
import { Wallet } from '../lib/walletAndGoogle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface HonorPageProps {
  wallet: Wallet;
}

export function HonorPage({ wallet }: HonorPageProps) {
  const [activeTab, setActiveTab] = useState<'honor' | 'usdc'>('honor');
  const [showExplainer, setShowExplainer] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

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

  // Simulated history items
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
      <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '14px 0 10px' }}>
        REPUTATION CREDENTIALS GAUGE
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
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: '2px' }}>
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
          <div style={{ marginTop: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '12px' }}>
            <p style={{ marginBottom: '10px', color: C.text }}>
              The <strong>DropimusHonor</strong> contract is a <strong>Soulbound, Non-Transferable (SBT) reputation model</strong>. Since Honor is cryptographically bound to your specific wallet node, it cannot be transferred, sold, or pooled:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '14px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 800, color: C.goldBright, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  <Settings size={12} color={C.goldBright} /> CORE RULES
                </span>
                <ul style={{ paddingLeft: '12px', listStyleType: 'disc', fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>No Token Decimals:</strong> Dealt exclusively in whole, non-fractional units.</li>
                  <li><strong>Zero-Floor Guarantee:</strong> Honor balance can never drop below zero.</li>
                  <li><strong>Inactivity Decay:</strong> idle accounts lose 1% daily computed via off-chain cron.</li>
                  <li><strong>Digital Apoptosis:</strong> Incorrect consensus calls slash up to 25% of balance.</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 800, color: C.blueLight, letterSpacing: '0.04em', marginBottom: '6px' }}>
                  <Shield size={12} color={C.blueLight} /> THRESHOLDS & Tiers
                </span>
                <ul style={{ paddingLeft: '12px', listStyleType: 'disc', fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Novice Tier:</strong> 0 - 149 Honor SBT</li>
                  <li><strong>Contributor Tier:</strong> 150 - 799 Honor SBT</li>
                  <li><strong>Analyst Tier:</strong> 800 - 3,499 Honor SBT</li>
                  <li><strong>Arbiter Tier:</strong> 3,500 - 11,999 Honor SBT</li>
                  <li><strong>Steward Tier:</strong> 12,000+ Honor SBT</li>
                </ul>
              </div>
            </div>
            
            <div style={{ background: C.deep, borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                {wallet.tier} Rank
              </span>
              <span style={{ fontSize: '11px', fontFamily: FONTS.mono, color: C.blueLight }}>
                {wallet.balanceHonor} SBT
              </span>
            </div>
            <div style={{ width: '100%', height: '4px', background: C.elevated, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(5, (wallet.balanceHonor / 3500) * 100))}%`, background: C.blueLight }} />
            </div>
            <span style={{ fontSize: '10px', color: C.sub }}>
              Progress to next tier <strong style={{ color: C.gold }}>Arbiter</strong> (3,500 SBT minimum floor)
            </span>
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
            <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              CONCORDANCE EVAL PROTOCOL
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
            <span style={{ display: 'block', fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
              DECISION TRUTH WEIGHT (HP)
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
          <span style={{ fontSize: '9px', color: C.sub, fontWeight: 700, letterSpacing: '0.1em' }}>
            ON-CHAIN ESCROW DEPOSIT COLLATERAL
          </span>
          <span style={{ fontSize: '12px', color: C.sub, marginTop: '2px' }}>
            Escrowed USDC staked across active consensus cycles
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
          background: '#0F0F12',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '99px',
          padding: '4px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => setActiveTab('honor')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '99px',
            background: activeTab === 'honor' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
            color: activeTab === 'honor' ? '#000000' : 'rgba(255, 255, 255, 0.65)',
            border: 'none',
            fontWeight: 700,
            fontSize: '12px',
            fontFamily: FONTS.display,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={12} fill={activeTab === 'honor' ? '#000000' : 'none'} stroke={activeTab === 'honor' ? '#000000' : 'currentColor'} /> Honor Ledger
        </button>
        <button
          onClick={() => setActiveTab('usdc')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '99px',
            background: activeTab === 'usdc' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
            color: activeTab === 'usdc' ? '#000000' : 'rgba(255, 255, 255, 0.65)',
            border: 'none',
            fontWeight: 700,
            fontSize: '12px',
            fontFamily: FONTS.display,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <TrendingUp size={12} stroke={activeTab === 'usdc' ? '#000000' : 'currentColor'} /> USDC Yield History
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
