'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** Radius of the mouse glow in px */
  glowRadius?: number;
  /** Base dot color (grey) */
  dotColor?: string;
  /** Activated dot color (black) */
  activeDotColor?: string;
  /** Background color */
  bgColor?: string;
  /** Dot spacing in px */
  dotSpacing?: number;
  /** Dot size in px */
  dotSize?: number;
  className?: string;
};

/**
 * Stitch-style background: white canvas with a subtle grey dot grid.
 * Dots near the cursor glow black instead of grey.
 */
const SolarFlareBackground = ({
  glowRadius = 280,
  dotColor = 'rgba(0, 0, 0, 0.14)',
  activeDotColor = 'rgba(0, 0, 0, 0.85)',
  bgColor = '#ffffff',
  dotSpacing = 22,
  dotSize = 1.2,
  className,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const mouseRef = useRef({ tx: -9999, ty: -9999, cx: -9999, cy: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const parseRGBA = (rgba: string) => {
      const m = rgba.match(/rgba?\((\s*\d+\s*),\s*(\s*\d+\s*),\s*(\s*\d+\s*)(?:,\s*([\d.]+)\s*)?\)/);
      if (!m) return { r: 0, g: 0, b: 0, a: 1 };
      return {
        r: parseInt(m[1], 10),
        g: parseInt(m[2], 10),
        b: parseInt(m[3], 10),
        a: m[4] !== undefined ? parseFloat(m[4]) : 1,
      };
    };

    const base = parseRGBA(dotColor);
    const active = parseRGBA(activeDotColor);

    const draw = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      const { cx, cy } = mouseRef.current;
      const r2 = glowRadius * glowRadius;

      for (let y = 0; y < h + dotSpacing; y += dotSpacing) {
        for (let x = 0; x < w + dotSpacing; x += dotSpacing) {
          const dx = x - cx;
          const dy = y - cy;
          const dist2 = dx * dx + dy * dy;

          let t = 0;
          if (dist2 < r2) {
            t = 1 - Math.sqrt(dist2) / glowRadius;
            t = t * t * (3 - 2 * t); // smoothstep
          }

          const r = Math.round(base.r + (active.r - base.r) * t);
          const g = Math.round(base.g + (active.g - base.g) * t);
          const b = Math.round(base.b + (active.b - base.b) * t);
          const a = base.a + (active.a - base.a) * t;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fill();
        }
      }
    };

    const tick = () => {
      const m = mouseRef.current;
      m.cx += (m.tx - m.cx) * 0.18;
      m.cy += (m.ty - m.cy) * 0.18;
      draw();
      if (Math.abs(m.tx - m.cx) > 0.5 || Math.abs(m.ty - m.cy) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.tx = e.clientX - rect.left;
      mouseRef.current.ty = e.clientY - rect.top;
      if (mouseRef.current.cx === -9999) {
        mouseRef.current.cx = mouseRef.current.tx;
        mouseRef.current.cy = mouseRef.current.ty;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    resize();
    draw();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [bgColor, dotColor, activeDotColor, dotSpacing, dotSize, glowRadius]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default SolarFlareBackground;
