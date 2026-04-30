import { HitRegistry } from './hit-detection';

const FOG_COLORS = ['#A855F7', '#7C3AED', '#6366F1', '#22D3EE'];
const BALL_RADIUS_RATIO = 0.12;
const L3_PERIOD = 2;
const PARTICLE_SPAWN_RATE = 7;
const PARTICLE_MAX = 30;

// Dramatic sequence timing (ms)
const SETUP_DURATION = 300;
const BUILDUP_END = 2200;
const CLIMAX_FREEZE = 200;
const RESOLUTION_END = 4500;

type SequencePhase = 'idle' | 'setup' | 'buildup' | 'climax' | 'resolution' | 'done';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class CrystalBall {
  private cx: number;
  private cy: number;
  private radius: number;
  private hovered = false;
  private mouseX = 0;
  private mouseY = 0;
  private particles: Particle[] = [];
  private spawnAccum = 0;
  private unregisterHit: (() => void) | null = null;

  // Dramatic sequence state
  private seqPhase: SequencePhase = 'idle';
  private seqStart = 0;
  private selectedCardIdx = -1;
  private resultText = '';
  private resultCharIdx = 0;
  private lastCharTime = 0;
  private onSequenceState: ((phase: SequencePhase, selectedCard: number) => void) | null = null;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = Math.min(width, height) * BALL_RADIUS_RATIO;
  }

  registerHit(registry: HitRegistry): void {
    this.unregisterHit = registry.register({
      id: 'crystal-ball',
      bbox: {
        x: this.cx - this.radius,
        y: this.cy - this.radius,
        w: this.radius * 2,
        h: this.radius * 2,
      },
      onHover: () => {
        this.hovered = true;
      },
      onLeave: () => {
        this.hovered = false;
      },
      onClick: () => {
        this.triggerSequence();
      },
    });
  }

  setSequenceCallback(cb: (phase: SequencePhase, selectedCard: number) => void): void {
    this.onSequenceState = cb;
  }

  getPhase(): SequencePhase {
    return this.seqPhase;
  }

  private triggerSequence(): void {
    if (this.seqPhase !== 'idle' && this.seqPhase !== 'done') return;
    this.seqPhase = 'setup';
    this.seqStart = performance.now();
    this.selectedCardIdx = Math.floor(Math.random() * 5);
    this.resultText = '';
    this.resultCharIdx = 0;
    this.lastCharTime = 0;
    this.onSequenceState?.('setup', this.selectedCardIdx);
  }

  cancelSequence(): void {
    this.seqPhase = 'idle';
    this.seqStart = 0;
    this.selectedCardIdx = -1;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = Math.min(width, height) * BALL_RADIUS_RATIO;
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }

  draw(ctx: CanvasRenderingContext2D, t: number, dt: number): void {
    const { cx, cy, radius } = this;
    const timeSec = t * 0.001;
    const elapsed = this.seqStart > 0 ? t - this.seqStart : 0;

    // Advance sequence phase
    this.advancePhase(elapsed);

    // Compute sequence-driven overrides
    const seqScale = this.getSequenceScale(elapsed);
    const fogSpeed = this.getSequenceFogSpeed(elapsed);
    const particleRate = this.getSequenceParticleRate(elapsed);
    const isFrozen = this.seqPhase === 'climax';

    const hoverScale = this.hovered && this.seqPhase === 'idle' ? 1.05 : 1;
    const scale = seqScale * hoverScale;
    const r = radius * scale;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer halo
    const haloAlpha = 0.15 + 0.1 * Math.sin(timeSec * 2);
    const haloMult = this.hovered && this.seqPhase === 'idle' ? 1.6 : 1.35;
    const haloRadius =
      this.seqPhase === 'buildup' ? r * (1.6 + (elapsed / BUILDUP_END) * 0.4) : r * haloMult;
    const haloGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, haloRadius);
    haloGrad.addColorStop(0, `rgba(168, 85, 247, ${haloAlpha})`);
    haloGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fog rotation offset
    let fogOffsetX = 0;
    let fogOffsetY = 0;
    if (this.hovered && this.seqPhase === 'idle') {
      const dx = this.mouseX - cx;
      const dy = this.mouseY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      fogOffsetX = (dx / dist) * r * 0.15;
      fogOffsetY = (dy / dist) * r * 0.15;
    }

    // Clip to ball shape
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    // Internal fog (conic-gradient via segments)
    const fogAngle = (timeSec * fogSpeed * (Math.PI * 2)) / L3_PERIOD;
    const segments = 60;
    for (let i = 0; i < segments; i++) {
      const a0 = fogAngle + (i / segments) * Math.PI * 2;
      const a1 = fogAngle + ((i + 1) / segments) * Math.PI * 2;
      const colorIdx = i % FOG_COLORS.length;

      ctx.beginPath();
      ctx.moveTo(fogOffsetX, fogOffsetY);
      ctx.arc(fogOffsetX, fogOffsetY, r * 1.2, a0, a1);
      ctx.closePath();

      const alpha = 0.25 + 0.15 * Math.sin(timeSec * 1.5 + i * 0.5);
      const fogColor = FOG_COLORS[colorIdx];
      if (fogColor) {
        ctx.fillStyle = hexToRgba(fogColor, alpha);
      }
      ctx.fill();
    }

    // Dark overlay to soften fog edges
    const innerShadow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    innerShadow.addColorStop(0, 'rgba(10, 10, 18, 0)');
    innerShadow.addColorStop(0.7, 'rgba(10, 10, 18, 0.1)');
    innerShadow.addColorStop(1, 'rgba(10, 10, 18, 0.5)');
    ctx.fillStyle = innerShadow;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    ctx.restore(); // end clip

    // Ball border
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const borderAlpha = this.seqPhase !== 'idle' ? 0.7 : this.hovered ? 0.5 : 0.25;
    ctx.strokeStyle = `rgba(168, 85, 247, ${borderAlpha})`;
    ctx.lineWidth = this.seqPhase !== 'idle' ? 2 : this.hovered ? 2 : 1;
    ctx.stroke();

    // Surface highlight
    const highlightAngle = timeSec * 0.3;
    const hlx = Math.cos(highlightAngle) * r * 0.35;
    const hly = Math.sin(highlightAngle) * r * 0.25 - r * 0.15;
    const hlGrad = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, r * 0.4);
    hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = hlGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    // Spawn and update particles
    if (!isFrozen) {
      this.updateParticles(ctx, dt, particleRate);
    }

    // Climax white flash overlay
    if (this.seqPhase === 'climax') {
      const flashElapsed = elapsed - BUILDUP_END;
      const flashAlpha =
        flashElapsed < 80 ? (flashElapsed / 80) * 0.8 : 0.8 * (1 - (flashElapsed - 80) / 120);
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, flashAlpha)})`;
        ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      }
    }

    // Resolution: result text
    if (this.seqPhase === 'resolution' && elapsed >= 3200) {
      this.drawResultText(ctx, r, t, elapsed);
    }

    ctx.restore(); // end translate
  }

  private advancePhase(elapsed: number): void {
    if (this.seqPhase === 'idle' || this.seqPhase === 'done') return;

    if (this.seqPhase === 'setup' && elapsed >= SETUP_DURATION) {
      this.seqPhase = 'buildup';
      this.onSequenceState?.('buildup', this.selectedCardIdx);
    } else if (this.seqPhase === 'buildup' && elapsed >= BUILDUP_END) {
      this.seqPhase = 'climax';
      this.onSequenceState?.('climax', this.selectedCardIdx);
    } else if (this.seqPhase === 'climax' && elapsed >= BUILDUP_END + CLIMAX_FREEZE) {
      this.seqPhase = 'resolution';
      this.onSequenceState?.('resolution', this.selectedCardIdx);
    } else if (this.seqPhase === 'resolution' && elapsed >= RESOLUTION_END) {
      this.seqPhase = 'done';
      this.onSequenceState?.('done', this.selectedCardIdx);
    }
  }

  private getSequenceScale(elapsed: number): number {
    if (this.seqPhase === 'setup') {
      // Bounce: 1.0 → 0.95 → 1.0
      const progress = elapsed / SETUP_DURATION;
      return 1 - 0.05 * Math.sin(progress * Math.PI);
    }
    if (this.seqPhase === 'buildup') {
      // Subtle pulse growing
      const progress = elapsed / BUILDUP_END;
      return 1 + 0.03 * Math.sin(progress * Math.PI * 4) * progress;
    }
    return 1;
  }

  private getSequenceFogSpeed(elapsed: number): number {
    if (this.seqPhase === 'idle' || this.seqPhase === 'done') {
      return this.hovered ? 1.5 : 1;
    }
    if (this.seqPhase === 'setup') return 1.5;
    if (this.seqPhase === 'buildup') {
      const progress = elapsed / BUILDUP_END;
      return 1.5 + progress * 3; // accelerate to 4.5x
    }
    if (this.seqPhase === 'climax') return 0; // frozen
    return 0.5; // slow resolution
  }

  private getSequenceParticleRate(elapsed: number): number {
    if (this.seqPhase === 'idle' || this.seqPhase === 'done') return PARTICLE_SPAWN_RATE;
    if (this.seqPhase === 'buildup') {
      const progress = elapsed / BUILDUP_END;
      return PARTICLE_SPAWN_RATE * (1 + progress * 2); // up to 3x
    }
    return PARTICLE_SPAWN_RATE;
  }

  private drawResultText(
    ctx: CanvasRenderingContext2D,
    r: number,
    t: number,
    elapsed: number,
  ): void {
    const messages = ['命运已揭示', '星辰已排列', '缘分已注定'];
    if (!this.resultText) {
      this.resultText = messages[this.selectedCardIdx % messages.length] ?? messages[0]!;
    }

    // Type in effect: 60ms per character
    const typeStart = 3200;
    const typeElapsed = elapsed - typeStart;
    const targetChars = Math.floor(typeElapsed / 60) + 1;
    if (targetChars > this.resultCharIdx) {
      this.resultCharIdx = Math.min(targetChars, [...this.resultText].length);
    }

    const displayText = [...this.resultText].slice(0, this.resultCharIdx).join('');
    if (!displayText) return;

    const fadeIn = Math.min(1, (elapsed - typeStart) / 500);

    ctx.save();
    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = 'rgba(200, 180, 230, 0.9)';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, 0, r * 1.8);
    ctx.restore();
  }

  private updateParticles(ctx: CanvasRenderingContext2D, dt: number, rate: number): void {
    const r = this.radius * (this.hovered && this.seqPhase === 'idle' ? 1.05 : 1);

    // Spawn
    const dtSec = dt * 0.001;
    this.spawnAccum += rate * dtSec;
    const maxP = this.seqPhase === 'buildup' ? PARTICLE_MAX * 3 : PARTICLE_MAX;
    while (this.spawnAccum >= 1 && this.particles.length < maxP) {
      this.spawnAccum -= 1;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r * 0.4;
      this.particles.push({
        x: Math.cos(angle) * dist,
        y: r * 0.5 + Math.random() * r * 0.2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.5 + Math.random() * 0.8),
        life: 0,
        maxLife: 1500 + Math.random() * 1000,
        size: 1 + Math.random() * 2,
      });
    }

    // Update and draw
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;

      const progress = p.life / p.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.6;
      const isPurple = progress < 0.6;
      const cr = isPurple ? 168 : 34;
      const cg = isPurple ? 85 : 211;
      const cb = isPurple ? 247 : 238;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.fill();
    }
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
    this.particles = [];
    this.cancelSequence();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
