/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { C, FONTS } from '../../tokens';

interface ConvictionGaugeProps {
  proven: number;
  faded: number;
  /** Larger readout + thicker arc for the claim detail view. */
  large?: boolean;
  /** Force the "no positions yet" empty state regardless of weights. */
  hasPositions?: boolean;
  /** Pulse the indicator while the market is live. */
  live?: boolean;
}

// Point on the gauge arc for a given fraction p (0 = far left/doubt, 1 = far
// right/believe). The arc is the top semicircle, flat side down.
function pt(cx: number, cy: number, R: number, p: number) {
  const a = Math.PI * (1 - p);
  return { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
}

/**
 * The Dropimus credibility meter. Market sentiment as a precision instrument:
 * a doubt → believe spectrum arc that FILLS to the live credibility level, with
 * a luminous glow and a glowing reading head riding the scale. A measurement
 * device, not a progress bar — the signature object of a credibility market.
 */
export function ConvictionGauge({ proven, faded, large, hasPositions, live = true }: ConvictionGaugeProps) {
  const uid = useId().replace(/:/g, '');
  const total = (proven || 0) + (faded || 0);
  const has = hasPositions ?? total > 0;
  const believePct = has ? Math.round((proven / total) * 100) : 50;
  const doubtPct = 100 - believePct;
  const believeLeads = believePct >= 50;

  // ── Geometry ────────────────────────────────────────────────────────────
  const W = 240;
  const R = 96;
  const cx = W / 2;
  const cy = 120;
  const strokeW = large ? 16 : 13;
  const p = believePct / 100;
  const head = pt(cx, cy, R, p);

  const fullArc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const fillArc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${head.x} ${head.y}`;
  const VB_H = 128;

  const leadColor = !has ? C.sub : believeLeads ? C.blueBright : C.fadedBright;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: '100%', maxWidth: large ? '300px' : '188px', margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${VB_H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`spec-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: C.faded }} />
            <stop offset="34%" style={{ stopColor: C.fadedBright }} />
            <stop offset="50%" style={{ stopColor: '#9aa0aa' }} />
            <stop offset="66%" style={{ stopColor: '#FFFFFF' }} />
            <stop offset="100%" style={{ stopColor: '#FFFFFF' }} />
          </linearGradient>
          <filter id={`bloom-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`vig-${uid}`} cx="50%" cy="78%" r="62%">
            <stop offset="0%" style={{ stopColor: leadColor, stopOpacity: has ? 0.1 : 0 }} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Depth vignette behind the reading */}
        <rect x="0" y="0" width={W} height={VB_H} fill={`url(#vig-${uid})`} />

        {/* Dim track (the full scale) */}
        <path d={fullArc} fill="none" style={{ stroke: C.text }} strokeOpacity={0.1} strokeWidth={strokeW} strokeLinecap="round" />

        {/* Glow bloom of the filled portion */}
        {has && (
          <path d={fillArc} fill="none" stroke={`url(#spec-${uid})`} strokeWidth={strokeW} strokeLinecap="round" opacity={0.5} filter={`url(#bloom-${uid})`} />
        )}

        {/* Filled credibility level */}
        {has && (
          <path d={fillArc} fill="none" stroke={`url(#spec-${uid})`} strokeWidth={strokeW} strokeLinecap="round" />
        )}

        {/* Tick dots just outside the arc */}
        {ticks.map((t) => {
          const o = pt(cx, cy, R + strokeW / 2 + 6, t);
          return <circle key={t} cx={o.x} cy={o.y} r={t === 0.5 ? 1.8 : 1.3} style={{ fill: C.text }} fillOpacity={t === 0.5 ? 0.5 : 0.25} />;
        })}

        {/* Glowing reading head */}
        {has && (
          <>
            <circle cx={head.x} cy={head.y} r={large ? 12 : 10} style={{ fill: leadColor }} opacity={0.18} filter={`url(#bloom-${uid})`}>
              {live && <animate attributeName="r" values={`${large ? 12 : 10};${large ? 15 : 13};${large ? 12 : 10}`} dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx={head.x} cy={head.y} r={large ? 7 : 6} style={{ fill: C.canvas, stroke: leadColor }} strokeWidth={large ? 3 : 2.5} />
            <circle cx={head.x} cy={head.y} r={large ? 2.4 : 2} style={{ fill: leadColor }} />
          </>
        )}

        {/* Central readout — credibility level */}
        <text
          x={cx}
          y={cy - 28}
          textAnchor="middle"
          style={{ fontFamily: FONTS.display, fontWeight: 800, fill: leadColor, letterSpacing: '-0.02em' }}
          fontSize={large ? 44 : 36}
        >
          {has ? `${believePct}` : '—'}
          <tspan style={{ fontFamily: FONTS.display, fontWeight: 700, fill: C.sub }} fontSize={large ? 20 : 16}>{has ? '%' : ''}</tspan>
        </text>
        <text
          x={cx}
          y={cy - 9}
          textAnchor="middle"
          style={{ fontFamily: FONTS.body, fontWeight: 800, fill: C.sub, letterSpacing: '0.18em' }}
          fontSize={large ? 10.5 : 9}
        >
          {!has ? 'AWAITING FIRST POSITION' : believeLeads ? 'BELIEVE LEADS' : 'DOUBT LEADS'}
        </text>
      </svg>

      {/* End anchors of the scale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', padding: '0 4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: large ? '11px' : '9.5px', fontWeight: 800, letterSpacing: '0.05em', color: !believeLeads && has ? C.fadedBright : C.faint, textTransform: 'uppercase' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.faded }} /> Doubt
          {has && <span style={{ fontFamily: FONTS.mono, color: C.sub, fontWeight: 600 }}>{doubtPct}%</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: large ? '11px' : '9.5px', fontWeight: 800, letterSpacing: '0.05em', color: believeLeads && has ? C.text : C.faint, textTransform: 'uppercase' }}>
          {has && <span style={{ fontFamily: FONTS.mono, color: C.sub, fontWeight: 600 }}>{believePct}%</span>}
          Believe <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
        </span>
      </div>
    </div>
  );
}

export default ConvictionGauge;
