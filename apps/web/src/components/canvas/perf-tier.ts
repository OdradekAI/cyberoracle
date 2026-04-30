export type PerfTier = 'high' | 'mid' | 'low';

export interface TierConfig {
  particles: number;
  maxShadowBlur: number;
  glitchEnabled: boolean;
  simplifiedHalos: boolean;
}

export const TIER_CONFIGS: Record<PerfTier, TierConfig> = {
  high: {
    particles: 150,
    maxShadowBlur: 8,
    glitchEnabled: true,
    simplifiedHalos: false,
  },
  mid: {
    particles: 100,
    maxShadowBlur: 4,
    glitchEnabled: true,
    simplifiedHalos: false,
  },
  low: {
    particles: 50,
    maxShadowBlur: 0,
    glitchEnabled: false,
    simplifiedHalos: true,
  },
};

const HIGH_GPU_PATTERNS = [
  /Apple GPU/i,
  /Apple M[1-9]/i,
  /NVIDIA GeForce RTX/i,
  /NVIDIA GeForce GTX 1[0-9]{3}/i,
  /AMD Radeon RX [6-7]\d{3}/i,
  /Adreno 6[5-9]\d/i,
  /Adreno 7\d\d/i,
  /Mali-G7[0-9]/i,
  /Mali-G5[0-9]/i,
];

export function detectPerformanceTier(): PerfTier {
  // prefers-reduced-motion always forces low
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  // Check WebGL renderer string
  const gl = getWebGLRenderer();
  if (gl) {
    for (const pattern of HIGH_GPU_PATTERNS) {
      if (pattern.test(gl)) return 'high';
    }
  }

  // Check device memory + cores
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (memory >= 8 && cores >= 8) return 'high';
  if (memory >= 4 && cores >= 4) return 'mid';

  return 'low';
}

function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const webgl = gl as WebGLRenderingContext;
    const ext = webgl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    const renderer = webgl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return typeof renderer === 'string' ? renderer : null;
  } catch {
    return null;
  }
}

// Global singleton — compute once, cache
let cachedTier: PerfTier | null = null;

export function getPerformanceTier(): PerfTier {
  if (!cachedTier) {
    cachedTier = detectPerformanceTier();
  }
  return cachedTier;
}

// For testing: allow override
export function setPerformanceTierOverride(tier: PerfTier | null): void {
  cachedTier = tier;
}

// Convenience: get config for current tier
export function getTierConfig(): TierConfig {
  return TIER_CONFIGS[getPerformanceTier()];
}
