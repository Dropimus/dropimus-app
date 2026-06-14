/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C, FONTS } from '../../tokens';
import { LogoWordmark, IconHonor, IconCourt, IconAnchor, IconRank, IconProfile } from '../icons';
import DropimusProtocolAPI, { GoogleUser, Wallet } from '../../lib/walletAndGoogle';

interface TopBarProps {
  wallet: Wallet;
  googleUser: GoogleUser;
  onUpdate: () => void;
  activePage?: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile';
  setActivePage?: (page: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile') => void;
  onClearSelectedClaim?: () => void;
}

export function TopBar({ wallet, googleUser, onUpdate, activePage, setActivePage, onClearSelectedClaim }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleToggleGoogle = () => {
    if (googleUser.loggedIn) {
      DropimusProtocolAPI.logoutWithGoogle();
    } else {
      DropimusProtocolAPI.loginWithGoogle();
    }
    onUpdate();
  };

  const handleToggleWallet = () => {
    if (wallet.connected) {
      DropimusProtocolAPI.disconnectWallet();
    } else {
      DropimusProtocolAPI.connectWallet();
    }
    onUpdate();
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: 'rgba(5, 5, 8, 0.7)',
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '11px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '99px',
            padding: '3px',
            gap: '2px',
            alignItems: 'center',
          }}
        >
          {([
            { id: 'court', label: 'Court', icon: IconCourt },
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
                  border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent'}`,
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
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
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

      {/* Account actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        
        {/* Reputation chip (USDC/Honor combined status view) */}
        {wallet.connected && (
          <div
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
            onClick={toggleDropdown}
          >
            <IconHonor size={12} color="#10B981" />
            <span
              style={{
                fontFamily: FONTS.mono,
                color: C.blueLight,
                fontSize: '12px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {wallet.balanceHonor}
            </span>
          </div>
        )}

        {/* User Identity - Steve Jobs Avatar circle */}
        <div
          onClick={toggleDropdown}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: googleUser.loggedIn 
              ? `url(${googleUser.avatar}) center/cover no-referrer` 
              : `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
            cursor: 'pointer',
            boxShadow: `0 0 12px ${C.blueGlow}`,
            border: `1.5px solid ${C.border2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {!googleUser.loggedIn && "U"}
        </div>

        {/* Google & Web3 Interactive Dropdown Menu in standard clean premium style */}
        {dropdownOpen && (
          <div
            className="animate-fadeUp"
            style={{
              position: 'absolute',
              top: '42px',
              right: 0,
              width: '260px',
              background: C.card,
              border: `1px solid ${C.border2}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              zIndex: 101,
            }}
          >
            {/* Header: Identity */}
            <div>
              <div
                style={{
                  color: C.sub,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Protocol Identity
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: googleUser.loggedIn 
                      ? `url(${googleUser.avatar}) center/cover no-referrer` 
                      : `linear-gradient(135deg, ${C.gold}, ${C.blueLight})`,
                    border: `1px solid ${C.border2}`,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.text }}>
                    {googleUser.loggedIn ? googleUser.name : "Anonymity Core"}
                  </span>
                  <span style={{ fontSize: '11px', color: C.sub, fontFamily: FONTS.mono }}>
                    {googleUser.loggedIn ? googleUser.email : "Not authenticated"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: C.hairline }} />

            {/* Wallet Details */}
            <div>
              <div
                style={{
                  color: C.sub,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                On-Chain Node (Wallet)
              </div>
              {wallet.connected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '11px', color: C.blueLight }}>
                    {wallet.address}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.sub, marginTop: '2px' }}>
                    <span>Capital Balance:</span>
                    <span style={{ fontFamily: FONTS.mono, color: C.goldBright, fontWeight: 700 }}>
                      ${wallet.balanceUSDC} USDC
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.sub }}>
                    <span>Reputation Tier:</span>
                    <span style={{ fontWeight: 700, color: C.blueLight }}>
                      {wallet.tier}
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: C.sub, fontStyle: 'italic' }}>Wallet disconnected</span>
              )}
            </div>

            <div style={{ height: '1px', background: C.hairline }} />

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleToggleGoogle}
                style={{
                  background: googleUser.loggedIn ? `rgba(217,48,80,0.1)` : C.blueDim,
                  border: `1px solid ${googleUser.loggedIn ? C.faded + '44' : C.blueLight + '44'}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: googleUser.loggedIn ? C.fadedBright : C.blueLight,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.12s',
                }}
              >
                {googleUser.loggedIn ? "Sign Out Google" : "Connect with Google"}
              </button>

              <button
                onClick={handleToggleWallet}
                style={{
                  background: wallet.connected ? 'transparent' : C.goldDim,
                  border: `1px solid ${wallet.connected ? C.border : C.gold + '44'}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: wallet.connected ? C.sub : C.goldBright,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.12s',
                }}
              >
                {wallet.connected ? "Disconnect Wallet" : "Connect Web3 Wallet"}
              </button>
            </div>

            {/* Close trigger overlay */}
            <div
              onClick={() => setDropdownOpen(false)}
              style={{
                fontSize: '10px',
                color: C.sub,
                textAlign: 'center',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Done
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
export default TopBar;
