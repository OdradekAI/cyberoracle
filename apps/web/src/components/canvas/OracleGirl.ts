import { HitRegistry } from './hit-detection';

const GIRL_HEIGHT_RATIO = 0.16;
const HALO_PERIOD = 6;
const FLOAT_AMPLITUDE = 2;
const FLOAT_PERIOD = 4;
const BLINK_MIN_INTERVAL = 4;
const BLINK_MAX_INTERVAL = 7;
const BLINK_DURATION = 150;
const HAIR_SWAY_PERIOD = 3;
const SCREEN_TEXT_SPEED = 40; // px per second

const TAP_LINES = [
  '你怎么戳我脸……',
  '又来了——你今天点我第三次了。',
  '嗯？想说什么？',
  '这样会让我分心的。',
  '我以为你不会再来了。',
];

export class OracleGirl {
  private cx: number;
  private cy: number;
  private girlH: number;
  private hovered = false;
  private rotation = 0;
  private blinkState = false;
  private nextBlinkTime = 0;
  private blinkStartTime = 0;
  private screenTextOffset = 0;
  private unregisterHit: (() => void) | null = null;
  private reducedMotion = false;
  private speechCallback: ((text: string) => void) | null = null;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width * 0.5;
    this.cy = height * 0.62;
    this.girlH = Math.min(width, height) * GIRL_HEIGHT_RATIO;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.nextBlinkTime =
      BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
  }

  setSpeechCallback(cb: (text: string) => void): void {
    this.speechCallback = cb;
  }

  registerHit(registry: HitRegistry): void {
    const hitW = this.girlH * 0.4;
    const hitH = this.girlH * 0.9;
    this.unregisterHit = registry.register({
      id: 'oracle-girl',
      bbox: {
        x: this.cx - hitW,
        y: this.cy - hitH,
        w: hitW * 2,
        h: hitH + hitH * 0.3,
      },
      onHover: () => {
        this.hovered = true;
      },
      onLeave: () => {
        this.hovered = false;
      },
      onClick: () => {
        const idx = Math.floor(Math.random() * TAP_LINES.length);
        const line = TAP_LINES[idx]!;
        if (this.speechCallback) {
          this.speechCallback(line);
        }
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const timeSec = t * 0.001;

    // Breathing float
    const floatY = this.reducedMotion
      ? 0
      : Math.sin((timeSec / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_AMPLITUDE;

    // Blink logic
    if (!this.blinkState && timeSec >= this.nextBlinkTime) {
      this.blinkState = true;
      this.blinkStartTime = t;
    }
    if (this.blinkState && t - this.blinkStartTime > BLINK_DURATION) {
      this.blinkState = false;
      this.nextBlinkTime =
        timeSec + BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
    }

    // Halo rotation
    if (!this.reducedMotion) {
      this.rotation += ((Math.PI * 2) / HALO_PERIOD) * (1 / 60);
    }

    // Screen text scroll
    if (!this.reducedMotion) {
      this.screenTextOffset += (SCREEN_TEXT_SPEED / 1000) * 16.67;
    }

    const h = this.girlH;

    ctx.save();
    ctx.translate(this.cx, this.cy + floatY);

    // Halo (behind head)
    this.drawHalo(ctx, h);

    // Body
    this.drawBody(ctx, h);

    // Head
    this.drawHead(ctx, h, timeSec);

    // Left-hand screen
    this.drawScreen(ctx, h);

    ctx.restore();
  }

  private drawHalo(ctx: CanvasRenderingContext2D, h: number): void {
    const haloY = -h * 0.7;
    const haloR = h * 0.12;

    ctx.save();
    ctx.translate(0, haloY);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.ellipse(0, 0, haloR, haloR * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
    ctx.stroke();

    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D, h: number): void {
    const bodyW = h * 0.22;

    // Robe/dress shape
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.3, -h * 0.35);
    ctx.quadraticCurveTo(-bodyW * 0.5, -h * 0.1, -bodyW * 0.6, h * 0.15);
    ctx.lineTo(bodyW * 0.6, h * 0.15);
    ctx.quadraticCurveTo(bodyW * 0.5, -h * 0.1, bodyW * 0.3, -h * 0.35);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 20, 60, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Collar detail
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.15, -h * 0.35);
    ctx.lineTo(0, -h * 0.28);
    ctx.lineTo(bodyW * 0.15, -h * 0.35);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawHead(ctx: CanvasRenderingContext2D, h: number, timeSec: number): void {
    const headR = h * 0.1;
    const headY = -h * 0.48;

    // Hair sway (subtle vertex perturbation)
    const hairSway = this.reducedMotion
      ? 0
      : Math.sin((timeSec / HAIR_SWAY_PERIOD) * Math.PI * 2) * 2;

    // Hair (behind head)
    ctx.save();
    ctx.translate(hairSway * 0.3, 0);
    ctx.beginPath();
    ctx.ellipse(0, headY + headR * 0.1, headR * 1.3, headR * 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60, 40, 90, 0.9)';
    ctx.fill();
    ctx.restore();

    // Hair strands (long side pieces)
    ctx.save();
    ctx.translate(hairSway * 0.5, 0);
    // Left strand
    ctx.beginPath();
    ctx.moveTo(-headR * 0.9, headY - headR * 0.2);
    ctx.quadraticCurveTo(-headR * 1.2, headY + headR * 1.5, -headR * 0.8, headY + headR * 2.5);
    ctx.strokeStyle = 'rgba(60, 40, 90, 0.8)';
    ctx.lineWidth = headR * 0.3;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Right strand
    ctx.beginPath();
    ctx.moveTo(headR * 0.9, headY - headR * 0.2);
    ctx.quadraticCurveTo(headR * 1.2, headY + headR * 1.5, headR * 0.8, headY + headR * 2.5);
    ctx.stroke();
    ctx.restore();

    // Face
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#E8D5C4';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Eyes
    if (this.blinkState) {
      // Closed eyes — horizontal lines
      ctx.strokeStyle = '#3D2B5E';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-headR * 0.5, headY);
      ctx.lineTo(-headR * 0.15, headY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headR * 0.15, headY);
      ctx.lineTo(headR * 0.5, headY);
      ctx.stroke();
    } else {
      // Open eyes
      for (const side of [-1, 1]) {
        const ex = side * headR * 0.32;
        // Eye white
        ctx.beginPath();
        ctx.ellipse(ex, headY - headR * 0.05, headR * 0.15, headR * 0.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        // Iris
        ctx.beginPath();
        ctx.arc(ex, headY - headR * 0.03, headR * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = '#6B3FA0';
        ctx.fill();
        // Pupil
        ctx.beginPath();
        ctx.arc(ex, headY - headR * 0.03, headR * 0.035, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.arc(ex + headR * 0.025, headY - headR * 0.06, headR * 0.02, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }

    // Mouth (small smile)
    ctx.beginPath();
    ctx.arc(0, headY + headR * 0.3, headR * 0.12, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = 'rgba(180, 100, 120, 0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  private drawScreen(ctx: CanvasRenderingContext2D, h: number): void {
    const screenX = -h * 0.25;
    const screenY = -h * 0.3;
    const screenW = h * 0.12;
    const screenH = h * 0.15;

    // Screen body
    ctx.save();
    ctx.fillStyle = 'rgba(20, 15, 35, 0.8)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(screenX - screenW / 2, screenY, screenW, screenH);
    ctx.strokeRect(screenX - screenW / 2, screenY, screenW, screenH);

    // Scrolling text
    ctx.beginPath();
    ctx.rect(screenX - screenW / 2 + 2, screenY + 2, screenW - 4, screenH - 4);
    ctx.clip();

    ctx.font = `${Math.max(6, screenW * 0.2)}px monospace`;
    ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.textBaseline = 'top';

    const text = 'Analyzing...';
    const textW = ctx.measureText(text).width;
    const totalW = textW + 30;
    const offset = this.screenTextOffset % totalW;

    for (let copy = -1; copy <= 2; copy++) {
      ctx.fillText(text, screenX - screenW / 2 + 4 - offset + copy * totalW, screenY + 4);
    }

    ctx.restore();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width * 0.5;
    this.cy = height * 0.62;
    this.girlH = Math.min(width, height) * GIRL_HEIGHT_RATIO;
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }
}
