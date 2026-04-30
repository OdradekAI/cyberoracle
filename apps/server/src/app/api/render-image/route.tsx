import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { renderToPng } from '@cyberoracle/poster/render/render-server';
import { PalmReadingPoster } from '@cyberoracle/poster/components/PalmReadingPoster';
import { FaceReadingPoster } from '@cyberoracle/poster/components/FaceReadingPoster';

const RESULTS_DIR = join(process.cwd(), 'storage', 'results');

export async function POST(request: NextRequest) {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id } = body;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing "id" field' }, { status: 400 });
  }

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

  if (stored.kind !== 'palm' && stored.kind !== 'face') {
    return NextResponse.json({ error: `Unknown kind: ${stored.kind}` }, { status: 400 });
  }

  try {
    const element =
      stored.kind === 'palm' ? (
        <PalmReadingPoster data={stored.result as any} />
      ) : (
        <FaceReadingPoster data={stored.result as any} />
      );

    const pngBuffer = await renderToPng(element, { width: 800 });

    await mkdir(RESULTS_DIR, { recursive: true });
    await writeFile(join(RESULTS_DIR, `${id}.png`), pngBuffer);

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Render failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
