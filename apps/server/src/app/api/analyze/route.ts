import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PipelineEventSchema } from '@cyberoracle/core';
import {
  generatePalmReading,
  generateFaceReading,
  type ReadingResult,
} from '../../../services/reading-service';

const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');
const RESULTS_DIR = join(process.cwd(), 'storage', 'results');

function emitEvent(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function validateEvent(event: Record<string, unknown>): boolean {
  return PipelineEventSchema.safeParse(event).success;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing "id" query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read upload metadata
  let metaJson: string;
  try {
    metaJson = await readFile(join(UPLOAD_DIR, `${id}.meta.json`), 'utf-8');
  } catch {
    return new Response(JSON.stringify({ error: `Upload "${id}" not found` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const meta = JSON.parse(metaJson) as {
    kind: string;
    originalName: string;
    size: number;
    mime: string;
    uploadedAt: string;
  };

  if (meta.kind !== 'palm' && meta.kind !== 'face') {
    return new Response(JSON.stringify({ error: `Invalid kind: ${meta.kind}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read image file
  const imageBuffer = await readFile(join(UPLOAD_DIR, `${id}.webp`));
  const imageDataUrl = `data:image/webp;base64,${imageBuffer.toString('base64')}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        if (!validateEvent(event)) {
          const errorEvent = {
            step: 'complete',
            status: 'error',
            data: null,
            error: 'Invalid event',
          };
          controller.enqueue(encoder.encode(emitEvent(errorEvent)));
          return;
        }
        controller.enqueue(encoder.encode(emitEvent(event)));
      };

      // Step 1: VLM observe — running
      send({ step: 'vlm_observe', status: 'running', data: null });

      let observationEmitted = false;
      const emitObservationDone = (observation: { observations: Record<string, string> }) => {
        if (observationEmitted) return;
        observationEmitted = true;
        send({
          step: 'vlm_observe',
          status: 'done',
          data: { observations: observation.observations },
        });
        // Step 2: LLM interpret — running (with streaming chunks)
        send({ step: 'llm_interpret', status: 'running', data: null });
      };

      let result: ReadingResult<unknown>;
      try {
        if (meta.kind === 'palm') {
          result = await generatePalmReading(imageDataUrl, {
            onObservation: emitObservationDone,
            onChunk(chunk: string) {
              send({ step: 'llm_interpret', status: 'running', data: { partial: chunk } });
            },
          });
        } else {
          result = await generateFaceReading(imageDataUrl, {
            onObservation: emitObservationDone,
            onChunk(chunk: string) {
              send({ step: 'llm_interpret', status: 'running', data: { partial: chunk } });
            },
          });
        }
      } catch (err) {
        send({
          step: 'complete',
          status: 'error',
          data: null,
          error: (err as Error).message,
        });
        controller.close();
        return;
      }

      if (result.status === 'rejected') {
        send({
          step: 'complete',
          status: 'done',
          data: { status: 'rejected', reason: result.reason },
        });
        controller.close();
        return;
      }

      if (result.status === 'failed') {
        send({
          step: 'complete',
          status: 'error',
          data: null,
          error: result.detail,
        });
        controller.close();
        return;
      }

      // Save result to /storage/results/{id}.json
      try {
        const { mkdir, writeFile } = await import('node:fs/promises');
        await mkdir(RESULTS_DIR, { recursive: true });
        await writeFile(
          join(RESULTS_DIR, `${id}.json`),
          JSON.stringify(
            { kind: meta.kind, result: result.data, completedAt: new Date().toISOString() },
            null,
            2,
          ),
          'utf-8',
        );
      } catch (err) {
        // Non-fatal: result still sent to client, but log so prod alerts can surface it.
        console.error('[m2-audit][analyze] failed to persist result file', err);
      }

      send({ step: 'complete', status: 'done', data: result.data });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
