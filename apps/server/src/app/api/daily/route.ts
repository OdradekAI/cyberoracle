import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Lunar } from 'lunar-typescript';
import {
  loadPrompt,
  fillTemplate,
  expandIncludes,
  DailyFortuneResultSchema,
  checkContent,
  getDailyFallback,
} from '@cyberoracle/core';
import { callLLMStream } from '../../../lib/llm-stream-client';

const CACHE_DIR = join(process.cwd(), 'storage', 'index');
const CACHE_PATH = join(CACHE_DIR, 'daily.json');

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Resolve real-world Chinese calendar context for the daily-fortune prompt
 * via the lunar-typescript library (no network, fully local).
 * Exported for unit testing — call `getDateContext(new Date(2026, 4, 1))`.
 */
export function getDateContext(now: Date = new Date()): {
  dateStr: string;
  ganzhi: string;
  solarTerm: string;
} {
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const lunar = Lunar.fromDate(now);
  const ganzhi = `${lunar.getDayInGanZhi()}日`;
  // The "solar term" for a given day = the most recent JieQi segment the day
  // falls into (e.g. May 1, 2026 → 谷雨). `getPrevJieQi(true)` includes today
  // when it's exactly the JieQi day; falls back to empty string defensively.
  const prev = lunar.getPrevJieQi(true);
  const solarTerm = prev ? prev.getName() : '';
  return { dateStr, ganzhi, solarTerm };
}

interface CachedDaily {
  date: string;
  data: unknown;
  cachedAt: string;
}

async function readCache(): Promise<CachedDaily | null> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(raw) as CachedDaily;
  } catch {
    return null;
  }
}

async function writeCache(entry: CachedDaily): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(entry, null, 2), 'utf-8');
}

async function generateDaily(): Promise<unknown> {
  const prompt = loadPrompt('daily-fortune');
  const system = await expandIncludes(prompt.system);
  const { dateStr, ganzhi, solarTerm } = getDateContext();

  const userMessage = fillTemplate(prompt.userTemplate || '', {
    date: dateStr,
    ganzhi,
    solarTerm,
  });

  let buffer = '';
  for await (const chunk of callLLMStream({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage || `请为 ${dateStr} 生成今日心境速写 JSON。` },
    ],
    temperature: prompt.meta.temperature,
    maxTokens: prompt.meta.maxTokens,
    responseFormat: prompt.meta.outputFormat === 'json' ? { type: 'json_object' } : undefined,
  })) {
    buffer += chunk;
  }

  const parsed = JSON.parse(buffer);
  const schemaResult = DailyFortuneResultSchema.safeParse(parsed);
  if (!schemaResult.success) {
    throw new Error(`Schema validation failed: ${schemaResult.error.message}`);
  }

  const safetyResult = checkContent(JSON.stringify(schemaResult.data));
  if (!safetyResult.safe) {
    throw new Error(`Content safety check failed: ${safetyResult.matched.join(', ')}`);
  }

  return schemaResult.data;
}

export async function GET() {
  const todayKey = getTodayKey();

  // Check cache
  const cached = await readCache();
  if (cached && cached.date === todayKey) {
    return NextResponse.json(cached.data);
  }

  // Generate fresh
  try {
    const data = await generateDaily();
    await writeCache({ date: todayKey, data, cachedAt: new Date().toISOString() });
    return NextResponse.json(data);
  } catch (err) {
    // Fallback on any failure (LLM down, schema mismatch, safety reject, disk error...)
    console.error('[m2-audit][daily] generation failed, falling back to soft content', err);
    const fallback = getDailyFallback();
    return NextResponse.json(fallback);
  }
}
