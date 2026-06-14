/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { C } from '../../tokens';

export function CourtPageSkeleton() {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px 100px' }}>
      {/* 1. Statistics Cards Skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', margin: '14px 0 20px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 10px' }}>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
            <div style={{ height: '18px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '40%' }} />
          </div>
        ))}
      </div>

      {/* 2. Chips Skeleton */}
      <div style={{ display: 'flex', gap: '6px', margin: '10px 0 20px', overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '99px', width: '70px', flexShrink: 0 }} className="animate-pulse" />
        ))}
      </div>

      {/* 3. Sorting Row Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '30%' }} className="animate-pulse" />
        <div style={{ height: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', width: '100px' }} className="animate-pulse" />
      </div>

      {/* 4. Claims Cards Skeletons (3 items) */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', width: '40%' }} />
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '15%' }} />
          </div>
          <div style={{ height: '20px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '85%', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '25%' }} />
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '30%' }} />
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '20%' }} />
            <div style={{ height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', width: '80px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HonorPageSkeleton() {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      {/* 1. Header banner skeleton */}
      <div style={{ height: '36px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', width: '100%', marginBottom: '16px' }} />

      {/* 2. Main credentials box skeleton */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
        {/* Ring skeleton */}
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: '#050505' }} />
        </div>
        {/* Right stats skeleton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '50%' }} />
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', width: '100%' }} />
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '70%' }} />
        </div>
      </div>

      {/* 3. Balance banner */}
      <div style={{ height: '72px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', width: '100%', marginBottom: '20px' }} />

      {/* 4. Tabs & List */}
      <div style={{ height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '99px', display: 'flex', padding: '4px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: '99px' }} />
        <div style={{ flex: 1 }} />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: '56px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '8px' }} />
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '40%', marginBottom: '20px' }} />
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', overflow: 'hidden' }}>
        <div style={{ height: '44px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}` }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '40%', marginBottom: '6px' }} />
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '25%' }} />
            </div>
            <div style={{ width: '50px', height: '14px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 16px 100px' }} className="animate-pulse">
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ height: '18px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', width: '40%' }} />
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '30%' }} />
      </div>
      <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', width: '35%', marginBottom: '12px' }} />
      {[1, 2].map((i) => (
        <div key={i} style={{ height: '80px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', marginBottom: '12px' }} />
      ))}
    </div>
  );
}
