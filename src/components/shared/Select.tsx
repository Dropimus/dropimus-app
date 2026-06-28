/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { C, FONTS } from '../../tokens';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;   // merged into the trigger
  fullWidth?: boolean;
  ariaLabel?: string;
}

/**
 * Custom dropdown that matches the Dropimus UI and works everywhere (the native
 * <select> popup is unstyleable and blocked/inconsistent in some browsers). The
 * options panel is portalled to <body> with fixed positioning so it never gets
 * clipped by scrollable/overflow ancestors.
 */
export function Select({ value, onChange, options, placeholder = 'Select…', disabled, style, fullWidth = true, ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; above: boolean }>({ top: 0, left: 0, width: 0, above: false });

  const selected = options.find((o) => o.value === value);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelH = Math.min(280, options.length * 40 + 8);
    const spaceBelow = window.innerHeight - r.bottom;
    const above = spaceBelow < panelH + 12 && r.top > spaceBelow;
    setCoords({
      top: above ? r.top - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
      above,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: fullWidth ? '100%' : 'auto',
          background: C.deep,
          border: `1px solid ${open ? C.blueLight : C.border}`,
          borderRadius: '10px',
          padding: '10px 12px',
          color: selected ? C.text : C.sub,
          fontSize: '13px',
          fontFamily: FONTS.body,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          textAlign: 'left',
          transition: 'border-color 0.15s ease',
          ...style,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} style={{ color: C.sub, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: coords.above ? undefined : coords.top,
            bottom: coords.above ? window.innerHeight - coords.top : undefined,
            left: coords.left,
            width: coords.width,
            minWidth: '150px',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 1000,
            background: 'rgba(16,16,20,0.97)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: `1px solid ${C.border2}`,
            borderRadius: '12px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
            padding: '5px',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 10px',
                  color: active ? C.text : C.sub,
                  fontSize: '13px',
                  fontFamily: FONTS.body,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  {o.hint && <span style={{ fontSize: '10px', color: C.faint, marginTop: '1px' }}>{o.hint}</span>}
                </span>
                {active && <Check size={14} style={{ color: C.blueLight, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

export default Select;
