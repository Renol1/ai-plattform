"use client";

import { useEffect, useRef } from 'react';

// Simple WebGL fragment shader visualizer for agent flow.
// Renders 4 nodes in a grid with pulsing glow when active.
// Props.active: boolean[4] in order [SystemAgent, FoodAgent, TrainerAgent, LouAgent]
export default function AgentShader({ active, className = '' }: { active: boolean[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const timeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const locsRef = useRef<{ res?: WebGLUniformLocation | null; time?: WebGLUniformLocation | null; act?: WebGLUniformLocation | null } | null>(null);

  // init GL
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;
    glRef.current = gl;

    const vertSrc = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;
    const fragSrc = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_active[4];

      // positions in NDC-like [0,1] grid
      vec2 nodePos(int i) {
        if (i == 0) return vec2(0.2, 0.7); // System
        if (i == 1) return vec2(0.5, 0.7); // Food
        if (i == 2) return vec2(0.8, 0.7); // Trainer
        return vec2(0.5, 0.35);           // Lou
      }

      float glow(vec2 p, vec2 c, float r) {
        float d = length(p - c);
        return smoothstep(r, 0.0, d);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;

        // base background (deep purple/blue)
        vec3 col = vec3(0.06, 0.05, 0.09);

        // draw links (System->Food->Trainer, Food->Lou, Trainer->Lou)
        vec3 linkCol = vec3(0.50, 0.35, 0.80);
        for (int i = 0; i < 3; i++) {
          vec2 a = nodePos(i);
          vec2 b = nodePos(i == 2 ? 3 : i + 1);
          // distance to segment
          vec2 pa = uv - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          float d = length(pa - ba * h);
          float activePulse = 0.1 + 0.1 * abs(sin(u_time * 2.0));
          float lw = mix(0.002, 0.010, activePulse);
          float s = smoothstep(lw, 0.0, d);
          col += linkCol * s * 0.25;
        }

        // nodes
        for (int i = 0; i < 4; i++) {
          vec2 p = nodePos(i);
          float isOn = u_active[i];
          float pulse = 0.45 + 0.45 * abs(sin(u_time * (1.6 + float(i) * 0.3)));
          float g = glow(uv, p, 0.18 + 0.08 * pulse);
          vec3 base = vec3(0.48, 0.33, 0.78);
          vec3 onCol = mix(vec3(0.36, 0.25, 0.6), vec3(0.75, 0.58, 1.0), pulse);
          col += mix(base * 0.4, onCol, isOn) * g;
          // core circle
          float core = glow(uv, p, 0.04);
          col += mix(vec3(0.18,0.16,0.24), vec3(0.85,0.75,1.0), isOn) * core;
        }

        // vignette
        float vig = smoothstep(1.2, 0.5, length(uv - 0.5));
        col *= mix(0.85, 1.0, vig);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(s));
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    progRef.current = prog;

    // fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const a_pos = gl.getAttribLocation(prog, 'a_pos');
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        3, -1,
        -1, 3,
      ]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    const u_res = gl.getUniformLocation(prog, 'u_res');
    const u_time = gl.getUniformLocation(prog, 'u_time');
    const u_active = gl.getUniformLocation(prog, 'u_active');
    locsRef.current = { res: u_res, time: u_time, act: u_active };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u_res, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      timeRef.current = t;
      gl.uniform1f(u_time, t);
      // draw
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // update active mask
  useEffect(() => {
    const gl = glRef.current; const prog = progRef.current; const locs = locsRef.current;
    if (!gl || !prog || !locs?.act) return;
    const mask = new Float32Array([active[0] ? 1 : 0, active[1] ? 1 : 0, active[2] ? 1 : 0, active[3] ? 1 : 0]);
    gl.useProgram(prog);
    gl.uniform1fv(locs.act, mask);
  }, [active[0], active[1], active[2], active[3]]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-[220px] sm:h-[280px] md:h-[340px] rounded-xl overflow-hidden ${className}`}
      aria-label="Agentflöde (shader)"
    />
  );
}
