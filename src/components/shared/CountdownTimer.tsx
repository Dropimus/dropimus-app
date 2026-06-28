/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { C, FONTS } from '../../tokens';
import { isClaimLive } from '../../lib/walletAndGoogle';

interface CountdownTimerProps {
  daysLeft: number;
  status: 'open' | 'dead_zone' | 'proven' | 'faded' | 'resolving' | 'pending_onchain' | 'active';
}

export function CountdownTimer({ daysLeft, status }: CountdownTimerProps) {
  // Let's compute a target date when daysLeft changes. e.g., current time + daysLeft days.
  // To keep it persistent and stable within the session for the specific daysLeft value,
  // we can use the current date + daysLeft * 24h.
  const [targetTime] = useState(() => Date.now() + daysLeft * 24 * 60 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!isClaimLive(status) || daysLeft <= 0) {
      return;
    }

    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime, status, daysLeft]);

  if (!isClaimLive(status)) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: C.sub,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} />
          ESTIMATED TIME TO RESOLVE:
        </span>
        <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: C.text, textTransform: 'uppercase' }}>
          {status === 'dead_zone' ? 'Window Closed / Pending' : `${status} / Settled`}
        </span>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${C.border}`,
      borderRadius: '16px',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 800, color: C.sub, letterSpacing: '0.08em' }}>
          <Clock size={12} color={C.blueLight} />
          RESOLUTION CLOSES IN
        </span>
        <span style={{ fontSize: '9px', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          LIVE ORACLE TICK
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Days card */}
        <div style={{ flex: 1, background: C.elevated, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '8px', color: C.sub, fontWeight: 700, marginTop: '2px', letterSpacing: '0.02em' }}>DAYS</div>
        </div>

        <span style={{ color: C.sub, fontWeight: 800, fontSize: '14px', fontFamily: FONTS.mono }}>:</span>

        {/* Hours card */}
        <div style={{ flex: 1, background: C.elevated, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '8px', color: C.sub, fontWeight: 700, marginTop: '2px', letterSpacing: '0.02em' }}>HRS</div>
        </div>

        <span style={{ color: C.sub, fontWeight: 800, fontSize: '14px', fontFamily: FONTS.mono }}>:</span>

        {/* Minutes card */}
        <div style={{ flex: 1, background: C.elevated, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.text, lineHeight: 1 }}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '8px', color: C.sub, fontWeight: 700, marginTop: '2px', letterSpacing: '0.02em' }}>MINS</div>
        </div>

        <span style={{ color: C.sub, fontWeight: 800, fontSize: '14px', fontFamily: FONTS.mono }}>:</span>

        {/* Seconds card */}
        <div style={{ flex: 1, background: 'rgba(0, 82, 255, 0.05)', border: `1px solid rgba(0, 82, 255, 0.15)`, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: '18px', fontWeight: 800, color: C.blueBright, lineHeight: 1 }}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '8px', color: C.blueLight, fontWeight: 700, marginTop: '2px', letterSpacing: '0.02em' }}>SECS</div>
        </div>
      </div>
    </div>
  );
}

export default CountdownTimer;
