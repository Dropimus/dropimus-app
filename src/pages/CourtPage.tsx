/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Folder, Flame, Activity, Shield, Rocket, AlertTriangle, ClipboardList, LayoutGrid } from 'lucide-react';
import { C, FONTS } from '../tokens';
import ClaimCard from '../components/shared/ClaimCard';
import { Claim } from '../lib/walletAndGoogle';
import { IconParachute } from '../components/icons';

// Icons for the category filter tabs (mirrors the CatPill mapping).
const CAT_ICON: Record<string, React.ComponentType<any>> = {
  All: LayoutGrid,
  Airdrops: IconParachute,
  Accountability: ClipboardList,
  Security: Shield,
  Projects: Rocket,
  Trust: AlertTriangle,
};

interface CourtPageProps {
  claims: Claim[];
  onSelectClaim: (claim: Claim) => void;
  onMakeCall: (claim: Claim) => void;
}

type Filter = 'All' | 'Airdrops' | 'Accountability' | 'Security' | 'Projects' | 'Trust';
type StatusFilter = 'all' | 'open' | 'resolved' | 'faded';
type SortBy = 'newest' | 'stakes' | 'active';

interface TrendingTopic {
  topic: string;
  category: string;
  volume: string;
  change: string;
  isUp: boolean;
  count: number;
}

const TRENDING_TOPICS: TrendingTopic[] = [
  { topic: 'MegaETH Allocation', category: 'Airdrops', volume: '$1.4M', change: '+42%', isUp: true, count: 18 },
  { topic: 'ZK Airdrop', category: 'Airdrops', volume: '$890k', change: '+128%', isUp: true, count: 32 },
  { topic: 'Multisig Insiders', category: 'Security', volume: '$2.1M', change: '-5%', isUp: false, count: 14 },
  { topic: 'LayerZero Season 2', category: 'Projects', volume: '$3.4M', change: '+18%', isUp: true, count: 25 },
  { topic: 'Team Wallet Disclosure', category: 'Accountability', volume: '$4.2M', change: '+94%', isUp: true, count: 47 },
  { topic: 'Bridge Solvency', category: 'Trust', volume: '$620k', change: '+15%', isUp: true, count: 9 },
];

