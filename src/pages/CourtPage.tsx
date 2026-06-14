/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Globe, Coins, Gift, Landmark, Trophy, TrendingUp, Folder } from 'lucide-react';
import { C, FONTS } from '../tokens';
import ClaimCard from '../components/shared/ClaimCard';
import { Claim } from '../lib/walletAndGoogle';

interface CourtPageProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onMakeCall: (claim: Claim) => void;
}

type Filter = 'All' | 'Crypto' | 'Airdrops' | 'Politics' | 'Sports' | 'Finance';
type SortBy = 'weight' | 'date' | 'capital';

export function CourtPage({ claims, onSelectClaim, onMakeCall }: CourtPageProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [sortBy, setSortBy] = useState<SortBy>('weight');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories: Filter[] = ['All', 'Crypto', 'Airdrops', 'Politics', 'Sports', 'Finance'];

  // Apply filters including full-text search query
  const filteredClaims = claims.filter(c => {
    const matchesCategory = activeFilter === 'All' || c.category === activeFilter;
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;
    
    const titleMatch = c.title ? c.title.toLowerCase().includes(query) : false;
    const descMatch = c.description ? c.description.toLowerCase().includes(query) : false;
    const categoryMatch = c.category ? c.category.toLowerCase().includes(query) : false;
    
    return matchesCategory && (titleMatch || descMatch || categoryMatch);
  });

  // Apply sorting
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy === 'weight') {
      return b.honorStaked - a.honorStaked;
    }
    if (sortBy === 'date') {
      return a.daysLeft - b.daysLeft; // closer to deadline first
    }
    if (sortBy === 'capital') {
      return b.capital - a.capital;
    }
    return 0;
  });

  // Calculate sum counts for the ledger summary strip
  const openClaimsCount = claims.filter(c => c.status === 'open' || c.status === 'dead_zone').length;
  const totalHonorStaked = claims.reduce((acc, c) => acc + c.honorStaked, 0);
  const totalUSDCLocked = claims.reduce((acc, c) => acc + c.capital, 0);

  const formatRep = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div
      style={{
        maxWidth: isDesktop ? '1100px' : '560px',
        margin: '0 auto',
        padding: '0 16px 100px',
        animation: 'fadeUp 0.22s ease forwards',
      }}
    >
      {/* 1. Sum statistics panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          margin: '14px 0 20px',
        }}
      >
        {/* Open Claims Box */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 10px' }}>
          <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            OPEN CLAIMS
          </div>
          <div style={{ fontFamily: FONTS.mono, color: C.text, fontSize: '18px', fontWeight: 700 }}>
            {openClaimsCount}
          </div>
        </div>

        {/* Total Honor Stake */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 10px' }}>
          <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            ACTIVE Rep
          </div>
          <div style={{ fontFamily: FONTS.mono, color: C.blueLight, fontSize: '18px', fontWeight: 700 }}>
            {formatRep(totalHonorStaked)}⚡
          </div>
        </div>

        {/* Global USDC pools */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 10px' }}>
          <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
            POOL USDC
          </div>
          <div style={{ fontFamily: FONTS.mono, color: C.goldBright, fontSize: '18px', fontWeight: 700 }}>
            ${formatRep(totalUSDCLocked)}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search claims, tickers, categories or protocols..."
          style={{
            width: '100%',
            background: C.deep,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            padding: '10px 14px 10px 38px',
            color: C.text,
            fontSize: '13px',
            fontFamily: FONTS.body,
            outline: 'none',
            transition: 'all 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.blueLight;
            e.currentTarget.style.boxShadow = `0 0 10px ${C.blueGlow}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Search size={14} color={C.sub} />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: C.sub,
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: FONTS.mono,
              padding: '6px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Horizontal Scrollable Category chips (Webkit scrollbar disabled) */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            padding: '10px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((cat) => {
            const isSelected = activeFilter === cat;
            const FILTER_ICONS: Record<string, React.ComponentType<any>> = {
              All: Globe,
              Crypto: Coins,
              Airdrops: Gift,
              Politics: Landmark,
              Sports: Trophy,
              Finance: TrendingUp,
            };
            const IconComponent = FILTER_ICONS[cat] || Folder;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  background: isSelected ? C.blueDim : 'transparent',
                  border: `1px solid ${isSelected ? C.blueLight : C.border}`,
                  color: isSelected ? C.blueLight : C.sub,
                  borderRadius: '99px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                  fontFamily: FONTS.body,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconComponent size={12} strokeWidth={2.5} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sorting controls overlay */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ color: C.sub, fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {sortedClaims.length} CLAIMS FOUND · SORTED BY
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          style={{
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '6px 10px',
            color: C.sub,
            fontSize: '11px',
            fontFamily: FONTS.body,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="weight">Highest Weight</option>
          <option value="date">Shortest Deadline</option>
          <option value="capital">Staked Capitall</option>
        </select>
      </div>

      {/* 4. Filtered lists element */}
      {sortedClaims.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(330px, 1fr))' : '1fr',
          gap: isDesktop ? '16px' : '0px',
        }}>
          {sortedClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onSelect={onSelectClaim}
              onMakeCallClick={onMakeCall}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: C.sub }}>
          <div style={{ fontSize: '13px', fontFamily: FONTS.body }}>No claims currently exist in this filter.</div>
        </div>
      )}
    </div>
  );
}
export default CourtPage;
