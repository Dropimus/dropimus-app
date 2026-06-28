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

/**
 * The Dropimus credibility meter. Market sentiment rendered as a precision
 * instrument: a doubt → believe spectrum arc with a live needle riding the
 * scale, a glowing indicator, and a bold readout. A measurement device, not a
 * progress bar — it should read as the signature object of a credibility market.
 */
export function ConvictionGauge({ proven, faded, large, hasPositions, live = true }: ConvictionGaugeProps) {
  const uid = useId().replace(/:/g, '');
  const total = (proven || 0) + (faded || 0);
  const has = hasPositions ?? total > 0;
  const believePct = has ? Math.round((proven / total) * 100) : 50;
  const doubtPct = 100 - believePct;
  const believeLeads = believePct >= 50;

  // ── Geometry (semicircle, flat side down) ───────────────────────────────
  const W = 240;
  const R = 96;
  const cx = W / 2;
  const cy = 120;
  const strokeW = large ? 15 : 12;
  const p = believePct / 100;              // 0 = full doubt (left), 1 = full believe (right)
  const theta = Math.PI * (1 - p);         // π (left) → 0 (right)
  const mx = cx + R * Math.cos(theta);
  const my = cy - R * Math.sin(theta);

  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const VB_H = 128;

  const leadColor = !has ? C.sub : believeLeads ? C.blueBright : C.fadedBright;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: '100%', maxWidth: large ? '320px' : '260px', margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${VB_H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`spectrum-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: C.faded }} />
            <stop offset="38%" style={{ stopColor: C.fadedBright }} />
            <stop offset="50%" style={{ stopColor: C.sub }} />
            <stop offset="62%" style={{ stopColor: C.blueLight }} />
            <stop offset="100%" style={{ stopColor: C.blueBright }} />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dim track */}
        <path d={arc} fill="none" style={{ stroke: C.deep }} strokeWidth={strokeW + 3} strokeLinecap="round" />

        {/* Spectrum scale */}
        <path
          d={arc}
          fill="none"
          stroke={`url(#spectrum-${uid})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity={has ? 0.95 : 0.32}
        />

        {/* Tick marks just inside the arc */}
        {ticks.map((t) => {
          const a = Math.PI * (1 - t);
          const rIn = R - strokeW / 2 - 4;
          const rOut = R - strokeW / 2 - (t === 0.5 ? 12 : 9);
          return (
            <line
              key={t}
              x1={cx + rIn * Math.cos(a)}
              y1={cy - rIn * Math.sin(a)}
              x2={cx + rOut * Math.cos(a)}
              y2={cy - rOut * Math.sin(a)}
              style={{ stroke: C.text }}
              strokeOpacity={t === 0.5 ? 0.5 : 0.22}
              strokeWidth={t === 0.5 ? 1.6 : 1}
            />
          );
        })}

        {/* Glowing indicator riding the scale at the live reading */}
        {has && (
          <>
            <circle cx={mx} cy={my} r={large ? 11 : 9} style={{ fill: leadColor }} opacity={0.16} filter={`url(#glow-${uid})`}>
              {live && <animate attributeName="r" values={`${large ? 11 : 9};${large ? 14 : 12};${large ? 11 : 9}`} dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx={mx} cy={my} r={large ? 6.5 : 5.5} style={{ fill: C.canvas, stroke: leadColor }} strokeWidth={large ? 3 : 2.5} />
          </>
        )}

        {/* Central readout */}
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          style={{ fontFamily: FONTS.display, fontWeight: 800, fill: leadColor, letterSpacing: '-0.02em' }}
          fontSize={large ? 42 : 33}
        >
          {has ? `${believeLeads ? believePct : doubtPct}%` : '—'}
        </text>
        <text
          x={cx}
          y={cy - 11}
          textAnchor="middle"
          style={{ fontFamily: FONTS.body, fontWeight: 800, fill: C.sub, letterSpacing: '0.16em' }}
          fontSize={large ? 11 : 9.5}
        >
          {!has ? 'AWAITING FIRST POSITION' : believeLeads ? 'BELIEVE LEADS' : 'DOUBT LEADS'}
        </text>
      </svg>

      {/* End anchors of the scale */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: '0 2px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: large ? '11px' : '10px', fontWeight: 800, letterSpacing: '0.06em', color: !believeLeads && has ? C.fadedBright : C.faint, textTransform: 'uppercase' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.faded }} /> Doubt
          {has && <span style={{ fontFamily: FONTS.mono, color: C.sub, fontWeight: 600 }}>{doubtPct}%</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: large ? '11px' : '10px', fontWeight: 800, letterSpacing: '0.06em', color: believeLeads && has ? C.blueBright : C.faint, textTransform: 'uppercase' }}>
          {has && <span style={{ fontFamily: FONTS.mono, color: C.sub, fontWeight: 600 }}>{believePct}%</span>}
          Believe <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.blueLight }} />
        </span>
      </div>
    </div>
  );
}

export default ConvictionGauge;
