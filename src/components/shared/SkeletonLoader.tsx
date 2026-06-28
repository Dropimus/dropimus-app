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

// Matches the redesigned ClaimCard: header pills, statement, the believe-vs-
// doubt market chart, a row of stat pills, anchored-by row, and action buttons.
function ClaimCardSkeleton() {
  return (
    <div className="animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '16px' }}>
      {/* Header: category + status pills */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ ...bar('34%', 20, 0.08), borderRadius: '99px' }} />
        <div style={{ ...bar('22%', 20, 0.05), borderRadius: '99px' }} />
      </div>

      {/* Claim statement */}
      <div style={{ ...bar('94%', 15, 0.1), marginBottom: '6px' }} />
      <div style={{ ...bar('58%', 15, 0.1), marginBottom: '14px' }} />

      {/* Market chart block: label row, chart area, footer row */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={bar('34%', 8, 0.06)} />
          <div style={bar('14%', 8, 0.05)} />
        </div>
        <div style={{ width: '72%', height: '70px', margin: '0 auto', borderRadius: '10px', background: 'rgba(255,255,255,0.035)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={bar('26%', 9, 0.06)} />
          <div style={bar('30%', 9, 0.04)} />
          <div style={bar('22%', 9, 0.06)} />
        </div>
      </div>

      {/* Economic stat pills (horizontal) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }} />)}
      </div>

      {/* Anchored-by row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
        <div style={bar('45%', 11, 0.05)} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ ...bar('50%', 38, 0.08), borderRadius: '12px' }} />
        <div style={{ ...bar('50%', 38, 0.04), borderRadius: '12px' }} />
      </div>
    </div>
  );
}

export function CourtPageSkeleton() {
  const isDesktop = useIsDesktop();
  return (
    <div style={{ maxWidth: isDesktop ? '1100px' : '560px', margin: '0 auto', padding: '0 16px 100px' }}>
      {/* Header: title + subtitle on the left, inline telemetry ticker right */}
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '12px', margin: '14px 0 18px', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={bar(isDesktop ? '180px' : '55%', 20, 0.1)} />
          <div style={bar(isDesktop ? '150px' : '40%', 8, 0.05)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: isDesktop ? 'flex-end' : 'space-between' }}>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: '1px', height: '12px', background: C.border }} />}
              <div style={bar('64px', 12, 0.07)} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Control deck: category scroller + filter controls */}
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '8px', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '6px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', width: '72px', flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ height: '28px', width: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
          <div style={{ height: '28px', width: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
        </div>
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
          {/* Earn-Honor onboarding card (tall) */}
          <div style={{ height: '150px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px' }} />
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
