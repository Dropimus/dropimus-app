/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { C, FONTS } from '../../tokens';

interface SampledCall { side: 'proven' | 'faded'; stake: number }

interface MarketLinesProps {
  proven: number;
  faded: number;
  sampledCalls?: SampledCall[];
  capital?: number;
  callers?: number;
  large?: boolean;
  hasPositions?: boolean;
  live?: boolean;
}

// Believe = green (market "up"), Doubt = red (market "down").
const GREEN = '#10D9A0';
const GREEN_BRIGHT = '#34F0BE';
const RED = '#FF3D5A';
const RED_DEEP = '#D93050';

/**
 * Build the believe-share trajectory (0..100 per step) from real positions.
 * Seeds at the 50/50 prior (a market with no information), walks the sampled
 * positions accumulating capital per side, and anchors the final point to the
 * true current believe share — so the endpoints are always real, never invented.
 */
function buildSeries(calls: SampledCall[], believePct: number, has: boolean): number[] {
  if (!has) return [];
  const pts = [50];
  let b = 0;
  let d = 0;
  for (const c of calls) {
    if (c.side === 'proven') b += c.stake; else d += c.stake;
    const tot = b + d;
    if (tot > 0) pts.push((b / tot) * 100);
  }
  pts.push(believePct); // anchor the end to the authoritative current split
  return pts;
}

// Catmull-Rom → cubic bezier for a smooth, premium line.
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const fmtCap = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`);

/**
 * The Dropimus credibility market chart. Two price lines — Believe (green) vs
 * Doubt (red) — tracing how conviction formed across the market's positions.
 * Reads like a real prediction-market instrument.
 */
export function MarketLines({ proven, faded, sampledCalls = [], capital = 0, callers = 0, large, hasPositions, live = true }: MarketLinesProps) {
  const uid = useId().replace(/:/g, '');
  const total = (proven || 0) + (faded || 0);
  const has = hasPositions ?? total > 0;
  const believePct = has ? Math.round((proven / total) * 100) : 50;
  const series = buildSeries(sampledCalls, believePct, has);
  const believeLeads = believePct >= 50;

  // ── Geometry ────────────────────────────────────────────────────────────
  const W = large ? 360 : 320;
  const H = large ? 168 : 116;
  const padL = 8;
  const padR = 56;
  const padT = 14;
  const padB = 16;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = series.length;
  const X = (i: number) => padL + (n <= 1 ? innerW : (i / (n - 1)) * innerW);
  const Y = (v: number) => padT + (1 - v / 100) * innerH;

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sub }}>
        Market Sentiment
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: live && has ? GREEN_BRIGHT : C.sub }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: live && has ? GREEN_BRIGHT : C.sub, boxShadow: live && has ? `0 0 8px ${GREEN_BRIGHT}` : 'none' }} />
        {has ? (live ? 'Live' : 'Settled') : 'No market'}
      </span>
    </div>
  );

  if (n < 2) {
    // No positions yet — honest empty state, no invented line.
    return (
      <div style={{ width: '100%' }}>
        {header}
        <div style={{ position: 'relative', width: '100%', height: H * 0.62, borderRadius: '12px', background: C.deep, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: C.faint, fontWeight: 600 }}>Awaiting the first position</span>
        </div>
      </div>
    );
  }

  const bPts = series.map((v, i) => [X(i), Y(v)] as [number, number]);
  const dPts = series.map((v, i) => [X(i), Y(100 - v)] as [number, number]);
  const bPath = smooth(bPts);
  const dPath = smooth(dPts);
  const baseY = padT + innerH;
  const bArea = `${bPath} L ${X(n - 1)} ${baseY} L ${X(0)} ${baseY} Z`;
  const dArea = `${dPath} L ${X(n - 1)} ${baseY} L ${X(0)} ${baseY} Z`;
  const lw = large ? 3 : 2.4;

  // Keep each dot on its line, but separate the value pills if they'd collide
  // (near a 50/50 market the two endpoints sit on top of each other).
  let yB = Y(believePct);
  let yD = Y(100 - believePct);
  const minGap = 22;
  if (Math.abs(yB - yD) < minGap) {
    const mid = (yB + yD) / 2;
    if (believeLeads) { yB = mid - minGap / 2; yD = mid + minGap / 2; }
    else { yB = mid + minGap / 2; yD = mid - minGap / 2; }
  }

  const endLabel = (v: number, color: string, dotY: number, labelY: number) => (
    <g key={color}>
      <circle cx={X(n - 1)} cy={dotY} r={7} fill={color} opacity={0.18} />
      <circle cx={X(n - 1)} cy={dotY} r={3.4} fill={color} />
      <rect x={X(n - 1) + 9} y={labelY - 10} width={42} height={20} rx={6} fill={color} opacity={0.14} />
      <text x={X(n - 1) + 30} y={labelY + 4} textAnchor="middle" style={{ fontFamily: FONTS.mono, fontWeight: 700, fill: color }} fontSize={12}>
        {Math.round(v)}%
      </text>
    </g>
  );

  const believeSvg = (
    <g key="b">
      <path d={bArea} fill={`url(#bg-${uid})`} />
      <path d={bPath} fill="none" stroke={`url(#bs-${uid})`} strokeWidth={lw} strokeLinecap="round" filter={`url(#gl-${uid})`} />
    </g>
  );
  const doubtSvg = (
    <g key="d">
      <path d={dArea} fill={`url(#dg-${uid})`} />
      <path d={dPath} fill="none" stroke={`url(#ds-${uid})`} strokeWidth={lw} strokeLinecap="round" filter={`url(#gl-${uid})`} />
    </g>
  );

  return (
    <div style={{ width: '100%' }}>
      {header}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`bs-${uid}`} x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.5} />
            <stop offset="100%" stopColor={GREEN_BRIGHT} />
          </linearGradient>
          <linearGradient id={`ds-${uid}`} x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} stopOpacity={0.5} />
            <stop offset="100%" stopColor={RED} />
          </linearGradient>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`dg-${uid}`} x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
            <stop offset="100%" stopColor={RED} stopOpacity={0} />
          </linearGradient>
          <filter id={`gl-${uid}`} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation={large ? 2.4 : 1.8} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint grid + equilibrium baseline */}
        {[25, 50, 75].map((v) => (
          <line key={v} x1={padL} y1={Y(v)} x2={padL + innerW} y2={Y(v)} stroke={C.text} strokeOpacity={v === 50 ? 0.1 : 0.045} strokeWidth={1} strokeDasharray={v === 50 ? '3 4' : undefined} />
        ))}

        {/* Trailing side under the leading side */}
        {believeLeads ? [doubtSvg, believeSvg] : [believeSvg, doubtSvg]}

        {endLabel(believePct, GREEN_BRIGHT, Y(believePct), yB)}
        {endLabel(100 - believePct, RED, Y(100 - believePct), yD)}
      </svg>

      {/* Footer: the two sides + market size */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: large ? '11px' : '10px', fontFamily: FONTS.mono }}>
        <span style={{ color: GREEN_BRIGHT, fontWeight: 700 }}>▲ Believe {believePct}%</span>
        {(capital > 0 || callers > 0) && (
          <span style={{ color: C.faint }}>{fmtCap(capital)} · {callers} {callers === 1 ? 'position' : 'positions'}</span>
        )}
        <span style={{ color: RED, fontWeight: 700 }}>▼ Doubt {100 - believePct}%</span>
      </div>
    </div>
  );
}

export default MarketLines;
