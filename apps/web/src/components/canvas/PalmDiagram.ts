import { HitRegistry } from './hit-detection';

const PALM_WIDTH_RATIO = 0.12;
const PALM_HEIGHT_RATIO = 0.2;
const CYCLE_PERIOD = 3; // 3 seconds per full cycle (1s per line)
const SCAN_PERIOD = 1; // 1s scan sweep
const SCAN_COLOR = 'rgba(34, 211, 238, 0.6)';
const OUTLINE_COLOR = 'rgba(168, 85, 247, 0.4)';

interface PalmLine {
  // Control points relative to palm bounding box (0-1 range)
  points: [number, number][];
  label: string;
}

const PALM_LINES: PalmLine[] = [
  {
    label: '心',
    points: [
      [0.15, 0.35],
      [0.35, 0.28],
      [0.6, 0.22],
      [0.85, 0.3],
    ],
  },
  {
    label: '智',
    points: [
      [0.12, 0.48],
      [0.35, 0.42],
      [0.6, 0.4],
      [0.82, 0.48],
    ],
  },
  {
    label: '命',
    points: [
      [0.15, 0.58],
      [0.25, 0.7],
      [0.35, 0.82],
      [0.42, 0.92],
    ],
  },
];

export class PalmDiagram {
  private cx: number;
  private cy: number;
  private palmW: number;
  private palmH: number;
  private hovered = false;
  private scanY = 0;
  private unregisterHit: (() => void) | null = null;
  private reducedMotion = false;

  constructor(
    private width: number,
    private height: number,
  ) {
    this.cx = width * 0.82;
    this.cy = height * 0.28;
    this.palmW = Math.min(width, height) * PALM_WIDTH_RATIO;
    this.palmH = Math.min(width, height) * PALM_HEIGHT_RATIO;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  registerHit(registry: HitRegistry): void {
    const hitPad = 10;
    this.unregisterHit = registry.register({
      id: 'palm-diagram',
      bbox: {
        x: this.cx - this.palmW / 2 - hitPad,
        y: this.cy - this.palmH / 2 - hitPad,
        w: this.palmW + hitPad * 2,
        h: this.palmH + hitPad * 2,
      },
      onHover: () => {
        this.hovered = true;
      },
      onLeave: () => {
        this.hovered = false;
      },
      onClick: () => {
        this.onPalmClick();
      },
    });
  }

  private onPalmClick(): void {
    const event = new CustomEvent('palm-diagram-click');
    window.dispatchEvent(event);
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const timeSec = t * 0.001;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    // Hand outline
    this.drawHandOutline(ctx);

    // Palm lines with cycling illumination
    for (let i = 0; i < PALM_LINES.length; i++) {
      const line = PALM_LINES[i]!;
      const brightness = this.getLineBrightness(timeSec, i);
      this.drawPalmLine(ctx, line, brightness);
    }

    // Hover: scan line sweep
    if (this.hovered && !this.reducedMotion) {
      const scanPhase = (timeSec % SCAN_PERIOD) / SCAN_PERIOD;
      this.scanY = scanPhase * this.palmH;
      this.drawScanLine(ctx);
    }

    // Hover: glow border
    if (this.hovered) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.palmW / 2 - 4, -this.palmH / 2 - 4, this.palmW + 8, this.palmH + 8);
      ctx.restore();
    }

