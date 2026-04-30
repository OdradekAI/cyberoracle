import { HitRegistry } from './hit-detection';

const CARD_WIDTH = 48;
const CARD_HEIGHT = 72;
const CARD_SPACING = 14;
const FLOAT_AMPLITUDE = 4;
const FLOAT_PERIOD = 3;
const SWAY_DEGREES = 2;
const HOVER_RISE = 12;
const HOVER_SCALE = 1.1;
const FLIP_DURATION = 300;
const SIBLING_DIM = 0.7;
const SIBLING_RECEDE = 4;

const CARD_FACES = [
  { symbol: '☀', label: '太阳', meaning: '光明与希望即将降临' },
  { symbol: '★', label: '星辰', meaning: '命运之轮正在转动' },
  { symbol: '☽', label: '月亮', meaning: '直觉将引导你前行' },
  { symbol: '⚡', label: '闪电', meaning: '变革的力量正在觉醒' },
  { symbol: '❋', label: '雪花', meaning: '沉淀后必见清澄' },
] as const;

type SeqPhase = 'idle' | 'setup' | 'buildup' | 'climax' | 'resolution' | 'done';

interface CardState {
  x: number;
  y: number;
  origX: number;
  origY: number;
  phase: number;
  flipped: boolean;
  flipProgress: number;
  flipStart: number;
  hovered: boolean;
  flyProgress: number;
}

