'use client';

import { useEffect, useRef } from 'react';

type Props = {
  speed?: number;
  translateX?: number;
  translateY?: number;
  intensity?: number;
  spread?: number;
  pulseRate?: number;
  shade?: number; // greyscale brightness 0..1
  opacity?: number;
  className?: string;
};

const SolarFlareBackground = ({
  speed = 0.15,
  translateX = 0.0,
  translateY = -0.05,
  intensity = 1.0,
  spread = 14.0,
  pulseRate = 0.6,
  shade = 1.0,
  opacity = 1.0,
  className,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) return;

    const vsSource = `#version 300 es
      in vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    // Greyscale eclipse: dark disc with a luminous crescent rim and grain.
    const fsSource = `#version 300 es
      precision highp float;
      uniform vec2 r;
      uniform float t;
      uniform vec2 u_translate;
      uniform float u_intensity;
      uniform float u_spread;
      uniform float u_pulseRate;
      uniform float u_shade;
      out vec4 o;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - r) / r.y;
        vec2 c = u_translate;
        float d = length(p - c);

        // Disc radius (scaled by intensity for sizing control)
        float R = 0.85 * u_intensity;

        // Asymmetric corona brightness — brightest on the right limb
        float ang = atan(p.y - c.y, p.x - c.x);
        float pulse = 0.85 + 0.15 * sin(t * u_pulseRate);
        float asym = pow(max(0.0, 0.5 + 0.5 * cos(ang + 0.2 + 0.05 * sin(t * 0.3))), 1.6);

        // Thin bright rim hugging the disc edge
        float rimWidth = 0.012;
        float rim = exp(-pow((d - R) / rimWidth, 2.0));

        // Outer corona falloff (only outside the disc)
        float outside = step(R, d);
        float corona = exp(-(d - R) * 4.5) * outside;

        // Subtle inner edge bleed
        float inner = exp(-pow((R - d) / 0.04, 2.0)) * (1.0 - outside) * 0.25;

        // Film grain
        float grain = (hash(gl_FragCoord.xy + floor(t * 30.0)) - 0.5) * 0.06;

        float g = (rim * 1.4 + corona * 0.9 + inner) * asym * pulse;
        g += grain * (0.4 + 0.6 * corona); // grain stronger in lit corona
        g *= u_shade;
        g = clamp(g, 0.0, 1.0);

        o = vec4(vec3(g), 1.0);
      }
    `;

    const createShader = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const program = gl.createProgram();
    if (!program) return;
    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const rLoc = gl.getUniformLocation(program, 'r');
    const tLoc = gl.getUniformLocation(program, 't');
    const trLoc = gl.getUniformLocation(program, 'u_translate');
    const inLoc = gl.getUniformLocation(program, 'u_intensity');
    const spLoc = gl.getUniformLocation(program, 'u_spread');
    const puLoc = gl.getUniformLocation(program, 'u_pulseRate');
    const shLoc = gl.getUniformLocation(program, 'u_shade');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    const start = performance.now();
    const render = () => {
      gl.useProgram(program);
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.uniform1f(tLoc, ((performance.now() - start) / 1000) * speed);
      gl.uniform2f(trLoc, translateX, translateY);
      gl.uniform1f(inLoc, intensity);
      gl.uniform1f(spLoc, spread);
      gl.uniform1f(puLoc, pulseRate);
      gl.uniform1f(shLoc, shade);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, translateX, translateY, intensity, spread, pulseRate, shade]);

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
        opacity,
        pointerEvents: 'none',
        filter: 'grayscale(1)',
      }}
    />
  );
};

export default SolarFlareBackground;