/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { C, FONTS } from '../../tokens';

interface StatusPillProps {
  status: 'open' | 'dead_zone' | 'proven' | 'faded' | 'resolving' | 'pending_onchain' | 'active';
  daysLeft?: number;
}

export function StatusPill({ status, daysLeft = 0 }: StatusPillProps) {
  let label = '';
  let color = C.sub;
  let bg = C.elevated;
  let border = `1px solid ${C.border}`;
  let className = '';

  switch (status) {
    case 'open':
      label = daysLeft > 0 ? `${daysLeft}D LEFT` : 'OPEN';
      color = C.sub;
      bg = C.elevated;
      border = `1px solid ${C.border}`;
      break;

    case 'pending_onchain':
      label = 'PENDING ON-CHAIN';
      color = C.goldBright;
      bg = C.goldDim;
      border = `1px solid ${C.gold}44`;
      className = 'animate-pulse';
      break;

    case 'active':
      label = 'ACTIVE';
      color = C.blueBright;
      bg = C.blueDim;
      border = `1px solid ${C.blueLight}44`;
      break;

    case 'dead_zone':
      label = 'DEAD ZONE';
      color = '#3A3A5A';
      bg = C.elevated;
      border = `1px solid ${C.border}`;
      className = 'animate-pulse'; // Uses standard keyframe for opacity pulse
      break;

    case 'proven':
      label = 'PROVEN';
      color = C.blueBright;
      bg = C.blueDim;
      border = `1px solid ${C.blueLight}44`;
      break;

    case 'faded':
      label = 'FADED';
      color = C.fadedBright;
      bg = C.fadedDim;
      border = `1px solid ${C.faded}44`;
      break;

    case 'resolving':
      label = 'RESOLVING';
      color = C.goldBright;
      bg = C.goldDim;
      border = `1px solid ${C.gold}44`;
      break;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: color,
        border: border,
        borderRadius: '6px',
        padding: '3px 10px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        fontFamily: FONTS.body,
        lineHeight: 1,
      }}
    >
      {label}
    </div>
  );
}
export default StatusPill;