export function CourtPage({ claims, onSelectClaim, onMakeCall }: CourtPageProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrending, setShowTrending] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowTrending(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories: Filter[] = ['All', 'Airdrops', 'Accountability', 'Security', 'Projects', 'Trust'];

  // Apply filters including full-text search query and status filtering
  const filteredClaims = claims.filter(c => {
    const matchesCategory = activeFilter === 'All' || c.category === activeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'open') {
      matchesStatus = c.status === 'open' || c.status === 'dead_zone' || c.status === 'active' || c.status === 'resolving';
    } else if (statusFilter === 'resolved') {
      matchesStatus = c.status === 'proven' || c.status === 'pending_onchain';
    } else if (statusFilter === 'faded') {
      matchesStatus = c.status === 'faded';
    }
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory && matchesStatus;
    
    const titleMatch = c.title ? c.title.toLowerCase().includes(query) : false;
    const descMatch = c.description ? c.description.toLowerCase().includes(query) : false;
    const categoryMatch = c.category ? c.category.toLowerCase().includes(query) : false;
    
    return matchesCategory && matchesStatus && (titleMatch || descMatch || categoryMatch);
  });

  // Apply sorting
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id - a.id;
    }
    if (sortBy === 'stakes') {
      return (b.capital + b.honorStaked) - (a.capital + a.honorStaked);
    }
    if (sortBy === 'active') {
      return b.callers - a.callers;
    }
    return 0;
  });

  // Filter trending topics in real time as the user types
  const matchingTopics = TRENDING_TOPICS.filter(t => 
    !searchQuery || 
    t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* 1. Integrated Sophisticated Console Header & High-Contrast Telemetry Hub */}
      <div
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          justifyContent: 'space-between',
          alignItems: isDesktop ? 'center' : 'stretch',
          gap: '16px',
          marginTop: '16px',
          marginBottom: '16px',
          padding: '12px 18px',
          background: C.card,
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          position: 'relative',
        }}
      >
        {/* Subtle decorative high-contrast light edge */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '20px',
          right: '20px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.15), rgba(234, 179, 8, 0.15), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Left Side: Brand Identity & Live Oracle Beacon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ 
              fontSize: '15px', 
              fontWeight: 800, 
              color: C.text, 
              letterSpacing: '-0.02em', 
              margin: 0, 
              fontFamily: FONTS.display,
            }}>
              Live Claims
            </h1>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              borderRadius: '4px', 
              padding: '1px 5px',
              height: '14px',
            }}>
              <span className="animate-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: '7px', fontWeight: 900, color: '#10B981', letterSpacing: '0.04em', fontFamily: FONTS.mono }}>LIVE</span>
            </div>
          </div>
          <p style={{ fontSize: '10px', color: C.sub, margin: 0, opacity: 0.6, fontWeight: 500, letterSpacing: '-0.01em' }}>
            The credibility market for crypto.
          </p>
        </div>

        {/* Right Side: High-Contrast Monospace Telemetry Ticker */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          alignSelf: isDesktop ? 'center' : 'stretch',
          justifyContent: isDesktop ? 'flex-end' : 'space-between',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Active Claims block */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '8px', color: C.sub, opacity: 0.5, fontWeight: 700, letterSpacing: '0.08em', fontFamily: FONTS.mono }}>ACTIVE</span>
            <span style={{ fontSize: '13px', color: C.text, fontWeight: 800, fontFamily: FONTS.mono, letterSpacing: '-0.02em' }}>
              {openClaimsCount}
            </span>
            <span style={{ fontSize: '8px', color: C.sub, opacity: 0.4, fontWeight: 600 }}>claims</span>
          </div>

          <span style={{ color: C.border, fontSize: '10px' }}>|</span>

          {/* Staked Rep block */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '8px', color: C.sub, opacity: 0.5, fontWeight: 700, letterSpacing: '0.08em', fontFamily: FONTS.mono }}>HONOR</span>
            <span style={{ fontSize: '13px', color: '#0284C7', fontWeight: 800, fontFamily: FONTS.mono, letterSpacing: '-0.02em' }}>
              {formatRep(totalHonorStaked)}
            </span>
            <span style={{ fontSize: '9px', color: '#0284C7', opacity: 0.8 }}>⚡</span>
          </div>

          <span style={{ color: C.border, fontSize: '10px' }}>|</span>

          {/* Escrow pool block */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '8px', color: C.sub, opacity: 0.5, fontWeight: 700, letterSpacing: '0.08em', fontFamily: FONTS.mono }}>CONVICTION</span>
            <span style={{ fontSize: '13px', color: '#D97706', fontWeight: 800, fontFamily: FONTS.mono, letterSpacing: '-0.02em' }}>
              ${formatRep(totalUSDCLocked)}
            </span>
            <span style={{ fontSize: '8px', color: C.sub, opacity: 0.4, fontWeight: 650 }}>dUSD</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Control Deck */}
      <div
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'center' : 'stretch',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        {/* Categories Scroller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat) => {
            const isSelected = activeFilter === cat;
            const Icon = CAT_ICON[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  background: isSelected ? C.blueDim : 'transparent',
                  border: isSelected ? `1px solid ${C.border2}` : '1px solid transparent',
                  color: isSelected ? C.text : C.sub,
                  borderRadius: '6px',
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONTS.body,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {Icon && <Icon size={12} strokeWidth={2.4} />}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Filters Group (Search, Status, Order) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Status Select */}
          <div style={{ position: 'relative' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: C.deep,
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                color: C.text,
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 18px 3px 8px',
                cursor: 'pointer',
                fontFamily: FONTS.body,
                outline: 'none',
              }}
            >
              <option value="all" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>All States</option>
              <option value="open" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>Active</option>
              <option value="resolved" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>Proven</option>
              <option value="faded" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>Faded</option>
            </select>
            <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '7px', opacity: 0.5, color: C.text }}>▼</div>
          </div>

          {/* Sort Select */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: C.deep,
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                color: C.text,
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 18px 3px 8px',
                cursor: 'pointer',
                fontFamily: FONTS.body,
                outline: 'none',
              }}
            >
              <option value="newest" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>Newest</option>
              <option value="stakes" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>High Stakes</option>
              <option value="active" style={{ background: 'var(--color-canvas)', color: 'var(--color-text)' }}>Most Active</option>
            </select>
            <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '7px', opacity: 0.5, color: C.text }}>▼</div>
          </div>

          <span style={{ color: C.border, margin: '0 2px' }}>|</span>

          {/* Elegant Search Input with Real-time Analytics Overlay */}
          <div 
            ref={searchContainerRef}
            style={{ position: 'relative', width: isDesktop ? '160px' : '100%', transition: 'width 0.15s ease' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowTrending(true)}
              placeholder="Search..."
              style={{
                width: '100%',
                background: C.deep,
                border: showTrending ? `1px solid ${C.blueLight}` : `1px solid ${C.border}`,
                borderRadius: '6px',
                padding: '3px 8px 3px 22px',
                color: C.text,
                fontSize: '11px',
                outline: 'none',
                fontFamily: FONTS.body,
                transition: 'border-color 0.15s ease',
              }}
            />
            <div style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Search size={10} color={showTrending ? C.blueLight : C.sub} />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: C.sub,
                  cursor: 'pointer',
                  fontSize: '9px',
                }}
              >
                ✕
              </button>
            )}

            {/* Glassmorphic Real-Time Analytics Micro-Popover */}
            {showTrending && (
              <div
                className="glassmorphic"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: isDesktop ? '280px' : '100%',
                  borderRadius: '12px',
                  padding: '12px',
                  zIndex: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fadeIn 0.12s ease-out',
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={11} color="#F97316" fill="#F97316" className="animate-pulse" />
                    <span style={{ fontSize: '9px', fontWeight: 800, color: C.sub, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: FONTS.mono }}>
                      Trending Topics
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(239, 68, 68, 0.08)', padding: '1px 4px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Activity size={8} color="#EF4444" className="animate-pulse" />
                    <span style={{ fontSize: '7px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: FONTS.mono }}>LIVE</span>
                  </div>
                </div>

                {/* Separator line */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                {/* Filtered suggestions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '180px', overflowY: 'auto' }}>
                  {matchingTopics.length > 0 ? (
                    matchingTopics.slice(0, 5).map((t) => (
                      <div
                        key={t.topic}
                        onClick={() => {
                          setSearchQuery(t.topic);
                          setShowTrending(false);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: 'transparent',
                          border: '1px solid transparent',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {/* Topic info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span style={{ fontSize: '11px', color: C.text, fontWeight: 600 }}>
                            {t.topic}
                          </span>
                          <span style={{ fontSize: '8px', color: C.sub, textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 550 }}>
                            {t.category}
                          </span>
                        </div>

                        {/* Stats / volume info */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                          <span style={{ fontSize: '10px', color: C.text, fontFamily: FONTS.mono, fontWeight: 600 }}>
                            {t.volume}
                          </span>
                          <span style={{ 
                            fontSize: '8px', 
                            color: t.isUp ? '#10B981' : '#EF4444', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '2px',
                            fontFamily: FONTS.mono 
                          }}>
                            {t.isUp ? '▲' : '▼'} {t.change}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px 0', textAlign: 'center', color: C.sub, fontSize: '10px', fontStyle: 'italic' }}>
                      No matching trending topics
                    </div>
                  )}
                </div>

                {/* Footer analytics telemetry */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 4px 0' }}>
                  <span style={{ fontSize: '8px', color: C.sub }}>
                    {searchQuery ? 'Live overlay analysis' : 'Global predictive index'}
                  </span>
                  <span style={{ fontSize: '8px', color: C.blueLight, fontFamily: FONTS.mono, fontWeight: 700 }}>
                    {claims.length} indexes tracked
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Claims Counter strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.sub, fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONTS.mono }}>
        <span>{sortedClaims.length} CLAIMS FOUND</span>
      </div>

      {/* 4. Filtered lists element */}
      {sortedClaims.length > 0 ? (
        <motion.div
          key={`${activeFilter}-${statusFilter}-${sortBy}`}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              }
            }
          }}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(330px, 1fr))' : '1fr',
            gap: isDesktop ? '16px' : '0px',
          }}
        >
          {sortedClaims.map((claim) => (
            <motion.div
              key={claim.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 120,
                    damping: 17,
                  }
                }
              }}
            >
              <ClaimCard
                claim={claim}
                onSelect={onSelectClaim}
                onMakeCallClick={onMakeCall}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: C.sub,
            background: C.card,
            border: `1px dashed ${C.border}`,
            borderRadius: '16px',
            maxWidth: '560px',
            margin: '20px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ padding: '16px', borderRadius: '50%', background: C.deep, border: `1px solid ${C.border}`, color: C.blueLight }}>
            <Folder size={24} />
          </div>
          {claims.length === 0 ? (
            <>
              <h3 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 700, color: C.text, margin: 0 }}>
                No claims yet
              </h3>
              <p style={{ fontSize: '12px', fontFamily: FONTS.body, maxWidth: '380px', margin: '0 auto', color: C.sub, lineHeight: '1.5' }}>
                No claims have been anchored yet. Connect your wallet and anchor the first claim for the community to evaluate.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily: FONTS.display, fontSize: '15px', fontWeight: 700, color: C.text, margin: 0 }}>
                No claims match
              </h3>
              <p style={{ fontSize: '12px', fontFamily: FONTS.body, maxWidth: '380px', margin: '0 auto', color: C.sub, lineHeight: '1.5' }}>
                No claims match your search or category filter. Try loosening your parameters.
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
export default CourtPage;
