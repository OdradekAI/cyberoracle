interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

const POOL_SIZE = 150;
const SIZE_MIN = 1;
const SIZE_MAX = 3;
const SPEED_MIN = 0.5;
const SPEED_MAX = 1.2;
const DRIFT_MAX = 0.3;
const ALPHA_MIN = 0.15;
const ALPHA_MAX = 0.5;

const TIER_COUNTS: Record<string, number> = {
  low: 50,
  mid: 100,
  high: 150,
};

const COLORS = [
  'rgba(168, 85, 247,',
  'rgba(139, 92, 246,',
  'rgba(124, 58, 237,',
  'rgba(192, 132, 252,',
];

export class AmbientParticles {
  private pool: AmbientParticle[] = [];
  private activeCount: number;
  private width: number;
  private height: number;
  private reducedMotion: boolean;

  constructor(width: number, height: number, tier: string = 'mid') {
    this.width = width;
    this.height = height;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.activeCount = this.reducedMotion ? 0 : (TIER_COUNTS[tier] ?? 100);

    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.createParticle(true));
    }
  }

  private createParticle(randomY: boolean): AmbientParticle {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : -Math.random() * 20,
      vx: (Math.random() - 0.5) * DRIFT_MAX * 2,
      vy: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
      size: SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
      alpha: ALPHA_MIN + Math.random() * (ALPHA_MAX - ALPHA_MIN),
      phase: Math.random() * Math.PI * 2,
    };
  }

  setTier(tier: string): void {
    this.activeCount = this.reducedMotion ? 0 : (TIER_COUNTS[tier] ?? 100);
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    if (this.activeCount === 0) return;

    const timeSec = t * 0.001;
    const count = Math.min(this.activeCount, this.pool.length);

    for (let i = 0; i < count; i++) {
      const p = this.pool[i]!;

      // Update position
      p.x += p.vx + Math.sin(timeSec + p.phase) * 0.15;
      p.y += p.vy;

      // Recycle if off-screen
      if (p.y > this.height + 5) {
        p.y = -5;
        p.x = Math.random() * this.width;
      }
      if (p.x < -5) p.x = this.width + 5;
      if (p.x > this.width + 5) p.x = -5;

      // Pulsing alpha
      const pulseAlpha = p.alpha * (0.7 + 0.3 * Math.sin(timeSec * 0.5 + p.phase));
      const colorIdx = i % COLORS.length;
      const color = COLORS[colorIdx]!;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${pulseAlpha.toFixed(2)})`;
      ctx.fill();
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  destroy(): void {
    this.pool.length = 0;
  }
}
