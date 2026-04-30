import { HitRegistry } from './hit-detection';

const CAT_SIZE_RATIO = 0.08;
const TAIL_PERIOD = 2;
const EYE_EXPRESSION_INTERVAL = 10; // seconds
const EYE_EXPRESSION_DURATION = 500; // ms
const HEAD_TILT_MAX = 0.26; // ~15 degrees
const LED_COUNT = 5;
const LED_CYCLE_PERIOD = 2; // seconds for full rainbow cycle

const RAINBOW_COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#4B0082',
  '#9400D3',
];

export class CyberCat {
  private cx: number;
  private cy: number;
  private size: number;
  private hovered = false;
  private mouseX = 0;
  private mouseY = 0;
  private headTilt = 0;
  private lastEyeExpressionTime = 0;
  private showingExpression = false;
  private expressionStartTime = 0;
  private unregisterHit: (() => void) | null = null;
  private reducedMotion = false;
  private onDrawFortune: (() => void) | null = null;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width * 0.12;
    this.cy = height * 0.85;
    this.size = Math.min(width, height) * CAT_SIZE_RATIO;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setDrawFortuneCallback(cb: () => void): void {
    this.onDrawFortune = cb;
  }

  registerHit(registry: HitRegistry): void {
    const hitPad = 8;
    this.unregisterHit = registry.register({
      id: 'cyber-cat',
      bbox: {
        x: this.cx - this.size - hitPad,
        y: this.cy - this.size * 1.2 - hitPad,
        w: this.size * 2 + hitPad * 2,
        h: this.size * 2.2 + hitPad * 2,
      },
      onHover: () => {
        this.hovered = true;
      },
      onLeave: () => {
        this.hovered = false;
      },
      onClick: () => {
        if (this.onDrawFortune) {
          this.onDrawFortune();
        }
      },
    });
  }

