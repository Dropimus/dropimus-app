/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TIER } from '../../data';
import { FONTS } from '../../tokens';

interface TierBadgeProps {
  tier: string;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const t = TIER[tier] || TIER.Novice;

  const getTierIconSVG = (tierName: string, color: string) => {
    switch (tierName) {
      case 'Steward':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <polygon points="5,0 10,5 5,10 0,5" fill={color} />
          </svg>
        );
      case 'Arbiter':
        return (
          <svg width="10" height="9" viewBox="0 0 10 9" style={{ display: 'inline-block' }}>
            <polygon points="5,0 10,9 0,9" fill={color} />
          </svg>
        );
      case 'Analyst':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4.5" fill={color} />
          </svg>
        );
      case 'Contributor':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M5,1 A4,4 0 0,0 5,9 Z" fill={color} />
          </svg>
        );
      case 'Novice':
      default:
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ display: 'inline-block' }}>
            <circle cx="5" cy="5" r="4" stroke={color} strokeWidth="1.5" fill="none" />
          </svg>
        );
    }
  };

  return (
    <span
      style={{
        color: t.color,
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: FONTS.body,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {getTierIconSVG(tier, t.color)}
      </span>
      <span>{tier}</span>
    </span>
  );
}
export default TierBadge;
