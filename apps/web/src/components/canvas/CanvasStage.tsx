'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { HitRegistry } from './hit-detection';
import { CrystalBall } from './CrystalBall';
import { TarotGroup } from './TarotGroup';
import { NeonSigns } from './NeonSigns';
import { BackgroundLayer0 } from './BackgroundLayer0';
import { BaguaDiagram } from './BaguaDiagram';
import { PalmDiagram } from './PalmDiagram';
import { FortuneSticks } from './FortuneSticks';
import { CyberCat } from './CyberCat';
import { OracleGirl } from './OracleGirl';
import { PoetryScroll } from './PoetryScroll';
import { AmbientParticles } from './ambient-particles';
import { ParticleBurst } from './particle-burst';

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
  const tarotRef = useRef<TarotGroup | null>(null);
  const neonRef = useRef<NeonSigns | null>(null);
  const bgLayer0Ref = useRef<BackgroundLayer0 | null>(null);
  const baguaRef = useRef<BaguaDiagram | null>(null);
  const palmDiagramRef = useRef<PalmDiagram | null>(null);
  const fortuneSticksRef = useRef<FortuneSticks | null>(null);
  const cyberCatRef = useRef<CyberCat | null>(null);
  const oracleGirlRef = useRef<OracleGirl | null>(null);
  const poetryScrollRef = useRef<PoetryScroll | null>(null);
  const ambientParticlesRef = useRef<AmbientParticles | null>(null);
  const particleBurstRef = useRef<ParticleBurst | null>(null);
  const [cursor, setCursor] = useState<React.CSSProperties['cursor']>('default');
  const [baziPanelOpen, setBaziPanelOpen] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escape key listener for bazi panel
  useEffect(() => {
    if (!baziPanelOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setBaziPanelOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [baziPanelOpen]);

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

    if (crystalBallRef.current) crystalBallRef.current.resize(width, height);
    if (tarotRef.current) tarotRef.current.resize(width, height);
    if (neonRef.current) neonRef.current.resize(width, height);
    if (bgLayer0Ref.current) bgLayer0Ref.current.resize(width, height);
    if (baguaRef.current) baguaRef.current.resize(width, height);
    if (palmDiagramRef.current) palmDiagramRef.current.resize(width, height);
    if (fortuneSticksRef.current) fortuneSticksRef.current.resize(width, height);
    if (cyberCatRef.current) cyberCatRef.current.resize(width, height);
    if (oracleGirlRef.current) oracleGirlRef.current.resize(width, height);
    if (poetryScrollRef.current) poetryScrollRef.current.resize(width, height);
    if (ambientParticlesRef.current) ambientParticlesRef.current.resize(width, height);
    if (particleBurstRef.current) particleBurstRef.current.resize(width, height);
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

    // Create tarot card group
    const tarot = new TarotGroup(width, height);
    tarot.registerHit(registryRef.current);
    tarotRef.current = tarot;

    // Wire crystal ball sequence → tarot group + particle bursts
    const ballCx = width / 2;
    const ballCy = height / 2;
    ball.setSequenceCallback((phase, _selectedCard) => {
      tarot.setSequencePhase(phase, _selectedCard);
      if (phase === 'buildup') {
        // T+300: 200+ purple burst from crystal ball
        particleBurst.burst(ballCx, ballCy, 200, 168, 85, 247, 3, 1500);
      }
      if (phase === 'resolution') {
        // T+2400: 50 gold starlight particles
        particleBurst.burst(ballCx, ballCy + 80, 50, 255, 215, 0, 2, 2000);
      }
    });

    // Create neon signs
    const neon = new NeonSigns(width, height);
    neonRef.current = neon;

    // Create background layer 0
    const bgLayer0 = new BackgroundLayer0(width, height);
    bgLayer0Ref.current = bgLayer0;

    // Create bagua diagram
    const bagua = new BaguaDiagram(width, height);
    bagua.registerHit(registryRef.current);
    baguaRef.current = bagua;

    // Listen for bagua click → open bazi panel
    function onBaguaClick() {
      setBaziPanelOpen(true);
    }
    window.addEventListener('bagua-click', onBaguaClick);

    // Create palm diagram
    const palmDiagram = new PalmDiagram(width, height);
    palmDiagram.registerHit(registryRef.current);
    palmDiagramRef.current = palmDiagram;

    // Listen for palm diagram click → navigate to upload
    function onPalmDiagramClick() {
      window.location.href = '/upload?kind=palm';
    }
    window.addEventListener('palm-diagram-click', onPalmDiagramClick);

    // Create fortune stick containers
    const fortuneSticks = new FortuneSticks(width, height);
    fortuneSticks.registerHit(registryRef.current);
    fortuneSticksRef.current = fortuneSticks;

    // Create cyber cat
    const cyberCat = new CyberCat(width, height);
    cyberCat.registerHit(registryRef.current);
    cyberCat.setDrawFortuneCallback(() => {
      fortuneSticks.triggerDraw();
    });
    cyberCatRef.current = cyberCat;

    // Create oracle girl
    const oracleGirl = new OracleGirl(width, height);
    oracleGirl.registerHit(registryRef.current);
    oracleGirl.setSpeechCallback((text: string) => {
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      setSpeechBubble(text);
      speechTimerRef.current = setTimeout(() => setSpeechBubble(null), 3000);
    });
    oracleGirlRef.current = oracleGirl;

    // Create poetry scroll
    const poetryScroll = new PoetryScroll(width, height);
    poetryScroll.registerHit(registryRef.current);
    poetryScrollRef.current = poetryScroll;

    // Create ambient particles (drawn on background canvas)
    const ambientParticles = new AmbientParticles(width, height);
    ambientParticlesRef.current = ambientParticles;

    // Create particle burst system (for fortune sequence effects)
    const particleBurst = new ParticleBurst(width, height);
    particleBurstRef.current = particleBurst;

    // Layer 2: Background canvas — stamp static bg + slow animations (~10fps)
    const BG_FRAME_SKIP = 6; // update every 6th frame (~10fps at 60fps)
    let prevBgTime = performance.now();
    function drawBackground(t: number) {
      if (!bgCtx) return;
      const bgDt = t - prevBgTime;
      prevBgTime = t;
      // Stamp the pre-rendered static background
      bgCtx.drawImage(offscreen as CanvasImageSource, 0, 0, width, height);
      // Draw background layer 0 (code rain, particles, halos)
      bgLayer0.draw(bgCtx, t, bgDt);
      // Draw neon signs on background canvas
      neon.draw(bgCtx, t);
      // Draw ambient particles
      ambientParticles.draw(bgCtx, t);
    }
    drawBackground(performance.now());

    // Layer 3: Main canvas — rAF loop (60fps)
    function mainLoop() {
      if (!mainCtx) return;
      frameCountRef.current++;
      const t = performance.now();

      // Clear main canvas
      mainCtx.clearRect(0, 0, width, height);

      // Update background at ~10fps
      if (frameCountRef.current % BG_FRAME_SKIP === 0) {
        drawBackground(t);
      }

      // Draw oracle girl (behind crystal ball)
      oracleGirl.draw(mainCtx, t);

      // Draw crystal ball
      ball.draw(mainCtx, t, 16.67);

      // Draw bagua diagram
      bagua.draw(mainCtx, t);

      // Draw tarot cards
      tarot.draw(mainCtx, t);

      // Draw palm diagram
      palmDiagram.draw(mainCtx, t);

      // Draw fortune stick containers
      fortuneSticks.draw(mainCtx, t);

      // Draw cyber cat
      cyberCat.draw(mainCtx, t);

      // Draw poetry scroll
      poetryScroll.draw(mainCtx, t);

      // Draw particle bursts (fortune sequence effects)
      particleBurst.draw(mainCtx, 16.67);

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
      tarot.setMousePosition(mx, my);
      cyberCat.setMousePosition(mx, my);
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
      tarot.destroy();
      tarotRef.current = null;
      neon.destroy();
      neonRef.current = null;
      bgLayer0.destroy();
      bgLayer0Ref.current = null;
      bagua.destroy();
      baguaRef.current = null;
      palmDiagram.destroy();
      palmDiagramRef.current = null;
      fortuneSticks.destroy();
      fortuneSticksRef.current = null;
      cyberCat.destroy();
      cyberCatRef.current = null;
      oracleGirl.destroy();
      oracleGirlRef.current = null;
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      poetryScroll.destroy();
      poetryScrollRef.current = null;
      ambientParticles.destroy();
      ambientParticlesRef.current = null;
      particleBurst.destroy();
      particleBurstRef.current = null;
      window.removeEventListener('bagua-click', onBaguaClick);
      window.removeEventListener('palm-diagram-click', onPalmDiagramClick);
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
        {/* Bazi input panel */}
        {baziPanelOpen && (
          <div
            onClick={() => setBaziPanelOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(15, 12, 25, 0.95)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 12,
                padding: 24,
                minWidth: 280,
                color: 'rgba(200, 180, 230, 0.9)',
                fontFamily: 'serif',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 18, textAlign: 'center' }}>生辰八字</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  id="bazi-year"
                  placeholder="年"
                  style={{
                    flex: 1,
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: 6,
                    padding: '8px 6px',
                    color: 'rgba(200, 180, 230, 0.9)',
                    fontSize: 14,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <input
                  id="bazi-month"
                  placeholder="月"
                  style={{
                    flex: 1,
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: 6,
                    padding: '8px 6px',
                    color: 'rgba(200, 180, 230, 0.9)',
                    fontSize: 14,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <input
                  id="bazi-day"
                  placeholder="日"
                  style={{
                    flex: 1,
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: 6,
                    padding: '8px 6px',
                    color: 'rgba(200, 180, 230, 0.9)',
                    fontSize: 14,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <input
                  id="bazi-hour"
                  placeholder="时"
                  style={{
                    flex: 1,
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: 6,
                    padding: '8px 6px',
                    color: 'rgba(200, 180, 230, 0.9)',
                    fontSize: 14,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const year = (document.getElementById('bazi-year') as HTMLInputElement)?.value;
                  const month = (document.getElementById('bazi-month') as HTMLInputElement)?.value;
                  const day = (document.getElementById('bazi-day') as HTMLInputElement)?.value;
                  const hour = (document.getElementById('bazi-hour') as HTMLInputElement)?.value;
                  console.log('Bazi submit:', { year, month, day, hour });
                  setBaziPanelOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  borderRadius: 6,
                  color: 'rgba(200, 180, 230, 0.9)',
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                提交
              </button>
            </div>
          </div>
        )}

        {/* Oracle girl speech bubble */}
        {speechBubble && (
          <div
            style={{
              position: 'absolute',
              top: '38%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 12, 25, 0.92)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: 10,
              padding: '10px 18px',
              color: 'rgba(200, 180, 230, 0.95)',
              fontFamily: 'serif',
              fontSize: 15,
              maxWidth: 260,
              textAlign: 'center' as const,
              pointerEvents: 'none',
              animation: 'fadeIn 200ms ease-out',
            }}
          >
            {speechBubble}
          </div>
        )}
      </div>
    </div>
  );
}
