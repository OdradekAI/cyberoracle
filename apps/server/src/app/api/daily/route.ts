import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
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

function getDateContext(): { dateStr: string; ganzhi: string; solarTerm: string } {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  // MVP: basic ganzhi placeholder — LLM generates the real value
  const ganzhi = `${dateStr}`;
  const solarTerm = '';
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
  } catch {
    // Fallback on any failure
    const fallback = getDailyFallback();
    return NextResponse.json(fallback);
  }
}
