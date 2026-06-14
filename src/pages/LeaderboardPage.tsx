/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, Shield } from 'lucide-react';
import { C, FONTS } from '../tokens';
import TierBadge from '../components/shared/TierBadge';

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'foresight' | 'evaluation'>('foresight');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Top experts mock indices
  const foresightLeaders = [
    { rank: 1, wallet: "0x9f3b...a2c1", tier: "Steward", accuracy: "94%", activeHonor: "12,420 HP", score: "98.4" },
    { rank: 2, wallet: "0x2a1c...f9e3", tier: "Arbiter", accuracy: "89%", activeHonor: "4,103 HP", score: "89.2" },
    { rank: 3, wallet: "0x7f4a...b3d1", tier: "Analyst", accuracy: "81%", activeHonor: "1,240 HP", score: "81.6" },
    { rank: 4, wallet: "0xe21c...6b8f", tier: "Analyst", accuracy: "79%", activeHonor: "980 HP", score: "78.3" },
    { rank: 5, wallet: "0x4f1a...c5e2", tier: "Contributor", accuracy: "75%", activeHonor: "320 HP", score: "72.4" },
  ];

  const evaluationLeaders = [
    { rank: 1, wallet: "0xe21c...6b8f", tier: "Analyst", accuracy: "96%", activeHonor: "980 HP", score: "93.3" },
    { rank: 2, wallet: "0x9f3b...a2c1", tier: "Steward", accuracy: "93%", activeHonor: "12,420 HP", score: "91.8" },
    { rank: 3, wallet: "0x2a1c...f9e3", tier: "Arbiter", accuracy: "90%", activeHonor: "4,103 HP", score: "88.6" },
    { rank: 4, wallet: "0x7f4a...b3d1", tier: "Analyst", accuracy: "83%", activeHonor: "1,240 HP", score: "82.4" },
    { rank: 5, wallet: "0x8d4b...c1d2", tier: "Novice", accuracy: "78%", activeHonor: "95 HP", score: "69.1" },
  ];

  const currentLeaders = activeTab === 'foresight' ? foresightLeaders : evaluationLeaders;

  const renderRankingList = (leaders: typeof foresightLeaders) => {
    const getRankStyle = (rank: number) => {
      if (rank === 1) return { color: C.goldBright, border: `1.5px solid ${C.gold}`, background: 'rgba(245, 158, 11, 0.15)' };
      if (rank === 2) return { color: '#E2E8F0', border: '1.5px solid #94A3B8', background: 'rgba(148, 163, 184, 0.15)' };
      if (rank === 3) return { color: '#FDBA74', border: '1.5px solid #C2410C', background: 'rgba(194, 65, 12, 0.15)' };
      return { color: C.sub, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent' };
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {leaders.map((lead) => {
          const isRank1 = lead.rank === 1;
          return (
            <div
              key={lead.rank}
              style={{
                background: C.card,
                border: `1px solid ${isRank1 ? `${C.gold}55` : C.border}`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isRank1 ? `0 0 12px ${C.gold}1a` : 'none',
              }}
            >
              {/* Left detail rows */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: FONTS.mono,
                    ...getRankStyle(lead.rank),
                  }}
                >
                  {lead.rank}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: '13px', fontWeight: 600, color: C.text }}>
                      {lead.wallet}
                    </span>
                    <TierBadge tier={lead.tier} />
                  </div>
                  
                  <span style={{ fontSize: '11px', color: C.sub }}>
                    Accuracy: <span style={{ color: C.goldBright, fontWeight: 600 }}>{lead.accuracy}</span> · Total: <span style={{ color: C.blueLight }}>{lead.activeHonor}</span>
                  </span>
                </div>
              </div>

              {/* Right Score display */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: C.sub, fontSize: '8px', display: 'block', fontWeight: 700, letterSpacing: '0.04em' }}>
                  SCORE COEFF
                </span>
                <span style={{ fontFamily: FONTS.display, fontSize: `${isRank1 ? '24px' : '20px'}`, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                  {lead.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        PROTOCOL EXPERTS LEADERBOARD
      </div>

      {isDesktop ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: C.gold, fontSize: '10px', fontWeight: 800, fontFamily: FONTS.display, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={11} fill="currentColor" /> FORESIGHT SPECIALISTS
            </div>
            {renderRankingList(foresightLeaders)}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: C.blueLight, fontSize: '10px', fontWeight: 800, fontFamily: FONTS.display, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={11} fill="currentColor" /> EVALUATION EXPERTS
            </div>
            {renderRankingList(evaluationLeaders)}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Tab switches */}
          <div
            style={{
              display: 'flex',
              background: '#0D0C10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '99px',
              padding: '5px',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => setActiveTab('foresight')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '99px',
                background: activeTab === 'foresight' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                color: activeTab === 'foresight' ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                fontWeight: 800,
                fontSize: '12px',
                fontFamily: FONTS.display,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              Foresight Specialists
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '99px',
                background: activeTab === 'evaluation' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
                color: activeTab === 'evaluation' ? '#000000' : 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                fontWeight: 800,
                fontSize: '12px',
                fontFamily: FONTS.display,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              Evaluation Experts
            </button>
          </div>

          {/* 2. Ranking loop rendering */}
          {renderRankingList(currentLeaders)}
        </>
      )}
    </div>
  );
}
export default LeaderboardPage;
