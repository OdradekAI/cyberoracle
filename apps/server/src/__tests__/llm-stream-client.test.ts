import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLLMStream, NoProviderAvailableError } from '../lib/llm-stream-client';

function makeSSEBody(chunks: string[]): string {
  return chunks
    .map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}`)
    .concat('data: [DONE]')
    .join('\n\n');
}

describe('callLLMStream', () => {
  const originalEnv = process.env;
  const mockMessages = [
    { role: 'system' as const, content: 'You are helpful.' },
    { role: 'user' as const, content: 'Hello' },
  ];

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws NoProviderAvailableError when no API keys are set', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.QWEN_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(async () => {
      for await (const _ of callLLMStream({ messages: mockMessages })) {
        // drain
      }
    }).rejects.toThrow(NoProviderAvailableError);
  });

  it('calls DeepSeek V3 first when DEEPSEEK_API_KEY is set', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeSSEBody(['hello', ' world']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    const chunks: string[] = [];
    for await (const chunk of callLLMStream({ messages: mockMessages })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['hello', ' world']);
    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(callUrl).toContain('api.deepseek.com');
  });

  it('falls back to Qwen-Plus when DeepSeek fails with 0 chunks', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.QWEN_API_KEY = 'test-qwen-key';

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(makeSSEBody(['qwen', ' result']), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      );

    const chunks: string[] = [];
    for await (const chunk of callLLMStream({ messages: mockMessages })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['qwen', ' result']);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to GPT-4o-mini when DeepSeek and Qwen both fail', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    process.env.QWEN_API_KEY = 'test-qwen-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(
        new Response(makeSSEBody(['openai', ' result']), {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      );

    const chunks: string[] = [];
    for await (const chunk of callLLMStream({ messages: mockMessages })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['openai', ' result']);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('skips providers without API keys', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.QWEN_API_KEY;
    process.env.OPENAI_API_KEY = 'test-openai-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeSSEBody(['result']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    const chunks: string[] = [];
    for await (const chunk of callLLMStream({ messages: mockMessages })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(['result']);
    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(callUrl).toContain('api.openai.com');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('propagates error when provider fails mid-stream', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

    const encoder = new TextEncoder();
    const partialData = encoder.encode(
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'partial' } }] })}\n\n`,
    );

    let readCount = 0;
    const body = new ReadableStream({
      pull(controller) {
        readCount++;
        if (readCount === 1) {
          controller.enqueue(partialData);
        } else {
          controller.error(new Error('Connection lost'));
        }
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    const chunks: string[] = [];
    let caughtError: Error | null = null;
    try {
      for await (const chunk of callLLMStream({ messages: mockMessages })) {
        chunks.push(chunk);
      }
    } catch (err) {
      caughtError = err as Error;
    }

    expect(chunks).toContain('partial');
    expect(caughtError).toBeTruthy();
  });

  it('forwards responseFormat to providers', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeSSEBody(['{"result":true}']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    const chunks: string[] = [];
    for await (const chunk of callLLMStream({
      messages: mockMessages,
      responseFormat: { type: 'json_object' },
    })) {
      chunks.push(chunk);
    }

    const callBody = JSON.parse(
      ((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit)
        .body as string,
    );
    expect(callBody.response_format).toEqual({ type: 'json_object' });
  });

  it('never logs API keys', async () => {
    process.env.DEEPSEEK_API_KEY = 'super-secret-key';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(makeSSEBody(['ok']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    for await (const _ of callLLMStream({ messages: mockMessages })) {
      // drain
    }

    const allLogs = [
      ...consoleSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
      ...consoleWarnSpy.mock.calls.flat(),
    ].join(' ');
    expect(allLogs).not.toContain('super-secret-key');
  });
});
