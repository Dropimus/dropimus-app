/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { C, FONTS } from '../../tokens';

interface ConvictionBarProps {
  proven: number;
  faded: number;
  /** Larger type + thicker bar for the claim detail view. */
  large?: boolean;
  /** Force the "no positions yet" empty state regardless of weights. */
  hasPositions?: boolean;
}

/**
 * Credibility-market sentiment as a two-sided conviction bar — Believe vs
 * Doubt, like a prediction market's odds. Replaces the old floating orb: a
 * market reads as a market, not a mood ring. Weights come from real capital-
 * weighted backend sentiment; an empty market renders an honest, quiet state.
 */
export function ConvictionBar({ proven, faded, large, hasPositions }: ConvictionBarProps) {
  const total = (proven || 0) + (faded || 0);
  const has = hasPositions ?? total > 0;
  const believePct = has ? Math.round((proven / total) * 100) : 50;
  const doubtPct = 100 - believePct;
  const believeLeads = believePct >= doubtPct;

  const pctSize = large ? '30px' : '22px';
  const labelSize = large ? '10px' : '9px';
  const barH = large ? '14px' : '10px';

  if (!has) {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
          <span style={{ fontFamily: FONTS.display, fontSize: pctSize, fontWeight: 800, color: C.sub, letterSpacing: '-0.02em' }}>
            No market yet
          </span>
          <span style={{ fontSize: labelSize, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.faint }}>
            Awaiting first position
          </span>
        </div>
        <div style={{ width: '100%', height: barH, borderRadius: '99px', background: C.deep, border: `1px dashed ${C.border}` }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Numbers row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '7px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: labelSize, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: believeLeads ? C.blueBright : C.sub }}>
            Believe
          </span>
          <span style={{ fontFamily: FONTS.display, fontSize: pctSize, fontWeight: 800, color: believeLeads ? C.blueBright : C.sub, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {believePct}%
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: labelSize, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: !believeLeads ? C.fadedBright : C.sub }}>
            Doubt
          </span>
          <span style={{ fontFamily: FONTS.display, fontSize: pctSize, fontWeight: 800, color: !believeLeads ? C.fadedBright : C.sub, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {doubtPct}%
          </span>
        </div>
      </div>

      {/* The market bar — two convictions meeting at a live divider */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: barH,
          borderRadius: '99px',
          overflow: 'hidden',
          background: C.deep,
          display: 'flex',
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: `${believePct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`,
            boxShadow: believeLeads ? `0 0 12px ${C.blueGlow}` : 'none',
            transition: 'width 0.5s cubic-bezier(0.2,0.9,0.2,1)',
          }}
        />
        <div
          style={{
            flex: 1,
            height: '100%',
            background: `linear-gradient(90deg, ${C.fadedDim}, ${C.faded})`,
            boxShadow: !believeLeads ? `0 0 12px ${C.fadedGlow}` : 'none',
            transition: 'width 0.5s cubic-bezier(0.2,0.9,0.2,1)',
          }}
        />
        {/* Divider marker at the price point */}
        {believePct > 2 && believePct < 98 && (
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              bottom: '-2px',
              left: `${believePct}%`,
              width: '2px',
              transform: 'translateX(-1px)',
              background: C.text,
              opacity: 0.85,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ConvictionBar;
