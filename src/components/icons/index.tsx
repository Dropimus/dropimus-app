import React from 'react';
// @ts-ignore
import dlogo from '../../assets/images/dlogo.png';

export function IconCourt({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="3" x2="10" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="6" x2="17" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="6" x2="5.5" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3" y1="6" x2="0.5" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M0.5 11 Q3 13 5.5 11" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <line x1="17" y1="6" x2="19.5" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="17" y1="6" x2="14.5" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M14.5 11 Q17 13.5 19.5 11" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <line x1="7" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconHonor({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L4 11.5H9.5L8 18L16 8.5H10.5L12 2Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function IconAnchor({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="22" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <path d="M12 22c4.4-1.1 8-5.6 8-10v-3h-3" />
      <path d="M12 22c-4.4-1.1-8-5.6-8-10v-3h3" />
    </svg>
  );
}

export function IconRank({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5"  y="12" width="4.5" height="7.5" rx="1" stroke={color} strokeWidth="1.4"/>
      <rect x="7.5" y="7"  width="5" height="12.5" rx="1" stroke={color} strokeWidth="1.4"/>
      <rect x="14" y="10" width="4.5" height="9.5" rx="1" stroke={color} strokeWidth="1.4"/>
      <path d="M8.5 4.5 L10 2.5 L11.5 4.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function IconProfile({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2L16.5 5.75V13.25L10 17L3.5 13.25V5.75L10 2Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="10" cy="8.5" r="2" stroke={color} strokeWidth="1.2"/>
      <path d="M6.5 14.5 Q7.5 12 10 12 Q12.5 12 13.5 14.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export function IconProven({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L13.5 4V9C13.5 12 10.5 14 8 14.5C5.5 14 2.5 12 2.5 9V4L8 1.5Z"
        stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <path d="M5.5 8L7 9.5L10.5 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconFaded({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L13.5 4V9C13.5 12 10.5 14 8 14.5C5.5 14 2.5 12 2.5 9V4L8 1.5Z"
        stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeDasharray="2 1.5"/>
      <path d="M6 6L10 10M10 6L6 10" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export function IconOnChain({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 5.5 L4.5 4 A2.5 2.5 0 0 0 1.5 7L5 10.5 A2.5 2.5 0 0 0 8 10.5L9.5 9"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <path d="M10 10.5 L11.5 12 A2.5 2.5 0 0 0 14.5 9L11 5.5 A2.5 2.5 0 0 0 8 5.5L6.5 7"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export function IconDocument({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2H10L13 5V14H3V2Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
      <path d="M10 2V5H13" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="5.5" y1="7.5" x2="10.5" y2="7.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="5.5" y1="10" x2="9" y2="10" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

export function IconArticle({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H12V13H2V3Z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <line x1="4" y1="5.5" x2="10" y2="5.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="4" y1="7.5" x2="10" y2="7.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="4" y1="9.5" x2="7" y2="9.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M12 5H14V15H4V13" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function IconSocial({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2.5H14V10.5H9L6 13.5V10.5H2V2.5Z"
        stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
      <circle cx="5.5" cy="6.5" r="0.8" fill={color}/>
      <circle cx="8"   cy="6.5" r="0.8" fill={color}/>
      <circle cx="10.5" cy="6.5" r="0.8" fill={color}/>
    </svg>
  );
}

export function IconNoProof({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 8 C4 4 12 4 14.5 8 C12 12 4 12 1.5 8Z"
        stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.3"/>
      <line x1="3" y1="13" x2="13" y2="3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconVerify({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3"/>
      <path d="M5.5 8.5L7 10L10.5 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconHash({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.3"/>
      <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.3"/>
      <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.3"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke={color} strokeWidth="1.3" strokeDasharray="1.5 1"/>
    </svg>
  );
}

export function IconDecay({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2H12L8 8L12 14H4L8 8L4 2Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
      <line x1="4" y1="2" x2="12" y2="2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="4" y1="14" x2="12" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6.5 9.5L8 11.5L9.5 9.5" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function IconNumeric({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2"  y="13" width="3.5" height="5"  rx="1" stroke={color} strokeWidth="1.3"/>
      <rect x="7"  y="9"  width="3.5" height="9"  rx="1" stroke={color} strokeWidth="1.3"/>
      <rect x="12" y="5"  width="3.5" height="13" rx="1" stroke={color} strokeWidth="1.3"/>
      <line x1="1" y1="7" x2="17" y2="7" stroke={color} strokeWidth="1.1" strokeDasharray="2 1.5" strokeLinecap="round"/>
      <path d="M16 7L18.5 4.5M18.5 4.5L16.5 4.5M18.5 4.5L18.5 6.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconCompare({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4"  cy="10" r="2.5" stroke={color} strokeWidth="1.3"/>
      <circle cx="16" cy="10" r="2.5" stroke={color} strokeWidth="1.3"/>
      <path d="M10 10 L6.5 10" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 10 L13.5 10" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="9.5" y1="8" x2="9.5" y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="10.5" y1="8" x2="10.5" y2="12" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M7 5.5 L4 3.5"  stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M13 5.5 L16 3.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

export function IconLogoD({ size = 32, color = "currentColor" }) {
  return (
    <img
      src={dlogo}
      alt="Dropimus Logo"
      style={{ width: size, height: size, objectFit: 'contain' }}
      referrerPolicy="no-referrer"
    />
  );
}

export function LogoWordmark({ height = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <IconLogoD size={height * 1.15} color="#FFFFFF" />
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '18px',
        fontWeight: '800',
        letterSpacing: '0.1em',
        color: '#F5F5F5',
        lineHeight: 1
      }}>
        DROPIMUS
      </span>
    </div>
  );
}
