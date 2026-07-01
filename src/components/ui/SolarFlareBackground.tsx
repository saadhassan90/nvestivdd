'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Radius of the mouse glow in px */
  glowRadius?: number;
  /** Glow color, defaults to a soft neutral */
  glowColor?: string;
  /** Dot color */
  dotColor?: string;
  /** Background color */
  bgColor?: string;
  /** Dot spacing in px */
  dotSpacing?: number;
  /** Dot size in px */
  dotSize?: number;
  className?: string;
};

/**
 * Stitch-style background: white canvas with a subtle grey dot grid,
 * plus a soft glow that follows the mouse pointer.
 */
const SolarFlareBackground = ({
  glowRadius = 380,
  glowColor = 'rgba(120, 120, 120, 0.18)',
  dotColor = 'rgba(0, 0, 0, 0.14)',
  bgColor = '#ffffff',
  dotSpacing = 22,
  dotSize = 1.2,
  className,
}: Props) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const glow = glowRef.current;
    if (!wrap || !glow) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = -9999;
    let cy = -9999;

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
      if (cx === -9999) {
        cx = tx;
        cy = ty;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      glow.style.transform = `translate3d(${cx - glowRadius}px, ${cy - glowRadius}px, 0)`;
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [glowRadius]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: bgColor,
        backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
        backgroundPosition: '0 0',
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: glowRadius * 2,
          height: glowRadius * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
          transform: `translate3d(-9999px, -9999px, 0)`,
          filter: 'blur(20px)',
          willChange: 'transform',
        }}
      />
    </div>
  );
};

export default SolarFlareBackground;