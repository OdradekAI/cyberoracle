'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { HitRegistry } from './hit-detection';
import { CrystalBall } from './CrystalBall';

/**
 * 4-layer canvas rendering architecture:
 * 1. OffscreenCanvas — static background, rendered once
 * 2. Background canvas — slow updates (~10fps), code rain, distant particles
 * 3. Main canvas — requestAnimationFrame (60fps), interactive elements
 * 4. HTML overlay — positioned absolutely for modals, tooltips, inputs
 */

function drawStaticBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
) {
  // Dark cyberpunk background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(100, 80, 160, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Subtle radial glow in center
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.min(width, height) * 0.5,
  );
  gradient.addColorStop(0, 'rgba(80, 50, 120, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export default function CanvasStage() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const registryRef = useRef<HitRegistry>(new HitRegistry());
  const crystalBallRef = useRef<CrystalBall | null>(null);
  const [cursor, setCursor] = useState<React.CSSProperties['cursor']>('default');

  const resize = useCallback(() => {
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!bgCanvas || !mainCanvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    for (const canvas of [bgCanvas, mainCanvas]) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!bgCanvas || !mainCanvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Set canvas sizes
    for (const canvas of [bgCanvas, mainCanvas]) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }

    // Layer 1: OffscreenCanvas — render static background once
    const offscreen = new OffscreenCanvas(width * dpr, height * dpr);
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.scale(dpr, dpr);
      drawStaticBackground(offCtx, width, height);
    }

    const bgCtx = bgCanvas.getContext('2d');
    const mainCtx = mainCanvas.getContext('2d');

    // Wire registry cursor callback
    registryRef.current.onCursorChange((c) => setCursor(c));

    // Create crystal ball
    const ball = new CrystalBall(width, height);
    ball.registerHit(registryRef.current);
    crystalBallRef.current = ball;

    // Layer 2: Background canvas — stamp static bg + slow animations (~10fps)
    const BG_FRAME_SKIP = 6; // update every 6th frame (~10fps at 60fps)
    function drawBackground() {
      if (!bgCtx) return;
      // Stamp the pre-rendered static background
      bgCtx.drawImage(offscreen as CanvasImageSource, 0, 0, width, height);
    }
    drawBackground();

    // Layer 3: Main canvas — rAF loop (60fps)
    function mainLoop() {
      if (!mainCtx) return;
      frameCountRef.current++;
      const t = performance.now();

      // Clear main canvas
      mainCtx.clearRect(0, 0, width, height);

      // Update background at ~10fps
      if (frameCountRef.current % BG_FRAME_SKIP === 0) {
        drawBackground();
      }

      // Draw crystal ball
      ball.draw(mainCtx, t, 16.67);

      rafRef.current = requestAnimationFrame(mainLoop);
    }
    rafRef.current = requestAnimationFrame(mainLoop);

    // Mouse event handlers for hit detection
    function onMouseMove(e: MouseEvent) {
      const mc = mainCanvasRef.current;
      if (!mc) return;
      const rect = mc.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      registryRef.current.handleMouseMove(mx, my);
      ball.setMousePosition(mx, my);
    }
    function onMouseClick(e: MouseEvent) {
      const mc = mainCanvasRef.current;
      if (!mc) return;
      const rect = mc.getBoundingClientRect();
      registryRef.current.handleClick(e.clientX - rect.left, e.clientY - rect.top);
    }
    mainCanvas.addEventListener('mousemove', onMouseMove);
    mainCanvas.addEventListener('click', onMouseClick);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ball.destroy();
      crystalBallRef.current = null;
      mainCanvas.removeEventListener('mousemove', onMouseMove);
      mainCanvas.removeEventListener('click', onMouseClick);
      window.removeEventListener('resize', resize);
    };
  }, [resize]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={bgCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      <canvas
        ref={mainCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          cursor,
        }}
      />
      {/* Layer 4: HTML overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {/* Placeholder: center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(200, 180, 230, 0.6)',
            fontFamily: 'serif',
            fontSize: '14px',
            letterSpacing: 4,
            pointerEvents: 'auto',
          }}
        >
          赛博玄学馆
        </div>
      </div>
    </div>
  );
}
