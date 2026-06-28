/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C, FONTS } from '../../tokens';
import { LogoWordmark, IconHonor, IconCourt, IconAnchor, IconRank, IconProfile } from '../icons';
import { GoogleUser, Wallet } from '../../lib/walletAndGoogle';

interface TopBarProps {
  wallet: Wallet;
  googleUser: GoogleUser;
  onUpdate?: () => void;
  activePage?: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile';
  setActivePage?: (page: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile') => void;
  onClearSelectedClaim?: () => void;
}

export function TopBar({ wallet, googleUser, activePage, setActivePage, onClearSelectedClaim }: TopBarProps) {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The account chip + avatar now route to the Profile page, where all wallet
  // detail and sign-out actions live (the old dropdown menu was removed).
  const goToProfile = () => {
    onClearSelectedClaim?.();
    setActivePage?.('profile');
  };

  return (
    <header
      className="top-bar-sticky animate-fadeDown"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: C.card,
        backdropFilter: 'blur(20px) saturate(190%)',
        WebkitBackdropFilter: 'blur(20px) saturate(190%)',
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)',
        padding: '11px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Wordmark and Hexagonal Sigil */}
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => {
          if (onClearSelectedClaim) onClearSelectedClaim();
          if (setActivePage) setActivePage('court');
        }}
      >
        <LogoWordmark height={25} />
      </div>

      {/* Desktop Navigation Menu */}
      {isDesktop && setActivePage && (
        <div
          style={{
            display: 'flex',
            background: C.deep,
            border: `1px solid ${C.border}`,
            borderRadius: '99px',
            padding: '3px',
            gap: '2px',
            alignItems: 'center',
          }}
        >
          {([
            { id: 'court', label: 'Claims', icon: IconCourt },
            { id: 'honor', label: 'Honor', icon: IconHonor },
            { id: 'anchor', label: 'Anchor', icon: IconAnchor },
            { id: 'leaderboard', label: 'Ranks', icon: IconRank },
            { id: 'profile', label: 'Profile', icon: IconProfile },
          ] as const).map((item) => {
            const isSelected = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onClearSelectedClaim) onClearSelectedClaim();
                  setActivePage(item.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? C.blueDim : 'transparent',
                  border: `1px solid ${isSelected ? C.border : 'transparent'}`,
                  borderRadius: '99px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  color: isSelected ? C.blueLight : C.sub,
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  transition: 'all 0.12s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = C.text;
                    e.currentTarget.style.background = C.deep;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.color = C.sub;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={13} color={isSelected ? C.blueLight : C.sub} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Account: chip + avatar route to the Profile page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Honor balance chip (read-only) */}
        {wallet.connected && (
          <div
            onClick={goToProfile}
            title="View profile"
            style={{
              background: C.blueDim,
              border: `1px solid ${C.blueLight}33`,
              borderRadius: '8px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
            }}
          >
            <IconHonor size={12} color="#10B981" />
            <span style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>
              {wallet.balanceHonor}
            </span>
          </div>
        )}

        {/* Avatar → Profile */}
        <div
          onClick={goToProfile}
          title="View profile"
          aria-label="Open profile"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: googleUser.loggedIn
              ? `url(${googleUser.avatar}) center/cover no-referrer`
              : `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
            cursor: 'pointer',
            boxShadow: activePage === 'profile' ? `0 0 0 2px ${C.blueLight}` : `0 0 12px ${C.blueGlow}`,
            border: `1.5px solid ${C.border2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          {!googleUser.loggedIn && (googleUser.name ? googleUser.name[0].toUpperCase() : 'U')}
        </div>
      </div>
    </header>
  );
}
export default TopBar;
