import { HitRegistry } from './hit-detection';

const FOG_COLORS = ['#A855F7', '#7C3AED', '#6366F1', '#22D3EE'];
const BALL_RADIUS_RATIO = 0.12;
const L3_PERIOD = 2;
const PARTICLE_SPAWN_RATE = 7;
const PARTICLE_MAX = 30;

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
        // M2-028 will implement the dramatic sequence
      },
    });
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
    const { cx, cy, radius, hovered } = this;
    const timeSec = t * 0.001;

    const scale = hovered ? 1.05 : 1;
    const fogSpeed = hovered ? 1.5 : 1;
    const r = radius * scale;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer halo (amplitude 80-100%)
    const haloAlpha = 0.15 + 0.1 * Math.sin(timeSec * 2);
    const haloGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * (hovered ? 1.6 : 1.35));
    haloGrad.addColorStop(0, `rgba(168, 85, 247, ${haloAlpha})`);
    haloGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * (hovered ? 1.6 : 1.35), 0, Math.PI * 2);
    ctx.fill();

    // Fog rotation offset (hover: shift toward mouse)
    let fogOffsetX = 0;
    let fogOffsetY = 0;
    if (hovered) {
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
    ctx.strokeStyle = hovered ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = hovered ? 2 : 1;
    ctx.stroke();

    // Surface highlight (glass reflection) — slow sweep
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
    this.updateParticles(ctx, dt);

    ctx.restore(); // end translate
  }

  private updateParticles(ctx: CanvasRenderingContext2D, dt: number): void {
    const r = this.radius * (this.hovered ? 1.05 : 1);

    // Spawn
    const dtSec = dt * 0.001;
    this.spawnAccum += PARTICLE_SPAWN_RATE * dtSec;
    while (this.spawnAccum >= 1 && this.particles.length < PARTICLE_MAX) {
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
      const colorProgress = progress;
      const isPurple = colorProgress < 0.6;
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
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
