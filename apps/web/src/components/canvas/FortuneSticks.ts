import { HitRegistry } from './hit-detection';

const CONTAINER_WIDTH_RATIO = 0.04;
const CONTAINER_HEIGHT_RATIO = 0.14;
const CONTAINER_GAP_RATIO = 0.025;
const BREATH_PERIOD = 3;
const SHAKE_FRAMES = 5;
const SHAKE_INTERVAL = 50;
const FORTUNE_TEXTS = ['大吉', '中吉', '小吉', '吉', '末吉', '凶', '小凶', '大吉'];

interface StickContainer {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  hovered: boolean;
  shakeOffset: number;
  shakeFrame: number;
  shaking: boolean;
  stickFlying: boolean;
  stickProgress: number;
  stickText: string;
  stickTextProgress: number;
  stickLanded: boolean;
  unregisterHit: (() => void) | null;
  tooltipVisible: boolean;
  tooltipTimer: number;
}

export class FortuneSticks {
  private containers: StickContainer[] = [];
  private width: number;
  private height: number;
  private reducedMotion = false;
  private lastShakeTime = 0;
  private lastStickTime = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initContainers();
  }

  private initContainers(): void {
    const containerW = Math.min(this.width, this.height) * CONTAINER_WIDTH_RATIO;
    const containerH = Math.min(this.width, this.height) * CONTAINER_HEIGHT_RATIO;
    const gap = Math.min(this.width, this.height) * CONTAINER_GAP_RATIO;
    const totalW = containerW * 3 + gap * 2;
    const startX = this.width * 0.15 - totalW / 2;
    const baseY = this.height * 0.72;

    const labels = ['姻缘', '事业', '财运'];
    this.containers = labels.map((label, i) => ({
      label,
      x: startX + i * (containerW + gap),
      y: baseY,
      w: containerW,
      h: containerH,
      phase: (i / 3) * Math.PI * 2,
      hovered: false,
      shakeOffset: 0,
      shakeFrame: 0,
      shaking: false,
      stickFlying: false,
      stickProgress: 0,
      stickText: '',
      stickTextProgress: 0,
      stickLanded: false,
      unregisterHit: null,
      tooltipVisible: false,
      tooltipTimer: 0,
    }));
  }

  registerHit(registry: HitRegistry): void {
    for (const container of this.containers) {
      container.unregisterHit = registry.register({
        id: `fortune-stick-${container.label}`,
        bbox: {
          x: container.x - 4,
          y: container.y - 4,
          w: container.w + 8,
          h: container.h + 8,
        },
        onHover: () => {
          container.hovered = true;
          if (!container.tooltipVisible) {
            container.tooltipTimer = performance.now();
            container.tooltipVisible = true;
          }
        },
        onLeave: () => {
          container.hovered = false;
          container.tooltipVisible = false;
          container.tooltipTimer = 0;
        },
        onClick: () => {
          this.onContainerClick(container);
        },
      });
    }
  }

  private onContainerClick(container: StickContainer): void {
    if (container.shaking || container.stickFlying) return;

    // Start shake animation
    container.shaking = true;
    container.shakeFrame = 0;
    this.lastShakeTime = performance.now();

    // Pick a random fortune text
    const idx = Math.floor(Math.random() * FORTUNE_TEXTS.length);
    container.stickText = FORTUNE_TEXTS[idx]!;

    console.log(`Fortune stick drawn (${container.label}):`, container.stickText);
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const dt = t;

    for (const container of this.containers) {
      this.updateContainer(container, dt);
      this.drawContainer(ctx, container, t);
    }
  }

  private updateContainer(container: StickContainer, dt: number): void {
    // Shake animation
    if (container.shaking) {
      const elapsed = dt - this.lastShakeTime;
      const frameIdx = Math.floor(elapsed / SHAKE_INTERVAL);
      if (frameIdx >= SHAKE_FRAMES) {
        container.shaking = false;
        container.shakeOffset = 0;
        // Start stick fly-out after shake
        container.stickFlying = true;
        container.stickProgress = 0;
        this.lastStickTime = dt;
      } else {
        container.shakeOffset = (frameIdx % 2 === 0 ? 1 : -1) * 4;
        container.shakeFrame = frameIdx;
      }
    }

    // Stick fly-out animation (spring-like)
    if (container.stickFlying) {
      const elapsed = (dt - this.lastStickTime) / 1000;
      if (elapsed < 0.6) {
        // Spring ease-out: fast rise, decelerate at top
        container.stickProgress = Math.min(1, elapsed / 0.4);
      } else if (elapsed < 0.8) {
        // Bounce settle
        container.stickProgress = 1 - 0.05 * Math.sin((elapsed - 0.6) * Math.PI * 5);
      } else {
        container.stickProgress = 1;
        container.stickLanded = true;
        container.stickTextProgress = 0;
      }

      // Text reveal character-by-character
      if (container.stickLanded) {
        const textElapsed = (dt - this.lastStickTime) / 1000 - 0.8;
        container.stickTextProgress = Math.min(
          1,
          textElapsed / (container.stickText.length * 0.08 + 0.2),
        );
      }

      // Auto-reset after 3 seconds
      if (elapsed > 3) {
        container.stickFlying = false;
        container.stickProgress = 0;
        container.stickLanded = false;
        container.stickTextProgress = 0;
        container.stickText = '';
      }
    }
  }

  private drawContainer(ctx: CanvasRenderingContext2D, container: StickContainer, t: number): void {
    const timeSec = t * 0.001;
    const { x, y, w, h, phase, hovered } = container;

    ctx.save();
    ctx.translate(container.shakeOffset, 0);

    // Container body (cylindrical look via rounded rect)
    const bodyX = x;
    const bodyY = y;
    const bodyW = w;
    const bodyH = h;
    const radius = Math.min(bodyW, bodyH) * 0.15;

    // Glow pillar inside (breathing)
    const breathe = 0.5 + 0.5 * Math.sin((timeSec / BREATH_PERIOD) * Math.PI * 2 + phase);
    const glowAlpha = hovered ? 0.6 : 0.2 + breathe * 0.3;

    // Inner glow
    const glowGrad = ctx.createLinearGradient(bodyX, bodyY + bodyH, bodyX, bodyY);
    glowGrad.addColorStop(0, `rgba(168, 85, 247, ${glowAlpha * 0.8})`);
    glowGrad.addColorStop(0.4, `rgba(168, 85, 247, ${glowAlpha * 0.4})`);
    glowGrad.addColorStop(1, `rgba(168, 85, 247, ${glowAlpha * 0.1})`);

    this.roundRect(ctx, bodyX, bodyY, bodyW, bodyH, radius);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Container outline
    this.roundRect(ctx, bodyX, bodyY, bodyW, bodyH, radius);
    ctx.strokeStyle = hovered ? 'rgba(168, 85, 247, 0.8)' : 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = hovered ? 2 : 1;
    ctx.stroke();

    // Sticks inside (3-4 thin lines visible above rim)
    const stickCount = 4;
    const stickSpacing = (bodyW - 8) / stickCount;
    for (let i = 0; i < stickCount; i++) {
      const sx = bodyX + 4 + stickSpacing * (i + 0.5);
      const sy = bodyY + 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - bodyH * 0.15);
      ctx.strokeStyle = `rgba(200, 180, 230, ${0.3 + breathe * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Label below container
    const fontSize = Math.max(10, w * 0.35);
    ctx.font = `${hovered ? fontSize * 1.15 : fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = hovered ? 'rgba(200, 180, 230, 0.95)' : 'rgba(200, 180, 230, 0.6)';
    ctx.fillText(container.label, bodyX + bodyW / 2, bodyY + bodyH + 6);

    // Tooltip on hover
    if (container.tooltipVisible) {
      const elapsed = (t - container.tooltipTimer) / 1000;
      if (elapsed >= 0.3) {
        const tooltipAlpha = Math.min(1, (elapsed - 0.3) * 4);
        ctx.font = `${Math.max(9, w * 0.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = `rgba(200, 180, 230, ${tooltipAlpha * 0.8})`;
        ctx.fillText('Click to draw', bodyX + bodyW / 2, bodyY - 6);
      }
    }

    ctx.restore();

    // Stick fly-out (drawn outside the shake translate)
    if (container.stickFlying) {
      this.drawFlyingStick(ctx, container);
    }
  }

  private drawFlyingStick(ctx: CanvasRenderingContext2D, container: StickContainer): void {
    const { x, y, w, h } = container;
    const centerX = x + w / 2;
    const topY = y;

    // Stick rises from container top
    const rise = container.stickProgress * h * 1.2;
    const stickX = centerX;
    const stickTop = topY - rise;
    const stickBottom = topY + 4;
    const stickW = 3;

    // Stick body
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(stickX - stickW / 2, stickTop);
    ctx.lineTo(stickX + stickW / 2, stickTop);
    ctx.lineTo(stickX + stickW / 2, stickBottom);
    ctx.lineTo(stickX - stickW / 2, stickBottom);
    ctx.closePath();
    ctx.fillStyle = '#F8F5EE';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stick text reveal
    if (container.stickLanded && container.stickText) {
      const charsToShow = Math.ceil(container.stickTextProgress * container.stickText.length);
      const visibleText = container.stickText.substring(0, charsToShow);
      const textFontSize = Math.max(10, w * 0.4);
      ctx.font = `${textFontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#FFD700';
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
      ctx.fillText(visibleText, stickX, stickTop - 4);
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const radius = Math.max(1, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Unregister old hits
    for (const container of this.containers) {
      if (container.unregisterHit) {
        container.unregisterHit();
      }
    }

    this.initContainers();
  }

  destroy(): void {
    for (const container of this.containers) {
      if (container.unregisterHit) {
        container.unregisterHit();
        container.unregisterHit = null;
      }
    }
  }
}
