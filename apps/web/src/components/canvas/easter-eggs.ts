const MIDNIGHT_START = 0;
const MIDNIGHT_END = 3;
const CAT_BELLY_CLICK_THRESHOLD = 10;
const CAT_BELLY_WINDOW = 30000;
const CAT_BELLY_DURATION = 2000;
const CAT_BELLY_COOLDOWN = 60000;

export class EasterEggs {
  private isMidnight = false;
  private catClickTimestamps: number[] = [];
  private catBellyUp = false;
  private catBellyStartTime = 0;
  private catBellyCooldownUntil = 0;
  private catBellyTriggered = false;

  checkMidnight(): boolean {
    const hour = new Date().getHours();
    this.isMidnight = hour >= MIDNIGHT_START && hour < MIDNIGHT_END;
    return this.isMidnight;
  }

  getMidnightFilter(): string | null {
    if (!this.isMidnight) return null;
    return 'hue-rotate(20deg) saturate(0.85)';
  }

  getMidnightText(): string | null {
    if (!this.isMidnight) return null;
    return '夜半凶兆';
  }

  // Returns true if belly-up animation should be shown
  onCatClick(t: number): boolean {
    // Don't trigger during cooldown
    if (t < this.catBellyCooldownUntil) return false;

    // Record click
    this.catClickTimestamps.push(t);

    // Prune old clicks outside the 30s window
    const cutoff = t - CAT_BELLY_WINDOW;
    this.catClickTimestamps = this.catClickTimestamps.filter((ts) => ts >= cutoff);

    if (this.catClickTimestamps.length >= CAT_BELLY_CLICK_THRESHOLD) {
      this.catBellyUp = true;
      this.catBellyStartTime = t;
      this.catBellyTriggered = true;
      this.catClickTimestamps = [];
      return true;
    }

    return false;
  }

  isBellyUp(t: number): boolean {
    if (!this.catBellyUp) return false;
    if (t - this.catBellyStartTime > CAT_BELLY_DURATION) {
      this.catBellyUp = false;
      this.catBellyCooldownUntil = t + CAT_BELLY_COOLDOWN;
      this.catBellyTriggered = false;
      return false;
    }
    return true;
  }

  wasBellyTriggered(): boolean {
    return this.catBellyTriggered;
  }

  destroy(): void {
    this.catClickTimestamps = [];
  }
}

// Rhythm layer verification data
interface RhythmEntry {
  id: string;
  layer: string;
  period: number;
  phase: number;
  amplitudeRange: [number, number];
  region: 'center' | 'mid' | 'edge' | 'bg';
}

const RHYTHM_REGISTRY: RhythmEntry[] = [
  {
    id: 'crystal-ball-fog',
    layer: 'L3',
    period: 2,
    phase: 0.5,
    amplitudeRange: [80, 100],
    region: 'center',
  },
  {
    id: 'crystal-ball-halo',
    layer: 'L2',
    period: 3,
    phase: 1.2,
    amplitudeRange: [80, 100],
    region: 'center',
  },
  {
    id: 'tarot-float',
    layer: 'L1',
    period: 4,
    phase: 2.0,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  {
    id: 'neon-breathe',
    layer: 'L1',
    period: 4,
    phase: 3.5,
    amplitudeRange: [60, 85],
    region: 'edge',
  },
  {
    id: 'neon-glitch',
    layer: 'L5',
    period: 0,
    phase: 5.0,
    amplitudeRange: [60, 85],
    region: 'edge',
  },
  {
    id: 'bagua-idle',
    layer: 'L0',
    period: 20,
    phase: 0.8,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  { id: 'palm-cycle', layer: 'L2', period: 3, phase: 1.5, amplitudeRange: [70, 95], region: 'mid' },
  {
    id: 'fortune-breathe',
    layer: 'L2',
    period: 3,
    phase: 2.5,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  {
    id: 'cyber-cat-tail',
    layer: 'L3',
    period: 2,
    phase: 0.7,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  {
    id: 'oracle-girl-float',
    layer: 'L1',
    period: 4,
    phase: 1.0,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  {
    id: 'oracle-girl-halo',
    layer: 'L0',
    period: 6,
    phase: 0.3,
    amplitudeRange: [70, 95],
    region: 'mid',
  },
  {
    id: 'poetry-golden-flow',
    layer: 'L2',
    period: 3,
    phase: 0.9,
    amplitudeRange: [60, 85],
    region: 'edge',
  },
  {
    id: 'ambient-dust',
    layer: 'L0',
    period: 8,
    phase: 1.7,
    amplitudeRange: [30, 60],
    region: 'bg',
  },
];

export function verifyRhythmLayering(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const byLayer = new Map<string, RhythmEntry[]>();

  for (const entry of RHYTHM_REGISTRY) {
    const list = byLayer.get(entry.layer) ?? [];
    list.push(entry);
    byLayer.set(entry.layer, list);
  }

  for (const [layer, entries] of byLayer) {
    if (layer === 'L5') continue; // random layer, no phase constraint
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]!;
        const b = entries[j]!;
        if (Math.abs(a.phase - b.phase) < 0.1) {
          warnings.push(
            `${a.id} and ${b.id} share layer ${layer} with phase ≈ ${a.phase.toFixed(1)}`,
          );
        }
      }
    }
  }

  // Amplitude checks
  const amplitudeRules: Record<string, [number, number]> = {
    center: [80, 100],
    mid: [70, 95],
    edge: [60, 85],
    bg: [30, 60],
  };

  for (const entry of RHYTHM_REGISTRY) {
    const [minA, maxA] = amplitudeRules[entry.region] ?? [0, 100];
    if (entry.amplitudeRange[0] < minA || entry.amplitudeRange[1] > maxA) {
      warnings.push(
        `${entry.id} amplitude [${entry.amplitudeRange}] exceeds ${entry.region} range [${minA}, ${maxA}]`,
      );
    }
  }

  return { valid: warnings.length === 0, warnings };
}
