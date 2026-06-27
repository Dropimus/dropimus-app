/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap, Shield } from 'lucide-react';
import { C, FONTS } from '../tokens';
import TierBadge from '../components/shared/TierBadge';
import { DropimusAPI } from '../lib/dropimusAPI';

interface LeaderEntry {
  rank: number;
  wallet: string;
  tier: string;
  accuracy: string;
  activeHonor: string;
  score: string;
}

// Map a raw backend entry into the display shape, tolerating field-name variants
// and omitting anything the backend doesn't provide (never fabricated).
const shortAddr = (a: string) => (a && a.startsWith('0x') && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

const formatAccuracy = (v: any): string => {
  if (v === undefined || v === null || v === '') return '';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return String(v);
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct * 10) / 10}%`;
};

const formatHonor = (v: any): string => {
  if (v === undefined || v === null || v === '') return '';
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (Number.isNaN(n)) return String(v);
  return `${n.toLocaleString()} HP`;
};

const mapEntry = (e: any, i: number): LeaderEntry => {
  const score = e.score ?? e.credibility_score ?? e.coefficient ?? e.points;
  return {
    rank: e.rank ?? i + 1,
    wallet: e.username || e.display_name || shortAddr(e.address || e.wallet || e.wallet_address || ''),
    tier: e.tier || e.title || e.honor_status?.title || '',
    accuracy: formatAccuracy(e.accuracy ?? e.accuracy_pct ?? e.win_rate),
    activeHonor: formatHonor(e.active_honor ?? e.honor_balance ?? e.honor ?? e.honor_status?.balance),
    score: score !== undefined && score !== null ? String(Math.round(Number(score) * 10) / 10) : '',
  };
};

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'foresight' | 'evaluation'>('foresight');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);
  const [foresightLeaders, setForesightLeaders] = useState<LeaderEntry[]>([]);
  const [evaluationLeaders, setEvaluationLeaders] = useState<LeaderEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const [forecasters, anchors] = await Promise.all([
        DropimusAPI.getLeaderboard('top-forecasters'),
        DropimusAPI.getLeaderboard('top-anchors'),
      ]);
      if (cancelled) return;
      setForesightLeaders(forecasters.map(mapEntry));
      setEvaluationLeaders(anchors.map(mapEntry));
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const currentLeaders = activeTab === 'foresight' ? foresightLeaders : evaluationLeaders;

  const renderEmpty = (label: string) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '28px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: '12px', color: C.sub, fontWeight: 600 }}>
        {isLoading ? 'Loading rankings…' : `No ${label} yet. Rankings appear once the protocol has activity.`}
      </span>
    </div>
  );

  const renderRankingList = (leaders: LeaderEntry[]) => {
    if (leaders.length === 0) return renderEmpty('rankings');
    const getRankStyle = (rank: number) => {
      if (rank === 1) return { color: C.goldBright, border: `1.5px solid ${C.gold}`, background: 'rgba(245, 158, 11, 0.15)' };
      if (rank === 2) return { color: '#E2E8F0', border: '1.5px solid #94A3B8', background: 'rgba(148, 163, 184, 0.15)' };
      if (rank === 3) return { color: '#FDBA74', border: '1.5px solid #C2410C', background: 'rgba(194, 65, 12, 0.15)' };
      return { color: C.sub, border: `1px solid ${C.border}`, background: 'transparent' };
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
                      {lead.wallet || '—'}
                    </span>
                    {lead.tier && <TierBadge tier={lead.tier} />}
                  </div>

                  {(lead.accuracy || lead.activeHonor) && (
                    <span style={{ fontSize: '11px', color: C.sub }}>
                      {lead.accuracy && <>Accuracy: <span style={{ color: C.goldBright, fontWeight: 600 }}>{lead.accuracy}</span></>}
                      {lead.accuracy && lead.activeHonor && ' · '}
                      {lead.activeHonor && <>Total: <span style={{ color: C.blueLight }}>{lead.activeHonor}</span></>}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Score display */}
              {lead.score && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: C.sub, fontSize: '8px', display: 'block', fontWeight: 700, letterSpacing: '0.04em' }}>
                    SCORE COEFF
                  </span>
                  <span style={{ fontFamily: FONTS.display, fontSize: `${isRank1 ? '24px' : '20px'}`, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {lead.score}
                  </span>
                </div>
              )}
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
        CREDIBILITY LEADERBOARD
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
              <Zap size={11} fill="currentColor" /> TOP BELIEVERS
            </div>
            {renderRankingList(foresightLeaders)}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: C.blueLight, fontSize: '10px', fontWeight: 800, fontFamily: FONTS.display, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={11} fill="currentColor" /> TOP RESEARCHERS
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
              background: C.deep,
              border: `1px solid ${C.border}`,
              borderRadius: '99px',
              padding: '4px',
              marginBottom: '20px',
            }}
          >
            <button
               onClick={() => setActiveTab('foresight')}
               style={{
                 flex: 1,
                 padding: '10px 14px',
                 borderRadius: '99px',
                 background: activeTab === 'foresight' ? C.elevated : 'transparent',
                 color: activeTab === 'foresight' ? '#ffffff' : C.sub,
                 border: activeTab === 'foresight' ? `1px solid ${C.border2}` : '1px solid transparent',
                 fontWeight: activeTab === 'foresight' ? 700 : 550,
                 fontSize: '12px',
                 fontFamily: FONTS.display,
                 cursor: 'pointer',
                 textAlign: 'center',
                 transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
               }}
             >
               Top Believers
             </button>
             <button
               onClick={() => setActiveTab('evaluation')}
               style={{
                 flex: 1,
                 padding: '10px 14px',
                 borderRadius: '99px',
                 background: activeTab === 'evaluation' ? C.elevated : 'transparent',
                 color: activeTab === 'evaluation' ? '#ffffff' : C.sub,
                 border: activeTab === 'evaluation' ? `1px solid ${C.border2}` : '1px solid transparent',
                 fontWeight: activeTab === 'evaluation' ? 700 : 550,
                 fontSize: '12px',
                 fontFamily: FONTS.display,
                 cursor: 'pointer',
                 textAlign: 'center',
                 transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
               }}
             >
               Top Researchers
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
