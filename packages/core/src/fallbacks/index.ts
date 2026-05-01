import type { z } from 'zod';
import {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  DailyFortuneResultSchema,
} from '../schemas';
import { loadJsonPrompt } from '../prompts/loader';

interface FallbackBundle {
  palm: z.infer<typeof PalmReadingResultSchema>;
  face: z.infer<typeof FaceReadingResultSchema>;
  daily: z.infer<typeof DailyFortuneResultSchema>;
  companion: Record<string, string[]>;
}

let cache: FallbackBundle | null = null;

function loadBundle(): FallbackBundle {
  if (cache) return cache;

  const raw = loadJsonPrompt('fallback-soft');

  const palm = PalmReadingResultSchema.safeParse(raw.palm);
  if (!palm.success) {
    throw new Error(`fallback-soft.md palm payload invalid: ${palm.error.message}`);
  }

  const face = FaceReadingResultSchema.safeParse(raw.face);
  if (!face.success) {
    throw new Error(`fallback-soft.md face payload invalid: ${face.error.message}`);
  }

  // daily.date is a runtime-injected placeholder in the .md; safeParse the
  // shape with date='', then overwrite at read time in getDailyFallback().
  const daily = DailyFortuneResultSchema.safeParse(raw.daily);
  if (!daily.success) {
    throw new Error(`fallback-soft.md daily payload invalid: ${daily.error.message}`);
  }

  const companion = raw.companion;
  if (!companion || typeof companion !== 'object' || Array.isArray(companion)) {
    throw new Error('fallback-soft.md companion section must be an object of category → string[]');
  }
  // Lightweight runtime check: every value must be a non-empty string array.
  for (const [key, value] of Object.entries(companion)) {
    if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== 'string')) {
      throw new Error(`fallback-soft.md companion["${key}"] must be a non-empty string[]`);
    }
  }

  cache = {
    palm: palm.data,
    face: face.data,
    daily: daily.data,
    companion: companion as Record<string, string[]>,
  };
  return cache;
}

export function getPalmFallback(): z.infer<typeof PalmReadingResultSchema> {
  return loadBundle().palm;
}

export function getFaceFallback(): z.infer<typeof FaceReadingResultSchema> {
  return loadBundle().face;
}

export function getDailyFallback(): z.infer<typeof DailyFortuneResultSchema> {
  const bundle = loadBundle();
  // Inject today's date at read time — the .md file stores an empty placeholder.
  const today = new Date()
    .toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    .replace(/\//g, '年')
    .replace(/月/, '月')
    .replace(/日/, '日');
  return { ...bundle.daily, date: today };
}

export function getCompanionLine(
  category: 'morning' | 'idle' | 'tap' | 'celebrate' | 'sad',
): string {
  const pool = loadBundle().companion[category];
  if (!pool || pool.length === 0) {
    return '我在的。';
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/**
 * Test helper: clear the lazily-loaded bundle so the next getter re-reads
 * fallback-soft.md from disk. Not exported through the package barrel.
 */
export function _resetFallbackCache(): void {
  cache = null;
}
