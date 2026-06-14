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
  let bg = '';
  let color = '#fff';
  let border = 'none';
  let boxShadow = 'none';
  let hoverStyles: React.CSSProperties = {};

  switch (variant) {
    case 'primary':
      bg = C.blue;
      color = '#000000';
      boxShadow = `0 4px 18px ${C.blueGlow}`;
      break;

    case 'secondary':
      bg = 'transparent';
      border = `1px solid ${C.border}`;
      color = C.text;
      break;

    case 'danger':
      bg = 'transparent';
      border = `1px solid ${C.faded}44`;
      color = C.fadedBright;
      break;

    case 'gold':
      bg = 'transparent';
      border = `1px solid ${C.gold}44`;
      color = C.goldBright;
      break;

    case 'ghost':
      bg = C.elevated;
      border = `1px solid ${C.border}`;
      color = C.sub;
      break;
  }

  const baseStyle: React.CSSProperties = {
    padding: '11px 18px',
    borderRadius: '10px',
    fontFamily: FONTS.body,
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.12s ease',
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
    transform: 'none',
  };

  return (
    <button
      style={{ ...baseStyle, ...style }}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export default Btn;
