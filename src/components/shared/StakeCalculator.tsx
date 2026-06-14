/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, ShieldAlert, Sparkles, AlertCircle, Info } from 'lucide-react';
import { C, FONTS } from '../../tokens';

interface StakeCalculatorProps {
  claimTitle?: string;
  currentUSDCBalance?: number;
  currentHonorBalance?: number;
}

export function StakeCalculator({ claimTitle = "Active Position", currentUSDCBalance = 250, currentHonorBalance = 340 }: StakeCalculatorProps) {
  // Calculation State
  const [simCapital, setSimCapital] = useState<number>(50); // $ USDC
  const [simConsensus, setSimConsensus] = useState<number>(75); // % confidence level

  // Formulas for Peer-to-Peer Rep Consensus model:
  // Lower consensus (close call like 51%) rewards early adapters with higher yield multiplier.
  // Higher consensus (safe bets like 95%) yields smaller but safer rewards.
  const consensusMultiplier = 1 + (100 - simConsensus) / 100; // e.g., 75% consensus -> 1.25x
  
  // Potential Returns (SUCCESS)
  const potentialUsdcProfit = parseFloat((simCapital * 0.40 * consensusMultiplier).toFixed(2));
  
  // Honor earned/slashed is protocol-determined from capital stake:
  // honor_delta = base_reward * (capital_stake / avg_capital_stake)
  // Let's assume an average capital stake of 50.
  const simHonorScore = Math.max(1, Math.round(50 * (simCapital / 50)));
  const potentialHonorGained = Math.round(simHonorScore * 0.85 * consensusMultiplier);

  // Potential Losses (FAILURE)
  const potentialUsdcLoss = simCapital; // full loss under slash
  const potentialHonorSlashed = Math.round(simHonorScore * 0.25); // standard failure decay rate (25%)

  // Reward to Risk Ratio
  const ratio = potentialUsdcProfit > 0 ? (potentialUsdcProfit / potentialUsdcLoss).toFixed(2) : "0.00";

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: '24px',
        padding: '22px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Heading */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={14} color="#10B981" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
          <span style={{ color: C.sub, fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Consensus Risk & Yield Modeler
          </span>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 800, color: C.text, fontFamily: FONTS.display, display: 'block' }}>
          Stake Impact Calculator
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', display: 'block' }}>
          Project reputation yields, collateral risk tiers, and consensus multiplier rates.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Input 1: Target Capital Stake */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              Target Capital Stake
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 800, color: C.goldBright }}>
              ${simCapital} USDC
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={simCapital}
              onChange={(e) => setSimCapital(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: C.gold,
                height: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
            {[20, 50, 100, 250].map((val) => (
              <button
                key={val}
                onClick={() => setSimCapital(val)}
                style={{
                  flex: 1,
                  padding: '4px',
                  borderRadius: '6px',
                  background: simCapital === val ? C.goldDim : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${simCapital === val ? C.gold : C.border}`,
                  color: simCapital === val ? C.goldBright : C.sub,
                  fontSize: '10px',
                  fontFamily: FONTS.mono,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Input 2: Protocol-determined Reputation (Honor info block) */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              Protocol-Calculated Reputation Stake
            </span>
          </div>
          <p style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: '1.4', margin: 0 }}>
            Callers no longer choose their own Honor stake. To prevent strategic optimization and minimize game playing, the protocol automatically computes reputation delta at settlement: <code style={{ fontFamily: FONTS.mono, background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: '4px', color: C.blueLight }}>honor_delta = base_reward * (capital / avg_capital)</code>. Your reputation yields and decays scale directly with your actual monetary risk.
          </p>
        </div>

        {/* Input 3: Expected Final Consensus Confidence */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Consensus Level Odds
              <span style={{ fontSize: '8px', color: C.sub }}>(Oracle outcome odds)</span>
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 800, color: C.text }}>
              {simConsensus}% Consensus
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min="51"
              max="99"
              step="1"
              value={simConsensus}
              onChange={(e) => setSimConsensus(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#FFFFFF',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
          </div>
          {/* Help legend for consensus rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: C.sub, fontFamily: FONTS.mono, marginTop: '4px' }}>
            <span>51% (Controversial / High Yield)</span>
            <span>99% (Sure Bet / Low Multiplier)</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

      {/* Grid of Results: Yield vs Loss Slashes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        
        {/* Outcome A: SUCCESS CALCULATION */}
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.02)', 
            border: '1px solid rgba(16, 185, 129, 0.1)', 
            borderRadius: '16px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Target size={12} color="#10B981" />
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              VERDICT RESOLVED TRUE
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: C.sub }}>Capital Profit</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: '#10B981' }}>
              +${potentialUsdcProfit} <span style={{ fontSize: '10px', color: C.sub }}>USDC</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: C.sub }}>Reputation Gain</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '14px', fontWeight: 700, color: '#10B981' }}>
              +{potentialHonorGained}⚡ <span style={{ fontSize: '10px', color: C.sub }}>Honor</span>
            </div>
          </div>

          <div style={{ fontSize: '9px', color: 'rgba(16, 185, 129, 0.6)', lineHeight: '1.3' }}>
            * Stake returned in full + payout yield backed by losing pool slashes. Multiplier: {consensusMultiplier.toFixed(2)}x
          </div>
        </div>

        {/* Outcome B: Slashed / INCORRECT CALCULATION */}
        <div 
          style={{ 
            background: 'rgba(217, 48, 80, 0.02)', 
            border: `1px solid rgba(217, 48, 80, 0.1)`, 
            borderRadius: '16px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={12} color={C.fadedBright} />
            <span style={{ fontSize: '9px', fontWeight: 800, color: C.fadedBright, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              VERDICT RESOLVED FALSE
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: C.sub }}>Escrow Slashed</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.fadedBright }}>
              -${potentialUsdcLoss} <span style={{ fontSize: '10px', color: C.sub }}>USDC</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: C.sub }}>Rep Decay Rate</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: '14px', fontWeight: 700, color: C.fadedBright }}>
              -{potentialHonorSlashed}⚡ <span style={{ fontSize: '10px', color: C.sub }}>Honor</span>
            </div>
          </div>

          <div style={{ fontSize: '9px', color: 'rgba(217, 48, 80, 0.6)', lineHeight: '1.3' }}>
            * Collateral disbursed to winning stakers. Reputation decays by up to 25% of standard weight.
          </div>
        </div>

      </div>

      {/* Analysis Footer */}
      <div 
        style={{ 
          background: C.deep, 
          borderRadius: '12px', 
          border: `1px solid ${C.border}`,
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px'
        }}
      >
        <span style={{ color: C.sub, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Info size={12} color={C.sub} />
          Reward-to-Risk Ratio:
        </span>
        <span style={{ fontFamily: FONTS.mono, fontWeight: 800, color: Number(ratio) >= 0.5 ? '#10B981' : C.sub }}>
          1 : {ratio}
        </span>
      </div>
    </div>
  );
}

export default StakeCalculator;
