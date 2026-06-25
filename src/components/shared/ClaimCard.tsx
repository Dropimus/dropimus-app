/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { C, FONTS } from '../../tokens';
import CatPill from './CatPill';
import StatusPill from './StatusPill';
import TierBadge from './TierBadge';
import SentimentOrb from './SentimentOrb';
import Btn from './Btn';
import { Claim } from '../../lib/walletAndGoogle';

interface ClaimCardProps {
  claim: Claim;
  onSelect: (claim: Claim) => void;
  onMakeCallClick: (claim: Claim) => void;
  key?: React.Key;
}

export function ClaimCard({ claim, onSelect, onMakeCallClick }: ClaimCardProps) {
  // Determine card border depending on settlement state
  let borderColor = C.border;
  if (claim.status === 'proven') {
    borderColor = `${C.blueLight}44`;
  } else if (claim.status === 'faded') {
    borderColor = `${C.faded}44`;
  }

  // Format quantities helper
  const formatQuantity = (n: number, isCurrency = false): string => {
    if (n >= 1000) return `${isCurrency ? '$' : ''}${(n / 1000).toFixed(1)}k`;
    return `${isCurrency ? '$' : ''}${n}`;
  };

  const formattedCapital = formatQuantity(claim.capital, true);
  const formattedHonor = formatQuantity(claim.honorStaked) + '⚡';

  return (
    <div
      onClick={() => onSelect(claim)}
      className="main-container glassmorphic"
      style={{
        border: `1px solid ${borderColor === C.border ? 'rgba(255, 255, 255, 0.08)' : borderColor}`,
        borderRadius: '24px',
        padding: '18px',
        cursor: 'pointer',
        marginBottom: '14px',
        transition: 'all 0.18s cubic-bezier(0.2, 0.9, 0.2, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor === C.border ? 'rgba(255, 255, 255, 0.08)' : borderColor;
        e.currentTarget.style.background = 'rgba(20, 20, 22, 0.45)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 1. Header category row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CatPill category={claim.category} />
          <span style={{ fontSize: '11px', color: C.sub, fontFamily: FONTS.mono, letterSpacing: '0.04em' }}>
            · {claim.chain.toUpperCase()} NETWORK
          </span>
        </div>
        <StatusPill status={claim.status} daysLeft={claim.daysLeft} />
      </div>

      {/* 2. Headline title */}
      <h3
        style={{
          fontFamily: FONTS.display,
          fontSize: '16px',
          fontWeight: 800,
          color: C.text,
          lineHeight: 1.35,
          marginBottom: '12px',
          letterSpacing: '-0.012em',
        }}
      >
        {claim.title}
      </h3>

      {/* 3. Anchorer footprint tracking */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
          }}
        />
        <span style={{ fontFamily: FONTS.mono, fontSize: '11px', color: C.sub, letterSpacing: '-0.02em' }}>
          {claim.anchorer}
        </span>
        <span style={{ color: C.faint, fontSize: '12px' }}>|</span>
        <TierBadge tier={claim.tier} />
      </div>

      {/* 4. Interactive canvas orb + nested micro statistics panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px' }}>
        {/* Sentiment Orb with live draw states */}
        <SentimentOrb proven={claim.proven} faded={claim.faded} size={76} animate={claim.status === 'open'} />

        {/* Triple micro statistics stacked rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Box 1: Locked Capital */}
          <div
            style={{
              padding: '6px 10px',
              background: C.goldDim,
              border: `1px solid ${C.gold}1B`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 700, color: C.sub, letterSpacing: '0.08em' }}>
              CAPITAL LOCKED
            </span>
            <span style={{ fontFamily: FONTS.mono, color: C.goldBright, fontSize: '13px', fontWeight: 700 }}>
              {formattedCapital}
            </span>
          </div>

          {/* Box 2: Honor stake weight */}
          <div
            style={{
              padding: '6px 10px',
              background: C.blueDim,
              border: `1px solid ${C.blueLight}15`,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 700, color: C.sub, letterSpacing: '0.08em' }}>
              HONOR WEIGHT
            </span>
            <span style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '13px', fontWeight: 700 }}>
              {formattedHonor}
            </span>
          </div>

          {/* Box 3: Call counts */}
          <div
            style={{
              padding: '6px 10px',
              background: C.elevated,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 700, color: C.sub, letterSpacing: '0.08em' }}>
              CALLERS COHORT
            </span>
            <span style={{ fontFamily: FONTS.mono, color: C.text, fontSize: '13px', fontWeight: 700 }}>
              {claim.callers}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Call actions or Settled headers */}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
        {claim.status === 'open' ? (
          <>
            <Btn
              variant="primary"
              style={{ flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => onMakeCallClick(claim)}
            >
              <Zap size={13} fill="currentColor" /> Make a Call
            </Btn>
            <Btn
              variant="secondary"
              style={{ flex: 1, padding: '9px' }}
              onClick={() => onSelect(claim)}
            >
              View Analysis →
            </Btn>
          </>
        ) : claim.status === 'dead_zone' ? (
          <div
            style={{
              width: '100%',
              padding: '10px',
              background: C.elevated,
              borderRadius: '10px',
              textAlign: 'center',
              border: `1px solid ${C.border}`,
              fontSize: '12px',
              color: '#3A3A5A',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Locked in Dead Zone · Verification is SettlePending
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              padding: '10px',
              background: claim.status === 'proven' ? C.blueDim : C.fadedDim,
              borderRadius: '10px',
              textAlign: 'center',
              border: `1px solid ${claim.status === 'proven' ? C.blueLight + '33' : C.faded + '33'}`,
              fontSize: '12px',
              fontFamily: FONTS.display,
              color: claim.status === 'proven' ? C.blueBright : C.fadedBright,
              fontWeight: 800,
              letterSpacing: '0.1em',
            }}
          >
            PROTOCOL OUTCOME: {claim.status.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
export default ClaimCard;
