export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InteractiveElement {
  id: string;
  bbox: BBox;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}

type CursorStyle = 'default' | 'pointer';

const MAX_ELEMENTS = 20;

export class HitRegistry {
  private elements: InteractiveElement[] = [];
  private hoveredId: string | null = null;
  private activeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private cursorCallback: ((cursor: CursorStyle) => void) | null = null;

  onCursorChange(cb: (cursor: CursorStyle) => void): void {
    this.cursorCallback = cb;
  }

  register(element: InteractiveElement): () => void {
    if (this.elements.length >= MAX_ELEMENTS) {
      console.warn(`HitRegistry: max ${MAX_ELEMENTS} elements, ignoring "${element.id}"`);
      return () => {};
    }
    this.elements.push(element);
    return () => {
      this.elements = this.elements.filter((e) => e.id !== element.id);
    };
  }

  handleMouseMove(x: number, y: number): void {
    let found: InteractiveElement | undefined;
    for (const el of this.elements) {
      const { x: bx, y: by, w, h } = el.bbox;
      if (x >= bx && x <= bx + w && y >= by && y <= by + h) {
        found = el;
        break;
      }
    }

    if (found) {
      if (this.hoveredId !== found.id) {
        this.fireLeave();
        this.hoveredId = found.id;
        found.onHover?.();
      }
      this.setCursor('pointer');
    } else {
      this.fireLeave();
      this.setCursor('default');
    }
  }

  handleClick(x: number, y: number): void {
    for (const el of this.elements) {
      const { x: bx, y: by, w, h } = el.bbox;
      if (x >= bx && x <= bx + w && y >= by && y <= by + h) {
        el.onClick?.();
        break;
      }
    }
  }

  getElements(): readonly InteractiveElement[] {
    return this.elements;
  }

  getHoveredId(): string | null {
    return this.hoveredId;
  }

  private fireLeave(): void {
    if (this.hoveredId !== null) {
      const prev = this.elements.find((e) => e.id === this.hoveredId);
      prev?.onLeave?.();
      this.hoveredId = null;
    }
  }

  private setCursor(cursor: CursorStyle): void {
    this.cursorCallback?.(cursor);
  }
}
