import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const RESULTS_DIR = join(process.cwd(), 'storage', 'results');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

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

  // Check expiry (7 days per PRD §10.1)
  const completedAt = new Date(stored.completedAt).getTime();
  if (Date.now() - completedAt > MAX_AGE_MS) {
    return NextResponse.json({ error: 'Result expired' }, { status: 410 });
  }

  return NextResponse.json(stored);
}
