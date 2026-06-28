/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FONTS } from '../../tokens';

interface AvatarProps {
  /** Name, handle, or address — drives both the initial and the color. */
  seed: string;
  size?: number;
}

// A small palette of tasteful gradient pairs; the seed picks one deterministically
// so the same anchorer always gets the same identity color.
const GRADIENTS: [string, string][] = [
  ['#0052FF', '#4DA2FF'],
  ['#7C3AED', '#C084FC'],
  ['#059669', '#34D399'],
  ['#D97706', '#FBBF24'],
  ['#DB2777', '#F472B6'],
  ['#0891B2', '#22D3EE'],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Identity chip for an anchorer/user. Shows the first meaningful character over
 * a deterministic gradient — a real, recognizable avatar instead of the old
 * blank gradient dot.
 */
export function Avatar({ seed, size = 28 }: AvatarProps) {
  const clean = (seed || '').trim();
  // For 0x addresses use the first hex char after 0x; otherwise the first letter.
  const initial = clean.startsWith('0x') && clean.length > 2
    ? clean[2].toUpperCase()
    : (clean[0] || '?').toUpperCase();
  const [from, to] = GRADIENTS[hash(clean || '?') % GRADIENTS.length];

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#fff',
        fontFamily: FONTS.display,
        fontWeight: 800,
        fontSize: `${Math.round(size * 0.42)}px`,
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)',
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
}

export default Avatar;
