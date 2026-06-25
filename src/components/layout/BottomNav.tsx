/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C, FONTS } from '../../tokens';
import { IconCourt, IconHonor, IconAnchor, IconRank, IconProfile } from '../icons';

interface BottomNavProps {
  activePage: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile';
  setActivePage: (page: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile') => void;
  onClearSelectedClaim: () => void;
}

export function BottomNav({ activePage, setActivePage, onClearSelectedClaim }: BottomNavProps) {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleNavigate = (page: 'court' | 'honor' | 'anchor' | 'leaderboard' | 'profile') => {
    onClearSelectedClaim();
    setActivePage(page);
  };

  if (isDesktop) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: C.card,
        backdropFilter: 'blur(30px) saturate(160%)',
        WebkitBackdropFilter: 'blur(30px) saturate(160%)',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 calc(10px + env(safe-area-inset-bottom))',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* 1. Court / Lobby item */}
      <div
        onClick={() => handleNavigate('court')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activePage === 'court' ? C.blueDim : 'transparent',
            border: `1px solid ${activePage === 'court' ? C.blueLight + '55' : 'transparent'}`,
            transition: 'all 0.15s ease',
          }}
        >
          <IconCourt size={18} color={activePage === 'court' ? C.blueLight : C.sub} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: activePage === 'court' ? C.blueLight : C.sub,
            fontFamily: FONTS.body,
          }}
        >
          Court
        </span>
      </div>

      {/* 2. Honor ledger item */}
      <div
        onClick={() => handleNavigate('honor')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activePage === 'honor' ? C.blueDim : 'transparent',
            border: `1px solid ${activePage === 'honor' ? C.blueLight + '55' : 'transparent'}`,
            transition: 'all 0.15s ease',
          }}
        >
          <IconHonor size={18} color={activePage === 'honor' ? C.blueLight : C.sub} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: activePage === 'honor' ? C.blueLight : C.sub,
            fontFamily: FONTS.body,
          }}
        >
          Honor
        </span>
      </div>

      {/* 3. CENTER ELEVATED ACTION KEY — Anchor Claim */}
      <div
        onClick={() => handleNavigate('anchor')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flex: 1.2,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: C.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 22px ${C.blueGlow}`,
            marginTop: '-18px', // Raised above key boundary
            transition: 'all 0.15s ease',
            border: `1.5px solid ${C.blueLight}88`,
          }}
        >
          <IconAnchor size={22} color="var(--color-canvas)" />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: activePage === 'anchor' ? C.blueLight : C.sub,
            fontFamily: FONTS.body,
            marginTop: '4px',
          }}
        >
          Anchor
        </span>
      </div>

      {/* 4. Leaderboard/Ranks item */}
      <div
        onClick={() => handleNavigate('leaderboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activePage === 'leaderboard' ? C.blueDim : 'transparent',
            border: `1px solid ${activePage === 'leaderboard' ? C.blueLight + '55' : 'transparent'}`,
            transition: 'all 0.15s ease',
          }}
        >
          <IconRank size={18} color={activePage === 'leaderboard' ? C.blueLight : C.sub} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: activePage === 'leaderboard' ? C.blueLight : C.sub,
            fontFamily: FONTS.body,
          }}
        >
          Ranks
        </span>
      </div>

      {/* 5. Profile/Account detail */}
      <div
        onClick={() => handleNavigate('profile')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          cursor: 'pointer',
          flex: 1,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activePage === 'profile' ? C.blueDim : 'transparent',
            border: `1px solid ${activePage === 'profile' ? C.blueLight + '55' : 'transparent'}`,
            transition: 'all 0.15s ease',
          }}
        >
          <IconProfile size={18} color={activePage === 'profile' ? C.blueLight : C.sub} />
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: activePage === 'profile' ? C.blueLight : C.sub,
            fontFamily: FONTS.body,
          }}
        >
          Profile
        </span>
      </div>
    </nav>
  );
}
export default BottomNav;
