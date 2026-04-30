interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

const POOL_SIZE = 300;

export class ParticleBurst {
  private pool: BurstParticle[] = [];
  private active: BurstParticle[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.createDead());
    }
  }

  private createDead(): BurstParticle {
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, r: 0, g: 0, b: 0 };
  }

  burst(
    originX: number,
    originY: number,
    count: number,
    r: number,
    g: number,
    b: number,
    speed: number,
    lifeMs: number,
  ): void {
    for (let i = 0; i < count; i++) {
      let p: BurstParticle;
      if (this.pool.length > 0) {
        p = this.pool.pop()!;
      } else if (this.active.length > 0) {
        // Recycle oldest active
        p = this.active.shift()!;
      } else {
        p = this.createDead();
      }

      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.5 + Math.random() * 0.5);
      p.x = originX + (Math.random() - 0.5) * 10;
      p.y = originY + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * v;
      p.vy = Math.sin(angle) * v;
      p.life = 0;
      p.maxLife = lifeMs * (0.6 + Math.random() * 0.4);
      p.size = 1 + Math.random() * 3;
      p.r = r;
      p.g = g;
      p.b = b;
      this.active.push(p);
    }
  }

  draw(ctx: CanvasRenderingContext2D, dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]!;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.pool.push(p);
        this.active.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      // Slight gravity + drag
      p.vy += 0.005 * dt;
      p.vx *= 0.998;

      const progress = p.life / p.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha.toFixed(2)})`;
      ctx.fill();
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  destroy(): void {
    this.pool.length = 0;
    this.active.length = 0;
  }
}
