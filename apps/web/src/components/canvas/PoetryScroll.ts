import { HitRegistry } from './hit-detection';

const SCROLL_WIDTH_RATIO = 0.06;
const SCROLL_HEIGHT_RATIO = 0.12;
const GOLD_FLOW_PERIOD = 3;
const EXPAND_DURATION = 800;
const TYPE_SPEED = 50; // ms per character

const STUB_POEMS = [
  '镜中花影水中月\n指尖流沙不可得\n一念清净方知我\n万般皆是梦中客',
  '浮云散尽见明月\n竹影摇窗听暮蝉\n莫问前路归何处\n此心安处即长安',
  '春风不解江南雨\n细看清波映晚霞\n人间烟火皆可恋\n只愿今宵月更佳',
  '星河倒影落杯中\n醉后不知天在水\n满船清梦压星河\n醒来犹记梦中人',
];

type ScrollState = 'idle' | 'hover' | 'expanding' | 'typing' | 'complete';

export class PoetryScroll {
  private cx: number;
  private cy: number;
  private scrollW: number;
  private scrollH: number;
  private hovered = false;
  private state: ScrollState = 'idle';
  private stateStartTime = 0;
  private expandProgress = 0;
  private currentPoem = '';
  private typedChars = 0;
  private lastTypeTime = 0;
  private unregisterHit: (() => void) | null = null;
  private reducedMotion = false;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width * 0.88;
    this.cy = height * 0.78;
    this.scrollW = Math.min(width, height) * SCROLL_WIDTH_RATIO;
    this.scrollH = Math.min(width, height) * SCROLL_HEIGHT_RATIO;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  registerHit(registry: HitRegistry): void {
    const pad = 6;
    this.unregisterHit = registry.register({
      id: 'poetry-scroll',
      bbox: {
        x: this.cx - this.scrollW - pad,
        y: this.cy - this.scrollH * 1.5 - pad,
        w: this.scrollW * 2 + pad * 2,
        h: this.scrollH * 3 + pad * 2,
      },
      onHover: () => {
        this.hovered = true;
        if (this.state === 'idle') {
          this.state = 'hover';
          this.stateStartTime = performance.now();
        }
      },
      onLeave: () => {
        this.hovered = false;
        if (this.state === 'hover') {
          this.state = 'idle';
          this.stateStartTime = performance.now();
        }
      },
      onClick: () => {
        if (this.state === 'idle' || this.state === 'hover') {
          this.state = 'expanding';
          this.stateStartTime = performance.now();
          const idx = Math.floor(Math.random() * STUB_POEMS.length);
          this.currentPoem = STUB_POEMS[idx]!;
          this.typedChars = 0;
          this.lastTypeTime = 0;
        }
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const timeSec = t * 0.001;
    const elapsed = t - this.stateStartTime;

    // State transitions
    if (this.state === 'expanding' && elapsed >= EXPAND_DURATION) {
      this.state = 'typing';
      this.stateStartTime = t;
      this.typedChars = 0;
      this.lastTypeTime = t;
    }
    if (this.state === 'typing') {
      const charsToType = Math.floor((t - this.lastTypeTime) / TYPE_SPEED);
      if (charsToType > 0) {
        this.typedChars = Math.min(this.typedChars + charsToType, this.currentPoem.length);
        this.lastTypeTime = t;
      }
      if (this.typedChars >= this.currentPoem.length) {
        this.state = 'complete';
        this.stateStartTime = t;
      }
    }

    // Expand/collapse interpolation
    if (
      this.state === 'hover' ||
      this.state === 'expanding' ||
      this.state === 'typing' ||
      this.state === 'complete'
    ) {
      const targetExpand = this.state === 'hover' ? 0.4 : 1;
      this.expandProgress += (targetExpand - this.expandProgress) * 0.08;
    } else {
      this.expandProgress += (0 - this.expandProgress) * 0.06;
    }

    const w = this.scrollW;
    const h = this.scrollH;
    const ep = this.expandProgress;
    const expandW = w + w * ep * 1.2;
    const expandH = h + h * ep * 0.8;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    // Scroll body
    const scrollX = -expandW;
    const scrollY = -expandH * 0.6;
    const scrollW = expandW * 2;
    const scrollH = expandH * 1.6;

    // Scroll background with rounded corners
    this.drawScrollShape(ctx, scrollX, scrollY, scrollW, scrollH);

    // Golden flow effect on edges (idle)
    if (!this.reducedMotion) {
      this.drawGoldenFlow(ctx, timeSec, scrollX, scrollY, scrollW, scrollH);
    }

    // Content based on state
    if (this.state === 'hover' && ep > 0.2) {
      this.drawHoverLabel(ctx, scrollX, scrollY, scrollW, scrollH);
    } else if (this.state === 'typing' || this.state === 'complete') {
      this.drawPoem(ctx, scrollX, scrollY, scrollW, scrollH);
    }

    // Scroll end caps (wooden rollers)
    this.drawRollers(ctx, scrollX, scrollY, scrollW, scrollH);

    ctx.restore();
  }

  private drawScrollShape(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const r = Math.min(4, w * 0.1);

    // Paper texture background
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(40, 28, 55, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawGoldenFlow(
    ctx: CanvasRenderingContext2D,
    timeSec: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const phase = (timeSec / GOLD_FLOW_PERIOD) * Math.PI * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Top edge golden shimmer
    const gradient = ctx.createLinearGradient(x, y, x + w, y);
    const offset = (Math.sin(phase) + 1) * 0.5;
    gradient.addColorStop(Math.max(0, offset - 0.2), 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(offset, 'rgba(255, 215, 0, 0.4)');
    gradient.addColorStop(Math.min(1, offset + 0.2), 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, 3);

    // Bottom edge shimmer (offset phase)
    const offset2 = (Math.sin(phase + Math.PI) + 1) * 0.5;
    const gradient2 = ctx.createLinearGradient(x, y + h, x + w, y + h);
    gradient2.addColorStop(Math.max(0, offset2 - 0.2), 'rgba(255, 215, 0, 0)');
    gradient2.addColorStop(offset2, 'rgba(255, 215, 0, 0.3)');
    gradient2.addColorStop(Math.min(1, offset2 + 0.2), 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient2;
    ctx.fillRect(x, y + h - 3, w, 3);

    ctx.restore();
  }

  private drawHoverLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    ctx.save();
    ctx.font = `${Math.max(8, w * 0.09)}px serif`;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = ['点击', '揭帖'];
    const lineH = Math.max(10, h * 0.08);
    const startY = y + h / 2 - (lineH * (lines.length - 1)) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, x + w / 2, startY + i * lineH);
    }
    ctx.restore();
  }

  private drawPoem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    if (this.typedChars === 0) return;

    const visibleText = this.currentPoem.substring(0, this.typedChars);
    const poemLines = visibleText.split('\n');
    const fontSize = Math.max(8, w * 0.1);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, w - 4, h - 4);
    ctx.clip();

    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const lineH = fontSize * 1.5;
    const totalTextH = poemLines.length * lineH;
    const startY = y + (h - totalTextH) / 2;

    for (let i = 0; i < poemLines.length; i++) {
      ctx.fillText(poemLines[i]!, x + w / 2, startY + i * lineH);
    }

    ctx.restore();
  }

  private drawRollers(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const rollerW = Math.max(3, w * 0.06);
    const rollerColor = 'rgba(120, 80, 50, 0.7)';

    // Top roller
    ctx.fillStyle = rollerColor;
    ctx.fillRect(x - rollerW / 2, y - rollerW, w + rollerW, rollerW);
    // Bottom roller
    ctx.fillRect(x - rollerW / 2, y + h, w + rollerW, rollerW);

    // Roller end caps
    const capR = rollerW * 0.6;
    ctx.fillStyle = 'rgba(100, 65, 35, 0.8)';
    ctx.beginPath();
    ctx.arc(x - rollerW / 2, y - rollerW / 2, capR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w + rollerW / 2, y - rollerW / 2, capR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - rollerW / 2, y + h + rollerW / 2, capR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w + rollerW / 2, y + h + rollerW / 2, capR, 0, Math.PI * 2);
    ctx.fill();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width * 0.88;
    this.cy = height * 0.78;
    this.scrollW = Math.min(width, height) * SCROLL_WIDTH_RATIO;
    this.scrollH = Math.min(width, height) * SCROLL_HEIGHT_RATIO;
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }
}
