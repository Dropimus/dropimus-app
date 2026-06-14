/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { C, FONTS } from '../../tokens';
import { TIER } from '../../data';

interface HonorRingProps {
  honor: number;
  tier: string;
  size?: number;
}

export function HonorRing({ honor = 340, tier = 'Contributor', size = 120 }: HonorRingProps) {
  const tiers = ['Novice', 'Contributor', 'Analyst', 'Arbiter', 'Steward'];
  const idx = tiers.indexOf(tier);
  
  const currentTierInfo = TIER[tier] || TIER.Novice;
  const nextTierName = tiers[idx + 1];
  const nextTierInfo = nextTierName ? TIER[nextTierName] : null;

  const prevMin = currentTierInfo.min;
  const nextMin = nextTierInfo ? nextTierInfo.min : honor;

  // Calculate progress percent
  let progress = 1;
  if (nextTierInfo && nextMin > prevMin) {
    progress = (honor - prevMin) / (nextMin - prevMin);
  }
  // Clamp
  progress = Math.min(1, Math.max(0, progress));

  // Circle stroke constants
  const strokeWidth = 6;
  const r = (size / 2) - strokeWidth - 5;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - progress);

  // Format honor output cleanly (e.g. 10.4k, etc. as per rules)
  const formatHonor = (n: number): string => {
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const formattedValue = formatHonor(honor);
  const tierColor = currentTierInfo.color;

  const getTierIconSVG = (tierName: string, color: string) => {
    switch (tierName) {
      case 'Steward':
        return (
          <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <polygon points="5,0 10,5 5,10 0,5" fill={color} />
          </svg>
        );
      case 'Arbiter':
        return (
          <svg width="8" height="7" viewBox="0 0 10 9" style={{ display: 'inline-block' }}>
            <polygon points="5,0 10,9 0,9" fill={color} />
          </svg>
        );
      case 'Analyst':
        return (
          <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4.5" fill={color} />
          </svg>
        );
      case 'Contributor':
        return (
          <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M5,1 A4,4 0 0,0 5,9 Z" fill={color} />
          </svg>
        );
      case 'Novice':
      default:
        return (
          <svg width="8" height="8" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4" stroke={color} strokeWidth="1.5" fill="none" />
          </svg>
        );
    }
  };

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Dynamic ambient halo */}
      <div
        style={{
          position: 'absolute',
          width: size - 12,
          height: size - 12,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${tierColor}0d 0%, transparent 70%)`,
          boxShadow: `inset 0 0 20px ${tierColor}0a`,
          pointerEvents: 'none',
        }}
      />

      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tierColor} />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id={`ring-glow-${tier}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Sleek Concentric Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* High-tech Outer Segmented Dials */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          stroke="rgba(255, 255, 255, 0.012)"
          strokeWidth={1}
          strokeDasharray="3 5"
          fill="transparent"
        />

        {/* 2. Glowing Progress arc */}
        {progress > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={`url(#grad-${tier})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={`url(#ring-glow-${tier})`}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        )}
      </svg>

      {/* Futuristic Glossy Card Backdrop */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: size - 26,
          height: size - 26,
          borderRadius: '50%',
          background: 'rgba(7, 6, 10, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span
          style={{
            fontSize: '8px',
            fontFamily: FONTS.mono,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: tierColor,
            lineHeight: 1.1,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            filter: `drop-shadow(0 0 6px ${tierColor}33)`,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{getTierIconSVG(tier, tierColor)}</span> 
          <span>{tier}</span>
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '1px 0' }}>
          <Zap size={14} fill="#10B981" color="#10B981" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))' }} />
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: `${size * 0.17}px`,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
            }}
          >
            {formattedValue}
          </span>
        </div>
        
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: '8px',
            fontWeight: 700,
            color: C.sub,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: '3px',
          }}
        >
          REP WEIGHT
        </span>
      </div>
    </div>
  );
}
export default HonorRing;