  setMousePosition(mx: number, my: number): void {
    this.mouseX = mx;
    this.mouseY = my;
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const timeSec = t * 0.001;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    // Head tilt toward cursor on hover
    if (this.hovered) {
      const dx = this.mouseX - this.cx;
      const targetTilt = (dx / this.width) * HEAD_TILT_MAX * 2;
      this.headTilt += (targetTilt - this.headTilt) * 0.1;
    } else {
      this.headTilt *= 0.9;
    }

    // Random eye expression check
    if (!this.showingExpression && timeSec - this.lastEyeExpressionTime > EYE_EXPRESSION_INTERVAL) {
      this.showingExpression = true;
      this.expressionStartTime = t;
      this.lastEyeExpressionTime = timeSec;
    }
    if (this.showingExpression && t - this.expressionStartTime > EYE_EXPRESSION_DURATION) {
      this.showingExpression = false;
    }

    const s = this.size;

    // Body
    ctx.save();
    ctx.rotate(this.headTilt);

    // Tail (behind body)
    this.drawTail(ctx, timeSec, s);

    // Body oval
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.5, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2D1B4E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Collar with LEDs
    this.drawCollar(ctx, timeSec, s);

    // Head
    ctx.beginPath();
    ctx.arc(0, -s * 0.5, s * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#3D2B5E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ears
    this.drawEars(ctx, s);

    // Eyes
    this.drawEyes(ctx, s);

    // Nose
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.lineTo(-s * 0.05, -s * 0.38);
    ctx.lineTo(s * 0.05, -s * 0.38);
    ctx.closePath();
    ctx.fillStyle = '#FF69B4';
    ctx.fill();

    // Mouth (subtle smile)
    ctx.beginPath();
    ctx.arc(-s * 0.06, -s * 0.32, s * 0.06, -0.3, 0.8);
    ctx.strokeStyle = 'rgba(200, 180, 230, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.06, -s * 0.32, s * 0.06, Math.PI - 0.8, Math.PI + 0.3);
    ctx.stroke();

    ctx.restore(); // head tilt
    ctx.restore(); // translate
  }

  private drawTail(ctx: CanvasRenderingContext2D, timeSec: number, s: number): void {
    if (this.reducedMotion) return;

    const sway = Math.sin((timeSec / TAIL_PERIOD) * Math.PI * 2) * s * 0.3;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s * 0.3, s * 0.1);
    ctx.quadraticCurveTo(s * 0.7, -s * 0.2 + sway, s * 0.9, -s * 0.5 + sway);
    ctx.strokeStyle = '#2D1B4E';
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tail tip glow
    ctx.beginPath();
    ctx.arc(s * 0.9, -s * 0.5 + sway, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.fill();

    ctx.restore();
  }

  private drawEars(ctx: CanvasRenderingContext2D, s: number): void {
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.75);
    ctx.lineTo(-s * 0.15, -s * 1.0);
    ctx.lineTo(-s * 0.05, -s * 0.7);
    ctx.closePath();
    ctx.fillStyle = '#3D2B5E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left ear inner
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.78);
    ctx.lineTo(-s * 0.17, -s * 0.95);
    ctx.lineTo(-s * 0.1, -s * 0.75);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 105, 180, 0.2)';
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.75);
    ctx.lineTo(s * 0.15, -s * 1.0);
    ctx.lineTo(s * 0.05, -s * 0.7);
    ctx.closePath();
    ctx.fillStyle = '#3D2B5E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right ear inner
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.78);
    ctx.lineTo(s * 0.17, -s * 0.95);
    ctx.lineTo(s * 0.1, -s * 0.75);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 105, 180, 0.2)';
    ctx.fill();
  }

  private drawEyes(ctx: CanvasRenderingContext2D, s: number): void {
    const eyeY = -s * 0.55;
    const eyeSpacing = s * 0.18;

    if (this.showingExpression) {
      // >_< expression
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = Math.max(1.5, s * 0.04);

      // Left eye >
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - s * 0.06, eyeY - s * 0.04);
      ctx.lineTo(-eyeSpacing + s * 0.02, eyeY);
      ctx.lineTo(-eyeSpacing - s * 0.06, eyeY + s * 0.04);
      ctx.stroke();

      // Right eye <
      ctx.beginPath();
      ctx.moveTo(eyeSpacing + s * 0.06, eyeY - s * 0.04);
      ctx.lineTo(eyeSpacing - s * 0.02, eyeY);
      ctx.lineTo(eyeSpacing + s * 0.06, eyeY + s * 0.04);
      ctx.stroke();
    } else {
      // Normal eyes — glowing cyan circles
      for (const side of [-1, 1]) {
        const ex = side * eyeSpacing;

        // Glow
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#22D3EE';
        ctx.beginPath();
        ctx.arc(ex, eyeY, s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = '#22D3EE';
        ctx.fill();
        ctx.restore();

        // Pupil
        ctx.beginPath();
        ctx.arc(ex, eyeY, s * 0.03, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a12';
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(ex + s * 0.02, eyeY - s * 0.02, s * 0.012, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }
  }

  private drawCollar(ctx: CanvasRenderingContext2D, timeSec: number, s: number): void {
    const collarY = s * 0.05;
    const collarW = s * 0.55;

    // Collar band
    ctx.beginPath();
    ctx.moveTo(-collarW, collarY);
    ctx.lineTo(collarW, collarY);
    ctx.lineTo(collarW, collarY + s * 0.06);
    ctx.lineTo(-collarW, collarY + s * 0.06);
    ctx.closePath();
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();

    // LED dots
    const ledSpacing = (collarW * 2) / (LED_COUNT + 1);
    for (let i = 0; i < LED_COUNT; i++) {
      const ledX = -collarW + ledSpacing * (i + 1);
      const ledY = collarY + s * 0.03;

      // Rainbow cycling — each LED offset
      const colorIdx = Math.floor(
        ((timeSec / LED_CYCLE_PERIOD + i / LED_COUNT) * RAINBOW_COLORS.length) %
          RAINBOW_COLORS.length,
      );
      const ledColor = RAINBOW_COLORS[colorIdx]!;

      ctx.save();
      ctx.shadowBlur = 4;
      ctx.shadowColor = ledColor;
      ctx.beginPath();
      ctx.arc(ledX, ledY, Math.max(1, s * 0.02), 0, Math.PI * 2);
      ctx.fillStyle = ledColor;
      ctx.fill();
      ctx.restore();
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width * 0.12;
    this.cy = height * 0.85;
    this.size = Math.min(width, height) * CAT_SIZE_RATIO;
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }
}