    ctx.restore();
  }

  private getLineBrightness(timeSec: number, lineIndex: number): number {
    if (this.hovered) return 1.0;

    // Each line gets 1s of the 3s cycle
    const cyclePos = timeSec % CYCLE_PERIOD;
    const lineStart = lineIndex * 1; // 0, 1, 2
    const lineEnd = lineStart + 1;

    if (cyclePos >= lineStart && cyclePos < lineEnd) {
      // Sine wave peak at center of this line's window
      const progress = (cyclePos - lineStart) / 1;
      return 0.3 + 0.7 * Math.sin(progress * Math.PI);
    }

    return 0.2;
  }

  private drawHandOutline(ctx: CanvasRenderingContext2D): void {
    const w = this.palmW;
    const h = this.palmH;

    ctx.save();
    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Simplified hand shape — palm + 5 fingers
    const left = -w / 2;
    const right = w / 2;
    const top = -h / 2;
    const bottom = h / 2;

    // Palm base
    ctx.moveTo(left, bottom * 0.3);
    // Left side up to pinky
    ctx.quadraticCurveTo(left - w * 0.05, top * 0.6, left + w * 0.08, top);
    // Pinky
    ctx.quadraticCurveTo(left + w * 0.12, top - h * 0.12, left + w * 0.18, top);
    // Ring finger base
    ctx.lineTo(left + w * 0.25, top * 0.1);
    // Ring finger
    ctx.quadraticCurveTo(left + w * 0.28, top - h * 0.18, left + w * 0.38, top * 0.15);
    // Middle finger base
    ctx.lineTo(left + w * 0.42, top * 0.05);
    // Middle finger
    ctx.quadraticCurveTo(left + w * 0.45, top - h * 0.22, left + w * 0.55, top * 0.1);
    // Index finger base
    ctx.lineTo(left + w * 0.6, top * 0.05);
    // Index finger
    ctx.quadraticCurveTo(left + w * 0.63, top - h * 0.2, left + w * 0.75, top * 0.15);
    // Thumb base
    ctx.lineTo(left + w * 0.8, top * 0.3);
    // Thumb
    ctx.quadraticCurveTo(right + w * 0.15, top * 0.2, right + w * 0.05, bottom * 0.1);
    // Thumb connection to palm
    ctx.quadraticCurveTo(right + w * 0.02, bottom * 0.3, right, bottom * 0.4);
    // Right side down
    ctx.lineTo(right, bottom);
    // Bottom
    ctx.lineTo(left, bottom);
    ctx.closePath();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawPalmLine(ctx: CanvasRenderingContext2D, line: PalmLine, brightness: number): void {
    const points = line.points.map(
      ([px, py]) =>
        [-this.palmW / 2 + px * this.palmW, -this.palmH / 2 + py * this.palmH] as [number, number],
    );

    ctx.save();

    // Interpolate color based on brightness
    const r = 168;
    const g = 85;
    const b = 247;
    const alpha = 0.2 + brightness * 0.7;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 1.5 + brightness * 1.5;
    ctx.lineCap = 'round';

    if (brightness > 0.5) {
      ctx.shadowBlur = brightness * 8;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${brightness * 0.5})`;
    }

    // Draw smooth curve through points
    ctx.beginPath();
    ctx.moveTo(points[0]![0], points[0]![1]);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const cpx = (prev[0] + curr[0]) / 2;
      const cpy = (prev[1] + curr[1]) / 2;
      ctx.quadraticCurveTo(prev[0], prev[1], cpx, cpy);
    }
    const last = points[points.length - 1]!;
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();

    // Label
    const labelPt = points[Math.floor(points.length / 2)]!;
    ctx.shadowBlur = 0;
    ctx.font = `${Math.max(9, this.palmW * 0.12)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(200, 180, 230, ${0.3 + brightness * 0.6})`;
    ctx.fillText(line.label, labelPt[0], labelPt[1] - this.palmW * 0.08);

    ctx.restore();
  }

  private drawScanLine(ctx: CanvasRenderingContext2D): void {
    const y = -this.palmH / 2 + this.scanY;
    const x1 = -this.palmW / 2 - 6;
    const x2 = this.palmW / 2 + 6;

    ctx.save();

    // Glow line
    const grad = ctx.createLinearGradient(x1, y, x2, y);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    grad.addColorStop(0.2, SCAN_COLOR);
    grad.addColorStop(0.8, SCAN_COLOR);
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = SCAN_COLOR;

    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    // Small trailing glow
    const trailGrad = ctx.createLinearGradient(0, y, 0, y + 20);
    trailGrad.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
    trailGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(x1, y, x2 - x1, 20);

    ctx.restore();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.cx = width * 0.82;
    this.cy = height * 0.28;
    this.palmW = Math.min(width, height) * PALM_WIDTH_RATIO;
    this.palmH = Math.min(width, height) * PALM_HEIGHT_RATIO;
  }

  destroy(): void {
    if (this.unregisterHit) {
      this.unregisterHit();
      this.unregisterHit = null;
    }
  }
}
