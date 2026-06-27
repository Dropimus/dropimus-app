/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { C } from '../../tokens';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 992 : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

const bar = (w: string, h = 10, opacity = 0.07): React.CSSProperties => ({
  height: `${h}px`, width: w, borderRadius: '4px', background: `rgba(255,255,255,${opacity})`,
});

// Matches the redesigned ClaimCard: header, statement, orb + stat stack,
// anchored-by row, and action buttons.
function ClaimCardSkeleton() {
  return (
    <div className="animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={bar('38%', 16, 0.08)} />
        <div style={bar('18%', 16, 0.05)} />
      </div>
      <div style={{ ...bar('92%', 16, 0.1), marginBottom: '6px' }} />
      <div style={{ ...bar('60%', 16, 0.1), marginBottom: '14px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ ...bar('100%', 28, 0.04) }} />)}
        </div>
      </div>
      <div style={{ ...bar('45%', 14, 0.04), marginBottom: '14px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ ...bar('50%', 38, 0.08), borderRadius: '10px' }} />
        <div style={{ ...bar('50%', 38, 0.04), borderRadius: '10px' }} />
      </div>
    </div>
  );
}

export function CourtPageSkeleton() {
  const isDesktop = useIsDesktop();
  return (
    <div style={{ maxWidth: isDesktop ? '1100px' : '560px', margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Stats / header row */}
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '10px', margin: '14px 0 20px', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between' }}>
        <div style={bar(isDesktop ? '200px' : '50%', 22, 0.1)} />
        <div style={{ display: 'flex', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 16px', width: '90px' }}>
              <div style={{ ...bar('60%', 8, 0.06), marginBottom: '8px' }} />
              <div style={bar('40%', 16, 0.1)} />
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="animate-pulse" style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: '30px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', width: '78px', flexShrink: 0 }} />
        ))}
      </div>

      {/* Claims grid — matches CourtPage's desktop grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(330px, 1fr))' : '1fr', gap: isDesktop ? '16px' : '14px' }}>
        {(isDesktop ? [1, 2, 3, 4] : [1, 2, 3]).map((i) => <ClaimCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function HonorPageSkeleton() {
  const isDesktop = useIsDesktop();
  return (
    <div style={{ maxWidth: isDesktop ? '1100px' : '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      <div style={{ ...bar('40%', 12, 0.06), margin: '14px 0 12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.2fr 1.1fr' : '1fr', gap: isDesktop ? '24px' : '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '64px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px' }} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={bar('50%', 14, 0.08)} />
              <div style={bar('100%', 6, 0.04)} />
              <div style={bar('70%', 10, 0.04)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '99px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '56px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  const isDesktop = useIsDesktop();
  const column = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ ...bar('45%', 12, 0.06), marginBottom: '4px' }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...bar('45%', 12, 0.08), marginBottom: '6px' }} />
            <div style={bar('30%', 8, 0.04)} />
          </div>
          <div style={bar('44px', 20, 0.08)} />
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ maxWidth: isDesktop ? '1100px' : '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      <div style={{ ...bar('40%', 12, 0.06), margin: '14px 0 14px' }} />
      {isDesktop ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          {column}{column}
        </div>
      ) : (
        <>
          <div style={{ height: '44px', background: 'rgba(255,255,255,0.02)', borderRadius: '99px', marginBottom: '20px' }} />
          {column}
        </>
      )}
    </div>
  );
}

export function ProfileSkeleton() {
  const isDesktop = useIsDesktop();
  return (
    <div style={{ maxWidth: isDesktop ? '1100px' : '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1.2fr' : '1fr', gap: isDesktop ? '32px' : '0px', alignItems: 'start' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={bar('45%', 18, 0.08)} />
          <div style={bar('60%', 10, 0.04)} />
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%' }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: '52px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: isDesktop ? '0' : '24px' }}>
          <div style={{ ...bar('35%', 12, 0.06), marginBottom: '4px' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '80px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