export class TarotGroup {
  private width: number;
  private height: number;
  private cards: CardState[] = [];
  private hoveredIdx = -1;
  private mouseX = 0;
  private mouseY = 0;
  private unregisterFns: (() => void)[] = [];
  private seqPhase: SeqPhase = 'idle';
  private selectedCard = -1;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initCards();
  }

  private initCards(): void {
    this.cards = CARD_FACES.map((_, i) => ({
      x: 0,
      y: 0,
      origX: 0,
      origY: 0,
      phase: (i / CARD_FACES.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
      flipped: false,
      flipProgress: 0,
      flipStart: 0,
      hovered: false,
      flyProgress: 0,
    }));
    this.layoutCards();
  }

  private layoutCards(): void {
    const totalWidth = CARD_FACES.length * CARD_WIDTH + (CARD_FACES.length - 1) * CARD_SPACING;
    const startX = (this.width - totalWidth) / 2;
    const baseY = this.height / 2 + Math.min(this.width, this.height) * 0.12 + CARD_HEIGHT + 20;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      card.x = startX + i * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2;
      card.y = baseY;
      card.origX = card.x;
      card.origY = card.y;
    }
  }

  registerHit(registry: HitRegistry): void {
    this.unregisterFns.forEach((fn) => fn());
    this.unregisterFns = [];

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const fn = registry.register({
        id: `tarot-card-${i}`,
        bbox: {
          x: card.x - CARD_WIDTH / 2,
          y: card.y - CARD_HEIGHT / 2,
          w: CARD_WIDTH,
          h: CARD_HEIGHT,
        },
        onHover: () => {
          this.hoveredIdx = i;
          card.hovered = true;
        },
        onLeave: () => {
          this.hoveredIdx = -1;
          card.hovered = false;
        },
        onClick: () => {
          if (card.flipped) {
            card.flipped = false;
            card.flipStart = performance.now();
          } else {
            card.flipped = true;
            card.flipStart = performance.now();
          }
        },
      });
      this.unregisterFns.push(fn);
    }
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.layoutCards();
  }

  setSequencePhase(phase: SeqPhase, selectedCard: number): void {
    this.seqPhase = phase;
    this.selectedCard = selectedCard;
    if (phase === 'idle') {
      // Reset cards to original positions
      for (const card of this.cards) {
        card.flyProgress = 0;
        card.flipped = false;
        card.flipProgress = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const timeSec = t * 0.001;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const face = CARD_FACES[i]!;
      this.drawCard(ctx, card, face, i, timeSec);
    }
  }

  private drawCard(
    ctx: CanvasRenderingContext2D,
    card: CardState,
    face: (typeof CARD_FACES)[number],
    index: number,
    timeSec: number,
  ): void {
    const isInSequence = this.seqPhase !== 'idle' && this.seqPhase !== 'done';
    const isSelected = index === this.selectedCard;

    // Dramatic sequence: compute fly position toward ball center
    let drawX = card.origX;
    let drawY = card.origY;
    let floatOffset =
      Math.sin((timeSec / FLOAT_PERIOD) * Math.PI * 2 + card.phase) * FLOAT_AMPLITUDE;
    let swayRad = (Math.sin(timeSec * 1.2 + card.phase * 0.7) * SWAY_DEGREES * Math.PI) / 180;
    let scale = 1;
    let opacity = 1;

    if (this.seqPhase === 'buildup') {
      // Cards fly toward ball center (above it)
      const ballCx = this.width / 2;
      const ballCy = this.height / 2 - Math.min(this.width, this.height) * 0.12 * 0.5;
      const flyTarget = 1; // fully flown
      card.flyProgress = Math.min(card.flyProgress + 0.02, flyTarget);
      const p = card.flyProgress;
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      drawX = card.origX + (ballCx - card.origX) * eased;
      drawY = card.origY + (ballCy - card.origY) * eased;
      floatOffset *= 1 - eased;
      swayRad *= 1 - eased;
    } else if (this.seqPhase === 'climax') {
      // Cards frozen near ball
      const ballCx = this.width / 2;
      const ballCy = this.height / 2 - Math.min(this.width, this.height) * 0.12 * 0.5;
      drawX = card.origX + (ballCx - card.origX);
      drawY = card.origY + (ballCy - card.origY);
      floatOffset = 0;
      swayRad = 0;
      opacity = isSelected ? 1 : 0.2;
    } else if (this.seqPhase === 'resolution') {
      if (isSelected) {
        // Selected card stays at center, flips
        const ballCx = this.width / 2;
        const ballCy = this.height / 2 - Math.min(this.width, this.height) * 0.12 * 0.5;
        drawX = ballCx;
        drawY = ballCy;
        floatOffset = 0;
        swayRad = 0;
        scale = 1.3;

        // Auto-flip selected card
        if (!card.flipped && card.flipStart === 0) {
          card.flipped = true;
          card.flipStart = performance.now();
        }
      } else {
        // Non-selected cards dim and stay at ball area
        const ballCx = this.width / 2;
        const ballCy = this.height / 2 - Math.min(this.width, this.height) * 0.12 * 0.5;
        drawX = card.origX + (ballCx - card.origX);
        drawY = card.origY + (ballCy - card.origY);
        opacity = 0.15;
        floatOffset = 0;
        swayRad = 0;
      }
    } else if (this.seqPhase === 'done') {
      // Cards stay in final state until new sequence
      return;
    }

    if (isInSequence) {
      // Override hover state during sequence
      const riseY = 0;

      // Flip animation progress
      let flipProgress = card.flipProgress;
      if (card.flipStart > 0) {
        const elapsed = performance.now() - card.flipStart;
        if (elapsed < FLIP_DURATION) {
          const linear = elapsed / FLIP_DURATION;
          flipProgress = (1 - Math.cos(linear * Math.PI)) / 2;
        } else {
          flipProgress = card.flipped ? 1 : 0;
          card.flipStart = 0;
        }
      } else {
        flipProgress = card.flipped ? 1 : 0;
      }
      card.flipProgress = flipProgress;

      const showingFront = flipProgress < 0.5;
      const flipScaleX = Math.abs(1 - flipProgress * 2);
      const effectiveScaleX = Math.max(flipScaleX, 0.05) * scale;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(drawX, drawY + floatOffset - riseY);
      ctx.rotate(swayRad);
      ctx.scale(effectiveScaleX, scale);

      const hw = CARD_WIDTH / 2;
      const hh = CARD_HEIGHT / 2;

      if (showingFront) {
        this.drawCardFront(ctx, hw, hh, false);
      } else {
        this.drawCardBack(ctx, hw, hh, face, isSelected);
      }

      ctx.restore();
      return;
    }

    // Normal (idle) rendering
    const isHovered = card.hovered;
    const isSibling = this.hoveredIdx >= 0 && this.hoveredIdx !== index;

    // Hover state
    const riseY = isHovered ? HOVER_RISE : 0;
    const hoverScale = isHovered ? HOVER_SCALE : 1;
    const siblingOffset = isSibling ? SIBLING_RECEDE : 0;
    opacity = isSibling ? SIBLING_DIM : 1;

    // Flip animation progress
    let flipProgress = card.flipProgress;
    if (card.flipStart > 0) {
      const elapsed = performance.now() - card.flipStart;
      if (elapsed < FLIP_DURATION) {
        const linear = elapsed / FLIP_DURATION;
        flipProgress = (1 - Math.cos(linear * Math.PI)) / 2;
      } else {
        flipProgress = card.flipped ? 1 : 0;
        card.flipStart = 0;
      }
    } else {
      flipProgress = card.flipped ? 1 : 0;
    }
    card.flipProgress = flipProgress;

    // 3D tilt on hover
    let tiltX = 0;
    let tiltY = 0;
    if (isHovered) {
      const dx = this.mouseX - card.origX;
      const dy = this.mouseY - (card.origY + floatOffset);
      tiltX = (dx / (CARD_WIDTH / 2)) * 8;
      tiltY = (dy / (CARD_HEIGHT / 2)) * 5;
    }

    const showingFront = flipProgress < 0.5;
    const scaleX = Math.abs(1 - flipProgress * 2);
    const effectiveScaleX = Math.max(scaleX, 0.05) * hoverScale;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(card.origX + siblingOffset, card.origY + floatOffset - riseY);
    ctx.rotate(swayRad);

    if (isHovered && (tiltX !== 0 || tiltY !== 0)) {
      ctx.transform(1, tiltY * 0.01, tiltX * 0.01, 1, 0, 0);
    }

    ctx.scale(effectiveScaleX, hoverScale);

    const hw = CARD_WIDTH / 2;
    const hh = CARD_HEIGHT / 2;

    if (showingFront) {
      this.drawCardFront(ctx, hw, hh, isHovered);
    } else {
      this.drawCardBack(ctx, hw, hh, face, isHovered);
    }

    ctx.restore();
  }

  private drawCardFront(
    ctx: CanvasRenderingContext2D,
    hw: number,
    hh: number,
    isHovered: boolean,
  ): void {
    // Card background
    const radius = 4;
    ctx.beginPath();
    this.roundRect(ctx, -hw, -hh, CARD_WIDTH, CARD_HEIGHT, radius);

    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#1a1030');
    grad.addColorStop(1, '#0f0a20');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered ? 'rgba(168, 85, 247, 0.8)' : 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Glow outline (subtle when idle, brighter on hover)
    if (isHovered) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Inner decorative border
    const inset = 4;
    ctx.beginPath();
    this.roundRect(
      ctx,
      -hw + inset,
      -hh + inset,
      CARD_WIDTH - inset * 2,
      CARD_HEIGHT - inset * 2,
      2,
    );
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Central question mark / pattern
    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 0);
  }

  private drawCardBack(
    ctx: CanvasRenderingContext2D,
    hw: number,
    hh: number,
    face: (typeof CARD_FACES)[number],
    isHovered: boolean,
  ): void {
    // Card background
    const radius = 4;
    ctx.beginPath();
    this.roundRect(ctx, -hw, -hh, CARD_WIDTH, CARD_HEIGHT, radius);

    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#1f1540');
    grad.addColorStop(1, '#150e30');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered ? 'rgba(34, 211, 238, 0.8)' : 'rgba(168, 85, 247, 0.5)';
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Symbol
    ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(face.symbol, 0, -hh * 0.35);

    // Label
    ctx.fillStyle = 'rgba(200, 180, 230, 0.8)';
    ctx.font = '9px sans-serif';
    ctx.fillText(face.label, 0, -hh * 0.1);

    // Meaning text (wrapped)
    ctx.fillStyle = 'rgba(200, 180, 230, 0.65)';
    ctx.font = '7px sans-serif';
    this.wrapText(ctx, face.meaning, 0, hh * 0.15, CARD_WIDTH - 10, 9);
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const chars = [...text];
    let line = '';
    let y = startY;

    for (const char of chars) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, cx, y);
        line = char;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, cx, y);
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  getCards(): readonly { x: number; y: number; flipped: boolean }[] {
    return this.cards.map((c) => ({ x: c.x, y: c.y, flipped: c.flipped }));
  }

  destroy(): void {
    this.unregisterFns.forEach((fn) => fn());
    this.unregisterFns = [];
  }
}
