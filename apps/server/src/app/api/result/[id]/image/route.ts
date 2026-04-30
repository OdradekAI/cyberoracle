import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const RESULTS_DIR = join(process.cwd(), 'storage', 'results');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Check result exists and is not expired
  let resultJson: string;
  try {
    resultJson = await readFile(join(RESULTS_DIR, `${id}.json`), 'utf-8');
  } catch {
    return NextResponse.json({ error: `Result "${id}" not found` }, { status: 404 });
  }

  const stored = JSON.parse(resultJson) as {
    kind: string;
    result: unknown;
    completedAt: string;
  };

  const completedAt = new Date(stored.completedAt).getTime();
  if (Date.now() - completedAt > MAX_AGE_MS) {
    return NextResponse.json({ error: 'Result expired' }, { status: 410 });
  }

  // Read PNG file
  let pngBuffer: Buffer;
  try {
    pngBuffer = await readFile(join(RESULTS_DIR, `${id}.png`));
  } catch {
    return NextResponse.json({ error: `Image for "${id}" not found` }, { status: 404 });
  }

  return new Response(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800',
    },
  });
}
