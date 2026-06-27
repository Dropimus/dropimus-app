/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, Users, Coins, Clock } from 'lucide-react';
import { C, FONTS } from '../../tokens';
import CatPill from './CatPill';
import StatusPill from './StatusPill';
import TierBadge from './TierBadge';
import Btn from './Btn';
import { Claim } from '../../lib/walletAndGoogle';

interface ClaimCardProps {
  claim: Claim;
  onSelect: (claim: Claim) => void;
  onMakeCallClick: (claim: Claim) => void;
  key?: React.Key;
}

const shortAddr = (a: string) =>
  a && a.startsWith('0x') && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : (a || '');

const fmt = (n: number, currency = false): string => {
  const v = n || 0;
  if (v >= 1000) return `${currency ? '$' : ''}${(v / 1000).toFixed(1)}k`;
  return `${currency ? '$' : ''}${v}`;
};

export function ClaimCard({ claim, onSelect, onMakeCallClick }: ClaimCardProps) {
  // Real stake-weighted Believe/Doubt split (no fabricated values).
  const totalWeight = (claim.proven || 0) + (claim.faded || 0);
  const believePct = totalWeight > 0 ? Math.round(((claim.proven || 0) / totalWeight) * 100) : 0;
  const doubtPct = totalWeight > 0 ? 100 - believePct : 0;
  const hasPositions = totalWeight > 0;

  let accent = 'rgba(255,255,255,0.08)';
  if (claim.status === 'proven') accent = `${C.blueLight}44`;
  else if (claim.status === 'faded') accent = `${C.faded}44`;

  const anchorerLabel = shortAddr(claim.anchorer);

  return (
    <div
      onClick={() => onSelect(claim)}
      className="main-container glassmorphic"
      style={{
        border: `1px solid ${accent}`,
        borderRadius: '20px',
        padding: '16px',
        cursor: 'pointer',
        marginBottom: '14px',
        transition: 'all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.background = 'rgba(20, 20, 22, 0.45)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 1. Header: category + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <CatPill category={claim.category} />
        <StatusPill status={claim.status} daysLeft={claim.daysLeft} />
      </div>

      {/* 2. Claim statement */}
      <h3
        style={{
          fontFamily: FONTS.display,
          fontSize: '16px',
          fontWeight: 800,
          color: C.text,
          lineHeight: 1.35,
          marginBottom: '14px',
          letterSpacing: '-0.012em',
        }}
      >
        {claim.title}
      </h3>

      {/* 3. Believe vs Doubt — real consensus split */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
          {hasPositions ? (
            <>
              <span style={{ color: C.blueLight }}>Believe {believePct}%</span>
              <span style={{ color: C.fadedBright }}>{doubtPct}% Doubt</span>
            </>
          ) : (
            <span style={{ color: C.sub, fontWeight: 600 }}>No positions yet — be the first to weigh in</span>
          )}
        </div>
        <div style={{ width: '100%', height: '8px', borderRadius: '99px', overflow: 'hidden', display: 'flex', background: C.deep }}>
          {hasPositions ? (
            <>
              <div style={{ width: `${believePct}%`, background: C.blueLight }} />
              <div style={{ width: `${doubtPct}%`, background: C.faded }} />
            </>
          ) : (
            <div style={{ width: '100%', background: C.elevated }} />
          )}
        </div>
      </div>

      {/* 4. Key facts: stake · positions · time */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <Stat icon={<Coins size={12} />} label="Staked" value={fmt(claim.capital, true)} color={C.goldBright} />
        <Stat icon={<Users size={12} />} label="Positions" value={String(claim.callers || 0)} color={C.text} />
        {claim.daysLeft > 0 && claim.status === 'open' && (
          <Stat icon={<Clock size={12} />} label="Resolves" value={`${claim.daysLeft}d`} color={C.blueLight} />
        )}
      </div>

      {/* 5. Anchorer attribution (only when present) */}
      {anchorerLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '10px', color: C.faint }}>Anchored by</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: C.sub }}>{anchorerLabel}</span>
          {claim.tier && <TierBadge tier={claim.tier} />}
        </div>
      )}

      {/* 6. Actions */}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
        {claim.status === 'open' ? (
          <>
            <Btn
              variant="primary"
              style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => onMakeCallClick(claim)}
            >
              <Zap size={13} fill="currentColor" /> Take a Position
            </Btn>
            <Btn variant="secondary" style={{ flex: 1, padding: '10px' }} onClick={() => onSelect(claim)}>
              View Claim →
            </Btn>
          </>
        ) : claim.status === 'dead_zone' ? (
          <Banner text="Unresolved · Conviction Returned" tone="neutral" />
        ) : claim.status === 'proven' ? (
          <Banner text="Outcome: Proven ✓" tone="proven" />
        ) : claim.status === 'faded' ? (
          <Banner text="Outcome: Faded ✗" tone="faded" />
        ) : (
          <Btn variant="secondary" fullWidth style={{ padding: '10px' }} onClick={() => onSelect(claim)}>
            View Claim →
          </Btn>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.elevated,
        borderRadius: '10px',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, color: C.sub, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span style={{ color: C.faint }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontFamily: FONTS.mono, fontSize: '14px', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function Banner({ text, tone }: { text: string; tone: 'neutral' | 'proven' | 'faded' }) {
  const map = {
    neutral: { bg: C.elevated, border: C.border, color: C.sub },
    proven: { bg: C.blueDim, border: `${C.blueLight}33`, color: C.blueBright },
    faded: { bg: C.fadedDim, border: `${C.faded}33`, color: C.fadedBright },
  }[tone];
  return (
    <div
      style={{
        width: '100%',
        padding: '11px',
        background: map.bg,
        borderRadius: '10px',
        textAlign: 'center',
        border: `1px solid ${map.border}`,
        fontSize: '12px',
        fontFamily: FONTS.display,
        color: map.color,
        fontWeight: 800,
        letterSpacing: '0.06em',
      }}
    >
      {text}
    </div>
  );
}

export default ClaimCard;
