interface NeonSign {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
  glowColor: string;
  period: number;
  phase: number;
  amplitudeMin: number;
  amplitudeMax: number;
  canGlitch: boolean;
  sprite: HTMLCanvasElement | null;
}

const SIGNS_CONFIG = [
  {
    text: '赛博玄学馆',
    font: 'bold 24px serif',
    color: '#A855F7',
    glowColor: '#A855F7',
    period: 2.5,
    phase: 0,
    canGlitch: true,
  },
  {
    text: '今日运势',
    font: '14px sans-serif',
    color: '#22D3EE',
    glowColor: '#22D3EE',
    period: 3,
    phase: 1,
    canGlitch: false,
  },
  {
    text: '八字精批',
    font: '14px sans-serif',
    color: '#22D3EE',
    glowColor: '#22D3EE',
    period: 3,
    phase: 2,
    canGlitch: false,
  },
  {
    text: '上上签',
    font: '16px serif',
    color: '#F59E0B',
    glowColor: '#F59E0B',
    period: 2,
    phase: 0.5,
    canGlitch: false,
  },
] as const;

const GLITCH_MIN_INTERVAL = 8000;
const GLITCH_MAX_INTERVAL = 12000;
const GLITCH_DURATION = 200;
const ENTRY_STAGGER_BASE = 100;
const MAX_SHADOW_BLUR = 8;

export class NeonSigns {
  private signs: NeonSign[] = [];
  private width: number;
  private height: number;
  private mountTime = 0;
  private nextGlitchAt = 0;
  private glitchActive = false;
  private glitchStart = 0;
  private reducedMotion = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initSigns();
  }

  private initSigns(): void {
    const cx = this.width / 2;
    const radius = Math.min(this.width, this.height) * 0.12;

    // Layout: main title above ball, secondary signs around edges
    this.signs = SIGNS_CONFIG.map((cfg, i) => {
      let x: number;
      let y: number;

      if (i === 0) {
        // Main title above crystal ball
        x = cx;
        y = this.height / 2 - radius - 60;
      } else if (i === 1) {
        // Top-left
        x = 80;
        y = 60;
      } else if (i === 2) {
        // Top-right
        x = this.width - 80;
        y = 60;
      } else {
        // Bottom-right
        x = this.width - 80;
        y = this.height - 60;
      }

      return {
        text: cfg.text,
        x,
        y,
        font: cfg.font,
        color: cfg.color,
        glowColor: cfg.glowColor,
        period: cfg.period,
        phase: cfg.phase,
        amplitudeMin: 0.6,
        amplitudeMax: 1,
        canGlitch: cfg.canGlitch,
        sprite: null,
      };
    });

    // Pre-render glow sprites
    for (const sign of this.signs) {
      sign.sprite = this.preRenderGlow(sign.text, sign.font, sign.glowColor);
    }

    // Schedule first glitch
    this.scheduleNextGlitch();
  }

  private preRenderGlow(text: string, font: string, color: string): HTMLCanvasElement {
    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d')!;
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const fontSize = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? '14');
    offscreen.width = Math.ceil(metrics.width + 40);
    offscreen.height = Math.ceil(fontSize * 2.5);
    ctx.font = font;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillText(text, 20, offscreen.height * 0.65);
    return offscreen;
  }

  private scheduleNextGlitch(): void {
    const interval =
      GLITCH_MIN_INTERVAL + Math.random() * (GLITCH_MAX_INTERVAL - GLITCH_MIN_INTERVAL);
    this.nextGlitchAt = performance.now() + interval;
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    if (this.mountTime === 0) this.mountTime = t;
    const timeSec = t * 0.001;
    const sinceMount = t - this.mountTime;

    // Check glitch trigger
    if (!this.reducedMotion && !this.glitchActive && t >= this.nextGlitchAt) {
      this.glitchActive = true;
      this.glitchStart = t;
    }
    if (this.glitchActive && t - this.glitchStart >= GLITCH_DURATION) {
      this.glitchActive = false;
      this.scheduleNextGlitch();
    }

    // Track active shadowBlur usage
    let activeBlur = 0;

    for (let i = 0; i < this.signs.length; i++) {
      const sign = this.signs[i]!;
      const entryDelay = i * ENTRY_STAGGER_BASE;
      const entryProgress = Math.min(1, Math.max(0, (sinceMount - entryDelay) / 500));
      if (entryProgress <= 0) continue;

      // Breathing amplitude
      const breathe = Math.sin((timeSec / sign.period) * Math.PI * 2 + sign.phase);
      const amplitude =
        sign.amplitudeMin + (sign.amplitudeMax - sign.amplitudeMin) * (0.5 + 0.5 * breathe);
      const alpha = amplitude * entryProgress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = sign.font;
      ctx.textAlign = i === 0 ? 'center' : i <= 2 ? 'left' : 'right';
      ctx.textBaseline = 'middle';

      // Glitch effect on main title
      if (sign.canGlitch && this.glitchActive) {
        const glitchProgress = (t - this.glitchStart) / GLITCH_DURATION;
        this.drawGlitch(ctx, sign, glitchProgress);
      } else {
        // Draw glow sprite
        if (sign.sprite && activeBlur < MAX_SHADOW_BLUR) {
          const align = i === 0 ? 'center' : i <= 2 ? 'left' : 'right';
          const spriteX =
            sign.x -
            (align === 'center'
              ? sign.sprite.width / 2
              : align === 'right'
                ? sign.sprite.width - 20
                : 20);
          const spriteY = sign.y - sign.sprite.height * 0.65;
          ctx.drawImage(sign.sprite, spriteX, spriteY);
          activeBlur++;
        }

        // Draw text on top for crispness
        ctx.fillStyle = sign.color;
        ctx.fillText(sign.text, sign.x, sign.y);
      }

      ctx.restore();
    }
  }

  private drawGlitch(ctx: CanvasRenderingContext2D, sign: NeonSign, progress: number): void {
    // RGB channel split
    const offset = (1 - Math.abs(progress - 0.5) * 2) * 4; // peaks at middle of glitch
    const sliceY = sign.y + Math.sin(progress * 20) * 3; // horizontal slice offset

    // Red channel (offset left)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillText(sign.text, sign.x - offset, sliceY);

    // Green channel (center)
    ctx.fillStyle = sign.color;
    ctx.fillText(sign.text, sign.x, sign.y);

    // Blue channel (offset right)
    ctx.fillStyle = 'rgba(0, 100, 255, 0.7)';
    ctx.fillText(sign.text, sign.x + offset, sliceY);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initSigns();
    this.mountTime = 0; // re-trigger entry animation
  }

  destroy(): void {
    this.signs = [];
  }
}
