/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CAT_COLORS } from '../../data';
import { FONTS } from '../../tokens';
import { Folder, Shield, Rocket, AlertTriangle, ClipboardList } from 'lucide-react';
import { IconParachute } from '../icons';

const CAT_ICONS: Record<string, React.ComponentType<any>> = {
  Airdrops: IconParachute,
  Accountability: ClipboardList,
  Security: Shield,
  Projects: Rocket,
  Trust: AlertTriangle,
  Other: Folder,
};

interface CatPillProps {
  category: string;
}

export function CatPill({ category }: CatPillProps) {
  const normCategory = category ? (category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()) : 'Other';
  const c = (CAT_COLORS as any)[normCategory] || CAT_COLORS.Other;
  const IconComponent = CAT_ICONS[normCategory] || Folder;

  return (
    <div
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.text}2a`,
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: FONTS.body,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        lineHeight: 1.25,
      }}
    >
      <IconComponent size={11} strokeWidth={2.5} style={{ shrink: 0 }} />
      <span>{normCategory}</span>
    </div>
  );
}
export default CatPill;
