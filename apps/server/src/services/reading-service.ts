import { z } from 'zod';
import {
  loadPrompt,
  fillTemplate,
  expandIncludes,
  PalmObservationSchema,
  FaceObservationSchema,
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  checkContent,
} from '@cyberoracle/core';
import { callVLM } from '../lib/vlm-client';
import { callLLMStream } from '../lib/llm-stream-client';

export interface ReadingRejected {
  status: 'rejected';
  reason: string;
}

export interface ReadingOk<T> {
  status: 'ok';
  data: T;
}

export interface ReadingFailed {
  status: 'failed';
  detail: string;
}

export type ReadingResult<T> = ReadingRejected | ReadingOk<T> | ReadingFailed;

export interface ReadingOptions {
  onChunk?: (chunk: string) => void;
}

async function runVlmObservation(
  imageDataUrl: string,
  visionPromptName: string,
): Promise<{ observationJson: string; valid: boolean; reason?: string }> {
  const prompt = loadPrompt(visionPromptName);
  const system = await expandIncludes(prompt.system);

  const userContent = [
    { type: 'image_url' as const, image_url: { url: imageDataUrl } },
    { type: 'text' as const, text: prompt.userTemplate || '请按系统指令观察，输出 JSON：' },
  ];

  const rawResult = await callVLM({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature: prompt.meta.temperature,
    maxTokens: prompt.meta.maxTokens,
  });

  const parsed = JSON.parse(rawResult);
  return { observationJson: rawResult, valid: parsed.valid === true, reason: parsed.reason };
}

async function runLlmInterpretation(
  observationJson: string,
  readingPromptName: string,
  options?: ReadingOptions,
): Promise<string> {
  const prompt = loadPrompt(readingPromptName);
  const system = await expandIncludes(prompt.system);
  const userMessage = fillTemplate(prompt.userTemplate, { observations: observationJson });

  let buffer = '';
  for await (const chunk of callLLMStream({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ],
    temperature: prompt.meta.temperature,
    maxTokens: prompt.meta.maxTokens,
    responseFormat: prompt.meta.outputFormat === 'json' ? { type: 'json_object' } : undefined,
  })) {
    buffer += chunk;
    options?.onChunk?.(chunk);
  }

  return buffer;
}

export async function generatePalmReading(
  imageDataUrl: string,
  options?: ReadingOptions,
): Promise<ReadingResult<z.infer<typeof PalmReadingResultSchema>>> {
  try {
    // Stage 1: VLM observation
    const obs = await runVlmObservation(imageDataUrl, 'vision-observe-palm');

    const obsParsed = PalmObservationSchema.safeParse(JSON.parse(obs.observationJson));
    if (!obsParsed.success) {
      return { status: 'rejected', reason: 'low_quality' };
    }
    if (!obsParsed.data.valid) {
      return { status: 'rejected', reason: obsParsed.data.reason };
    }

    // Stage 2: LLM interpretation
    const buffer = await runLlmInterpretation(obs.observationJson, 'reading-write-palm', options);

    // Stage 3: Parse + validate + safety check
    const parsed = JSON.parse(buffer);
    const schemaResult = PalmReadingResultSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        status: 'failed',
        detail: `Schema validation failed: ${schemaResult.error.message}`,
      };
    }

    const safetyResult = checkContent(JSON.stringify(schemaResult.data));
    if (!safetyResult.safe) {
      return {
        status: 'failed',
        detail: `Content safety check failed: ${safetyResult.matched.join(', ')}`,
      };
    }

    return { status: 'ok', data: schemaResult.data };
  } catch (err) {
    return { status: 'failed', detail: (err as Error).message };
  }
}

export async function generateFaceReading(
  imageDataUrl: string,
  options?: ReadingOptions,
): Promise<ReadingResult<z.infer<typeof FaceReadingResultSchema>>> {
  try {
    // Stage 1: VLM observation
    const obs = await runVlmObservation(imageDataUrl, 'vision-observe-face');

    const obsParsed = FaceObservationSchema.safeParse(JSON.parse(obs.observationJson));
    if (!obsParsed.success) {
      return { status: 'rejected', reason: 'low_quality' };
    }
    if (!obsParsed.data.valid) {
      return { status: 'rejected', reason: obsParsed.data.reason };
    }

    // Stage 2: LLM interpretation
    const buffer = await runLlmInterpretation(obs.observationJson, 'reading-write-face', options);

    // Stage 3: Parse + validate + safety check
    const parsed = JSON.parse(buffer);
    const schemaResult = FaceReadingResultSchema.safeParse(parsed);
    if (!schemaResult.success) {
      return {
        status: 'failed',
        detail: `Schema validation failed: ${schemaResult.error.message}`,
      };
    }

    const safetyResult = checkContent(JSON.stringify(schemaResult.data));
    if (!safetyResult.safe) {
      return {
        status: 'failed',
        detail: `Content safety check failed: ${safetyResult.matched.join(', ')}`,
      };
    }

    return { status: 'ok', data: schemaResult.data };
  } catch (err) {
    return { status: 'failed', detail: (err as Error).message };
  }
}
