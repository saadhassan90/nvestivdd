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
  speed = 0.35,
  translateX = 0.0,
  translateY = 0.0,
  intensity = 2.2,
  spread = 14.0,
  pulseRate = 0.6,
  shade = 0.55,
  opacity = 0.18,
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

    // Greyscale variant — single luminance channel mirrored to RGB.
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
      void main() {
        vec4 FC = gl_FragCoord;
        vec2 p = (FC.xy * 2.0 - r) / r.y;
        float l = u_intensity - length(p - u_translate);
        vec4 v = tanh(vec4(vec3(u_shade), 0.0) / max(l, -l * u_spread) / exp(mod(dot(FC, sin(FC.yxyx)) + t, 2.0) + sin(t + sin(t / u_pulseRate + p.y))));
        float g = (v.r + v.g + v.b) / 3.0;
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