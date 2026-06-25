/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Shield, Award, Flame, Coins, Scale } from 'lucide-react';
import { C, FONTS } from '../../tokens';

export type TooltipTerm = 'honor' | 'capital' | 'faded' | 'sbt' | 'consensus';

interface TermTooltipProps {
  term?: TooltipTerm;
  title?: string;
  description?: string;
  children: React.ReactNode;
  underline?: boolean;
  highlightColor?: string;
}

const TERM_DEFS: Record<TooltipTerm, { title: string; description: string; icon: React.ReactNode; color: string }> = {
  honor: {
    title: 'Protocol Honor',
    description: 'A Soulbound, Non-Transferable (SBT) reputation score cryptographically bound to your specific wallet. It tracks your validation accuracy and honest behavior. Higher Honor grants wider endorsement bounds and elevates your influence tier within validation pools.',
    icon: <Award size={14} />,
    color: 'var(--color-gold-bright)',
  },
  capital: {
    title: 'Capital Stake',
    description: 'The economic collateral (USDC) committed to back or anchor claims. Requiring a financial deposit enforces skin-in-the-game, aligning evaluators to vote truthfully. Correct, consensus-aligned calls release stakes with yield, while contrarian false claims are slashed.',
    icon: <Coins size={14} />,
    color: 'var(--color-blue-bright)',
  },
  faded: {
    title: 'Faded / Consensus Failure',
    description: 'The terminal negative resolution state of a claims submission. When a claim is determined to be false, outdated, or consensus is reached against it, it is declared "Faded". Backers are penalized: stakes are slashed and Honor decay is applied.',
    icon: <Flame size={14} />,
    color: 'var(--color-faded-bright)',
  },
  sbt: {
    title: 'Soulbound Token (SBT)',
    description: 'A standard for non-transferable digital credentials representing achievements or identity. Because Dropimus reputation is encoded using soulbound principles, your accrued Honor can never be sold, pooled, or transferred.',
    icon: <Shield size={14} />,
    color: 'var(--color-gold-bright)',
  },
  consensus: {
    title: 'Protocol Consensus',
    description: 'The authoritative aggregate evaluation of the network. Verification outcomes are determined by compiling voting weights from all participating evaluator tiers. Aligning with the consensus secures yield, while reporting out-of-bounds causes slashing.',
    icon: <Scale size={14} />,
    color: 'var(--color-blue-bright)',
  },
};

export function TermTooltip({
  term,
  title: customTitle,
  description: customDescription,
  children,
  underline = true,
  highlightColor,
}: TermTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Determine title, explanation, icon, and colors
  let finalTitle = customTitle || '';
  let finalDesc = customDescription || '';
  let defaultIcon: React.ReactNode = <HelpCircle size={14} />;
  let activeColor = highlightColor || 'var(--color-blue-bright)';

  if (term && TERM_DEFS[term]) {
    const def = TERM_DEFS[term];
    finalTitle = finalTitle || def.title;
    finalDesc = finalDesc || def.description;
    defaultIcon = def.icon;
    activeColor = highlightColor || def.color;
  }

  return (
    <span
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      onClick={(e) => {
        // Prevent event propagation so single-card selection is not triggered prematurely
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      tabIndex={0}
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      <span
        style={{
          borderBottom: underline ? `1.2px dashed ${activeColor}` : 'none',
          paddingBottom: underline ? '1px' : '0px',
          color: underline ? C.text : 'inherit',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (underline) {
            e.currentTarget.style.color = activeColor;
            e.currentTarget.style.borderBottomStyle = 'solid';
          }
        }}
        onMouseLeave={(e) => {
          if (underline) {
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.borderBottomStyle = 'dashed';
          }
        }}
      >
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="glassmorphic"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: '270px',
              padding: '12px',
              borderRadius: '12px',
              color: '#ECECEC',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing tooltip when clicking inside tooltip
          >
            {/* Header */}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 800,
                color: activeColor,
                fontFamily: FONTS.display,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ display: 'inline-flex', padding: '3px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }}>
                {defaultIcon}
              </span>
              {finalTitle}
            </span>

            {/* Description */}
            <span
              style={{
                fontSize: '11px',
                lineHeight: '1.45',
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: FONTS.body,
                textAlign: 'left',
              }}
            >
              {finalDesc}
            </span>

            {/* Footer label */}
            <span
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '6px',
                marginTop: '2px',
              }}
            >
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dropimus Protocol Guide
              </span>
              <span style={{ fontSize: '8px', color: activeColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mechanic V1
              </span>
            </span>

            {/* Downward pointing arrow */}
            <span
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: 'rgba(20, 20, 24, 0.96)',
                borderBottom: `1px solid ${C.border2}`,
                borderRight: `1px solid ${C.border2}`,
                zIndex: -1,
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default TermTooltip;
