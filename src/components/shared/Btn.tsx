/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { C, FONTS } from '../../tokens';

interface BtnProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'ghost';
  fullWidth?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Btn({ variant = 'secondary', fullWidth = false, style, children, disabled, onClick, ...props }: BtnProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  let bg = '';
  let color = '#fff';
  let border = 'none';
  let boxShadow = 'none';

  switch (variant) {
    case 'primary':
      bg = isHovered ? C.blueHover : C.blue;
      color = '#000000';
      boxShadow = isHovered 
        ? `0 6px 24px rgba(255, 255, 255, 0.15)`
        : `0 4px 18px ${C.blueGlow}`;
      break;

    case 'secondary':
      bg = isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
      border = `1px solid ${isHovered ? C.blueLight : C.border}`;
      color = isHovered ? '#ffffff' : C.text;
      break;

    case 'danger':
      bg = isHovered ? `${C.faded}15` : 'transparent';
      border = `1px solid ${isHovered ? C.fadedBright : `${C.faded}44`}`;
      color = C.fadedBright;
      break;

    case 'gold':
      bg = isHovered ? `${C.gold}15` : 'transparent';
      border = `1px solid ${isHovered ? C.goldBright : `${C.gold}44`}`;
      color = C.goldBright;
      break;

    case 'ghost':
      bg = isHovered ? 'rgba(255, 255, 255, 0.08)' : C.elevated;
      border = `1px solid ${isHovered ? C.border2 : C.border}`;
      color = isHovered ? '#ffffff' : C.sub;
      break;
  }

  const baseStyle: React.CSSProperties = {
    padding: '11px 18px',
    borderRadius: '10px',
    fontFamily: FONTS.body,
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    border: border,
    background: bg,
    color: color,
    boxShadow: boxShadow,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.38 : 1,
    transform: isActive && !disabled ? 'scale(0.96)' : isHovered && !disabled ? 'translateY(-1px)' : 'none',
  };

  return (
    <button
      style={{ ...baseStyle, ...style }}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => !disabled && setIsActive(true)}
      onMouseUp={() => !disabled && setIsActive(false)}
      {...props}
    >
      {children}
    </button>
  );
}
export default Btn;
