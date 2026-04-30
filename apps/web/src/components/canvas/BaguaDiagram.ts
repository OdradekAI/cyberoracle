import { HitRegistry } from './hit-detection';

const BAGUA_RADIUS_RATIO = 0.06;
const IDLE_PERIOD = 20;
const HOVER_PERIOD = 8;
const GOLD_COLOR = '#9A7B3F';
const TRIGRAM_NAMES = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];

export class BaguaDiagram {
  private cx: number;
  private cy: number;
  private radius: number;
  private rotation = 0;
  private hovered = false;
  private unregisterHit: (() => void) | null = null;
  private reducedMotion = false;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width * 0.15;
    this.cy = height * 0.45;
    this.radius = Math.min(width, height) * BAGUA_RADIUS_RATIO;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  registerHit(registry: HitRegistry): void {
    const hitRadius = this.radius * 1.3;
    this.unregisterHit = registry.register({
      id: 'bagua',
      bbox: {
        x: this.cx - hitRadius,
        y: this.cy - hitRadius,
        w: hitRadius * 2,
        h: hitRadius * 2,
      },
      onHover: () => {
        this.hovered = true;
      },
      onLeave: () => {
        this.hovered = false;
      },
      onClick: () => {
        this.onBaziClick();
      },
    });
  }

  private onBaziClick(): void {
    const event = new CustomEvent('bagua-click');
    window.dispatchEvent(event);
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const _timeSec = t * 0.001;
    const period = this.hovered ? HOVER_PERIOD : IDLE_PERIOD;

    if (!this.reducedMotion) {
      this.rotation += ((Math.PI * 2) / period) * (1 / 60);
    }

    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(this.rotation);

    // Outer octagon
    this.drawOctagon(ctx, this.radius, 'rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.6)');

    // Gold glow on hover
    if (this.hovered) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = GOLD_COLOR;
      this.drawOctagon(ctx, this.radius + 2, 'transparent', GOLD_COLOR);
      ctx.restore();
    }

    // Trigrams around the octagon
    const trigramRadius = this.radius * 0.72;
    ctx.font = `${Math.max(10, this.radius * 0.28)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(200, 180, 230, 0.7)';

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const tx = Math.cos(angle) * trigramRadius;
      const ty = Math.sin(angle) * trigramRadius;
      ctx.fillText(TRIGRAM_NAMES[i]!, tx, ty);
    }

    // Yin-yang center
    this.drawYinYang(ctx, this.radius * 0.38);

    ctx.restore();
  }

  private drawOctagon(
    ctx: CanvasRenderingContext2D,
    radius: number,
    fill: string,
    stroke: string,
  ): void {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    if (fill !== 'transparent') {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawYinYang(ctx: CanvasRenderingContext2D, radius: number): void {
    const r = Math.max(1, radius);

    // White (yang) half — right
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false);
    ctx.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(220, 210, 240, 0.8)';
    ctx.fill();

    // Dark (yin) half — left
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
    ctx.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true);
    ctx.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 20, 50, 0.9)';
    ctx.fill();

    // Small yang dot in yin half (bottom)
    ctx.beginPath();
    ctx.arc(0, r / 2, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220, 210, 240, 0.8)';
    ctx.fill();

    // Small yin dot in yang half (top)
    ctx.beginPath();
    ctx.arc(0, -r / 2, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 20, 50, 0.9)';
    ctx.fill();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width * 0.15;
    this.cy = height * 0.45;
    this.radius = Math.min(width, height) * BAGUA_RADIUS_RATIO;
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }
}
