import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callVLM, NoProviderAvailableError } from '../lib/vlm-client';

describe('callVLM', () => {
  const originalEnv = process.env;
  const mockMessages = [
    {
      role: 'user' as const,
      content: [{ type: 'image_url' as const, image_url: { url: 'data:image/png;base64,abc' } }],
    },
  ];

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws NoProviderAvailableError when no API keys are set', async () => {
    delete process.env.QWEN_API_KEY;
    delete process.env.GLM_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(callVLM({ messages: mockMessages })).rejects.toThrow(NoProviderAvailableError);
  });

  it('throws NoProviderAvailableError when all providers fail', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';
    process.env.GLM_API_KEY = 'test-glm-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(callVLM({ messages: mockMessages })).rejects.toThrow(NoProviderAvailableError);
  });

  it('calls Qwen VL-Max first when QWEN_API_KEY is set', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"valid":true,"observations":{}}' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const result = await callVLM({ messages: mockMessages });
    expect(result).toBe('{"valid":true,"observations":{}}');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(callUrl).toContain('dashscope.aliyuncs.com');
  });

  it('falls back to GLM-4V when Qwen fails', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';
    process.env.GLM_API_KEY = 'test-glm-key';

    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Qwen down'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"valid":true,"observations":{}}' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const result = await callVLM({ messages: mockMessages });
    expect(result).toBe('{"valid":true,"observations":{}}');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to GPT-4o when Qwen and GLM both fail', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';
    process.env.GLM_API_KEY = 'test-glm-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Qwen down'))
      .mockRejectedValueOnce(new Error('GLM down'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"valid":true,"observations":{}}' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const result = await callVLM({ messages: mockMessages });
    expect(result).toBe('{"valid":true,"observations":{}}');
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('skips providers without API keys', async () => {
    delete process.env.QWEN_API_KEY;
    delete process.env.GLM_API_KEY;
    process.env.OPENAI_API_KEY = 'test-openai-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"valid":true,"observations":{}}' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const result = await callVLM({ messages: mockMessages });
    expect(result).toBe('{"valid":true,"observations":{}}');

    const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(callUrl).toContain('api.openai.com');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('forwards temperature and maxTokens options', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'result' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await callVLM({
      messages: mockMessages,
      temperature: 0.2,
      maxTokens: 800,
    });

    const callBody = JSON.parse(
      ((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit)
        .body as string,
    );
    expect(callBody.temperature).toBe(0.2);
    expect(callBody.max_tokens).toBe(800);
  });

  it('never logs API keys', async () => {
    process.env.QWEN_API_KEY = 'super-secret-key';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'result' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await callVLM({ messages: mockMessages });

    const allLogs = [
      ...consoleSpy.mock.calls.flat(),
      ...consoleErrorSpy.mock.calls.flat(),
      ...consoleWarnSpy.mock.calls.flat(),
    ].join(' ');
    expect(allLogs).not.toContain('super-secret-key');
  });

  it('handles non-200 response from provider', async () => {
    process.env.QWEN_API_KEY = 'test-qwen-key';
    process.env.GLM_API_KEY = 'test-glm-key';

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"valid":true}' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    const result = await callVLM({ messages: mockMessages });
    expect(result).toBe('{"valid":true}');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
