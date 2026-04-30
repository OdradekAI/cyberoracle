interface DataParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface Halo {
  x: number;
  y: number;
  radius: number;
  color: string;
  period: number;
  phase: number;
}

const CODE_LINES = [
  'import numpy as np',
  'from typing import List',
  'def predict(model, x):',
  '    return model.forward(x)',
  'class FortuneNet:',
  '    def __init__(self):',
  '        self.layers = []',
  '    def train(self, data):',
  '        loss = self.loss_fn()',
  '        loss.backward()',
  '        self.optimizer.step()',
  '    def infer(self, x):',
  '        with torch.no_grad():',
  '            return self.model(x)',
  'def tokenize(text):',
  '    return text.split()',
  'def embed(tokens):',
  '    vec = np.zeros(768)',
  '    return vec',
  'class Attention:',
  '    def forward(self, q, k, v):',
  '        scores = q @ k.T',
  '        weights = softmax(scores)',
  '        return weights @ v',
];

const DATA_PARTICLE_COUNT = 40;
const HALO_COUNT = 4;
const CODE_RAIN_X = 30;
const CODE_RAIN_Y_START = 80;
const CODE_RAIN_LINE_HEIGHT = 16;
const CODE_RAIN_VISIBLE_LINES = 12;
const HIGHLIGHT_INTERVAL = 800;
const PARALLAX_SPEED = 0.2;

export class BackgroundLayer0 {
  private width: number;
  private height: number;
  private particles: DataParticle[] = [];
  private halos: Halo[] = [];
  private codeOffsetY = 0;
  private highlightIdx = 0;
  private lastHighlightTime = 0;
  private parallaxX = 0;
  private reducedMotion = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initParticles();
    this.initHalos();
  }

  private initParticles(): void {
    this.particles = [];
    if (this.reducedMotion) return;

    const colors = ['#A855F7', '#7C3AED', '#22D3EE', '#6366F1'];
    for (let i = 0; i < DATA_PARTICLE_COUNT; i++) {
      const colorIdx = i % colors.length;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4 + PARALLAX_SPEED,
        vy: 0.3 + Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        color: colors[colorIdx]!,
        alpha: 0.3 + Math.random() * 0.4,
      });
    }
  }

  private initHalos(): void {
    this.halos = [];
    const haloColors = ['#A855F7', '#6366F1', '#22D3EE', '#7C3AED'];
    for (let i = 0; i < HALO_COUNT; i++) {
      this.halos.push({
        x: 100 + Math.random() * (this.width - 200),
        y: 100 + Math.random() * (this.height - 200),
        radius: 80 + Math.random() * 120,
        color: haloColors[i % haloColors.length]!,
        period: 6 + Math.random() * 4,
        phase: (i / HALO_COUNT) * Math.PI * 2,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D, t: number, dt: number): void {
    const timeSec = t * 0.001;
    const dtSec = dt * 0.001;

    // Distant neon halos (L0 frequency, 6-10s period)
    this.drawHalos(ctx, timeSec);

    // Data particles
    if (!this.reducedMotion) {
      this.drawParticles(ctx, dt);
    }

    // Code rain (top-left region)
    if (!this.reducedMotion) {
      this.drawCodeRain(ctx, t, timeSec);
    }

    // Update parallax
    this.parallaxX += PARALLAX_SPEED * dtSec;
  }

  private drawHalos(ctx: CanvasRenderingContext2D, timeSec: number): void {
    for (const halo of this.halos) {
      const breathe = Math.sin((timeSec / halo.period) * Math.PI * 2 + halo.phase);
      const opacity = 0.6 + 0.3 * (0.5 + 0.5 * breathe);

      const grad = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, halo.radius);
      const r = parseInt(halo.color.slice(1, 3), 16);
      const g = parseInt(halo.color.slice(3, 5), 16);
      const b = parseInt(halo.color.slice(5, 7), 16);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.15})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.05})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(halo.x, halo.y, halo.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;

      // Wrap around
      if (p.x > this.width + 10) p.x = -10;
      if (p.x < -10) p.x = this.width + 10;
      if (p.y > this.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba').replace('#', '');
      // Use hex to rgba
      const r = parseInt(p.color.slice(1, 3), 16);
      const g = parseInt(p.color.slice(3, 5), 16);
      const b = parseInt(p.color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
      ctx.fill();
    }
  }

  private drawCodeRain(ctx: CanvasRenderingContext2D, t: number, _timeSec: number): void {
    // Update highlight every 800ms
    if (t - this.lastHighlightTime >= HIGHLIGHT_INTERVAL) {
      this.highlightIdx = (this.highlightIdx + 1) % CODE_LINES.length;
      this.lastHighlightTime = t;
    }

    // Slow scroll
    this.codeOffsetY += 0.3;

    const startX = CODE_RAIN_X;
    const startY = CODE_RAIN_Y_START;

    ctx.save();
    // Clip to code rain region (top-left, ~300px wide)
    ctx.beginPath();
    ctx.rect(0, 0, 320, CODE_RAIN_Y_START + CODE_RAIN_LINE_HEIGHT * CODE_RAIN_VISIBLE_LINES);
    ctx.clip();

    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    const scrollOffset = this.codeOffsetY % CODE_RAIN_LINE_HEIGHT;

    for (let i = -1; i < CODE_RAIN_VISIBLE_LINES + 1; i++) {
      const lineIdx =
        (i + Math.floor(this.codeOffsetY / CODE_RAIN_LINE_HEIGHT)) % CODE_LINES.length;
      const safeIdx = ((lineIdx % CODE_LINES.length) + CODE_LINES.length) % CODE_LINES.length;
      const line = CODE_LINES[safeIdx]!;
      const y = startY + i * CODE_RAIN_LINE_HEIGHT - scrollOffset;

      if (y < CODE_RAIN_Y_START - CODE_RAIN_LINE_HEIGHT || y > this.height) continue;

      const isHighlighted = safeIdx === this.highlightIdx;

      if (isHighlighted) {
        // Highlight background
        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.fillRect(startX - 4, y - 1, 300, CODE_RAIN_LINE_HEIGHT);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
      } else {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      }

      ctx.fillText(line, startX, y);
    }

    ctx.restore();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initParticles();
    this.initHalos();
  }

  destroy(): void {
    this.particles = [];
    this.halos = [];
  }
}
