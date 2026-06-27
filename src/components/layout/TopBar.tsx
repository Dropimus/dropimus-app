/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C, FONTS } from '../../tokens';
import { LogoWordmark, IconHonor, IconCourt, IconAnchor, IconRank, IconProfile } from '../icons';
import { GoogleUser, Wallet } from '../../lib/walletAndGoogle';
import { API_BASE } from '../../lib/apiBase';
import { Btn } from '../shared/Btn';
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
  const triggerContainerRef = React.useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (dropdownOpen && triggerContainerRef.current) {
      const rect = triggerContainerRef.current.getBoundingClientRect();
      const dropdownWidth = 260;
      let left = rect.left - dropdownWidth + rect.width;
      if (left < 10) left = 10;
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      setDropdownCoords({
        top: rect.bottom + window.scrollY + 10,
        left: left,
      });
    }
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleToggleGoogle = () => {
    if (googleUser.loggedIn) {
      onUpdate();
    } else {
      fetch(`${API_BASE}/api/auth/google/login`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.redirect_url) {
            window.location.href = data.redirect_url;
          } else {
            throw new Error("Invalid redirect response");
          }
        })
        .catch(err => {
          console.error("TopBar Google connection error:", err);
        });
    }
  };

  const handleToggleWallet = () => {
    onUpdate();
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

      {/* Account actions */}
      <div ref={triggerContainerRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        
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
              position: 'fixed',
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              right: 'auto',
              width: '290px',
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 101,
              // Dense frosted backplate so dashboard content never bleeds through.
              background: 'rgba(12, 12, 14, 0.92)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
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

            {/* Wallet & On-Chain Stats: Responsive Single-Row Horizontal Grid */}
            <div>
              <div
                style={{
                  color: C.sub,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                On-Chain Credentials & Stats
              </div>
              {wallet.connected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Compact Wallet Address Badge */}
                  <div 
                    title={wallet.address}
                    style={{ 
                      fontFamily: FONTS.mono, 
                      fontSize: '11px', 
                      color: C.blueLight,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'center',
                    }}
                  >
                    {wallet.address && wallet.address.length > 15 
                      ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` 
                      : wallet.address}
                  </div>
                  
                  {/* Responsive Single-Row Horizontal Grid for Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {/* Capital Stat */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '8px', color: C.sub, fontWeight: 550, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Capital</span>
                      <span style={{ fontFamily: FONTS.mono, color: C.goldBright, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ${wallet.balanceUSDC}
                      </span>
                    </div>

                    {/* Honor Stat */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '8px', color: C.sub, fontWeight: 550, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Honor</span>
                      <span style={{ fontFamily: FONTS.mono, color: '#10B981', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {wallet.balanceHonor}
                      </span>
                    </div>

                    {/* Tier Stat */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '8px', color: C.sub, fontWeight: 550, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tier</span>
                      <span style={{ color: C.blueLight, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {wallet.tier}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: C.sub, fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>
                  Wallet disconnected
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: C.hairline }} />

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Btn
                variant={googleUser.loggedIn ? 'danger' : 'secondary'}
                fullWidth
                onClick={handleToggleGoogle}
                style={{
                  padding: '10px 12px',
                  fontSize: '12px',
                  borderRadius: '10px',
                }}
              >
                {googleUser.loggedIn ? "Sign Out Google" : "Connect with Google"}
              </Btn>

              <Btn
                variant={wallet.connected ? 'secondary' : 'gold'}
                fullWidth
                onClick={handleToggleWallet}
                style={{
                  padding: '10px 12px',
                  fontSize: '12px',
                  borderRadius: '10px',
                }}
              >
                {wallet.connected ? "Disconnect Wallet" : "Connect Web3 Wallet"}
              </Btn>
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
