/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';

interface SentimentOrbProps {
  proven: number;
  faded: number;
  size?: number;
  animate?: boolean;
}

export function SentimentOrb({ proven = 50, faded = 50, size = 88, animate = true }: SentimentOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Normalize percentages to sum to 100
  let displayProven = proven;
  let displayFaded = faded;
  const sum = proven + faded;
  if (sum === 0) {
    displayProven = 50;
    displayFaded = 50;
  } else {
    displayProven = Math.round((proven / sum) * 100);
    displayFaded = 100 - displayProven;
  }

  const provenLeads = displayProven >= 50;
  const state = provenLeads ? 'proven' : 'faded';

  const leadColor  = state === 'proven' ? '#10B981' : '#D93050';
  const deepColor  = state === 'proven' ? '#062013' : '#300810';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.34; // Sphere radius

    const fillPct = provenLeads ? displayProven / 100 : displayFaded / 100;

    const draw = () => {
      if (!ctx || !canvas) return;

      // Update phase for sine waves
      if (animate) {
        phaseRef.current += 0.025;
      }
      const wavePhase = phaseRef.current;

      ctx.save();
      // Clear canvas with raw pixels (respecting DPR)
      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.scale(dpr, dpr);

      // 1. Outer ambient radial glow
      const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.8);
      outerGlow.addColorStop(0, leadColor + '1C');
      outerGlow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // 2. Dark sphere base fill (solid dark shell)
      const baseGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.3, 0, cx, cy, r);
      baseGrad.addColorStop(0, deepColor + 'FA');
      baseGrad.addColorStop(0.6, deepColor + 'CC');
      baseGrad.addColorStop(1, deepColor + '88');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = baseGrad;
      ctx.fill();

      // 3. Liquid fill & Waves (Clips to sphere boundary)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      const fillH = r * 2 * Math.max(0.08, fillPct);
      const fillY = cy + r - fillH; // liquid top line

      // Linear gradient for liquid fill
      const liquidGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      liquidGrad.addColorStop(0, leadColor + '00');
      liquidGrad.addColorStop(Math.max(0, 1 - fillPct), leadColor + '00');
      liquidGrad.addColorStop(1, leadColor + '70');

      ctx.fillStyle = liquidGrad;
      ctx.fillRect(cx - r, fillY - 10, r * 2, fillH + 20);

      // Layered sine waves drawing
      // Wave 1: Primary
      ctx.beginPath();
      ctx.moveTo(cx - r, fillY);
      for (let x = cx - r; x <= cx + r; x += 1.5) {
        const wave = Math.sin((x - cx) * 0.16 + wavePhase) * 2.2;
        ctx.lineTo(x, fillY + wave);
      }
      ctx.lineTo(cx + r, cy + r * 2);
      ctx.lineTo(cx - r, cy + r * 2);
      ctx.closePath();
      ctx.fillStyle = leadColor + '20';
      ctx.fill();

      // Wave 2: Secondary offset phase
      ctx.beginPath();
      ctx.moveTo(cx - r, fillY);
      for (let x = cx - r; x <= cx + r; x += 1.5) {
        const wave = Math.sin((x - cx) * 0.12 + wavePhase * 1.3) * 1.6;
        ctx.lineTo(x, fillY + wave);
      }
      ctx.lineTo(cx + r, cy + r * 2);
      ctx.lineTo(cx - r, cy + r * 2);
      ctx.closePath();
      ctx.fillStyle = leadColor + '15';
      ctx.fill();

      ctx.restore(); // end of sphere boundary clip

      // 4. Glass shell overlay
      const shellGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.32, 0, cx, cy, r);
      shellGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
      shellGrad.addColorStop(0.4, 'rgba(255,255,255,0.02)');
      shellGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = shellGrad;
      ctx.fill();

      // 5. Sphere stroke outline
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = leadColor + '55';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 6. Outer arc ring
      const outerR = r + 8;
      // Background full dim track
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = leadColor + '12';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Glowing progress arc
      const endAngle = (fillPct * Math.PI * 2) - (Math.PI / 2);
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, -Math.PI / 2, endAngle);
      ctx.strokeStyle = leadColor + 'AA';
      ctx.lineWidth = 2.0;
      // Slight shadow to replicate live glow
      ctx.shadowColor = leadColor;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // 7. Specular highlight (glass glint)
      const hlX = cx - r * 0.28;
      const hlY = cy - r * 0.28;
      const hlR = r * 0.18;
      const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.40)');
      hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.10)');
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
      ctx.fillStyle = hlGrad;
      ctx.fill();

      // 8. Text display inside orb
      // Percentage integer value
      ctx.fillStyle = leadColor + 'EA';
      ctx.font = `800 ${Math.round(size * 0.18)}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `${Math.round(provenLeads ? displayProven : displayFaded)}%`,
        cx,
        cy - size * 0.03
      );

      // Sub-label
      ctx.fillStyle = leadColor + '8C';
      ctx.font = `700 ${Math.round(size * 0.08)}px 'Inter', sans-serif`;
      ctx.letterSpacing = '0.08em';
      ctx.fillText(
        provenLeads ? 'BELIEVE' : 'DOUBT',
        cx,
        cy + size * 0.14
      );

      ctx.restore();

      // Schedule next frame
      if (animate) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [displayProven, displayFaded, size, animate]);

  // CSS Animations mapping for realistic float and glowing
  const glowClass = state === 'proven' ? 'animate-orbProven' : 'animate-orbFaded';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Interactive Floating Orb Container */}
      <div
        className={glowClass}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          animation: 'float 4.5s ease-in-out infinite',
          background: 'transparent',
          position: 'relative',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      {/* Dual percentage timeline row */}
      <div style={{ width: size, height: 3, background: 'rgba(217, 48, 80, 0.15)', borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
        <div
          style={{
            height: '100%',
            width: `${displayProven}%`,
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.5), #10B981)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: size, marginTop: 4 }}>
        <span style={{ color: '#10B981', fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {displayProven}%
        </span>
        <span style={{ color: '#D93050', fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {displayFaded}%
        </span>
      </div>
    </div>
  );
}
export default SentimentOrb;
