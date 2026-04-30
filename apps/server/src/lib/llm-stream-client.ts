export class NoProviderAvailableError extends Error {
  constructor(message = 'All LLM streaming providers failed or no API keys configured') {
    super(message);
    this.name = 'NoProviderAvailableError';
  }
}

export interface LLMStreamOptions {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

interface StreamProvider {
  name: string;
  apiKey: string | undefined;
  buildRequest: (options: LLMStreamOptions) => {
    url: string;
    body: string;
    headers: Record<string, string>;
  };
}

function makeDeepSeekProvider(): StreamProvider {
  return {
    name: 'deepseek-v3',
    apiKey: process.env.DEEPSEEK_API_KEY,
    buildRequest(options) {
      const body: Record<string, unknown> = {
        model: 'deepseek-chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1500,
        stream: true,
      };
      if (options.responseFormat) {
        body.response_format = options.responseFormat;
      }
      return {
        url: 'https://api.deepseek.com/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };
    },
  };
}

function makeQwenProvider(): StreamProvider {
  return {
    name: 'qwen-plus',
    apiKey: process.env.QWEN_API_KEY,
    buildRequest(options) {
      return {
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1500,
          stream: true,
        }),
      };
    },
  };
}

function makeOpenAIProvider(): StreamProvider {
  return {
    name: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    buildRequest(options) {
      const body: Record<string, unknown> = {
        model: 'gpt-4o-mini',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1500,
        stream: true,
      };
      if (options.responseFormat) {
        body.response_format = options.responseFormat;
      }
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };
    },
  };
}

async function* parseSSEStream(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* callLLMStream(options: LLMStreamOptions): AsyncIterable<string> {
  const providers: StreamProvider[] = [
    makeDeepSeekProvider(),
    makeQwenProvider(),
    makeOpenAIProvider(),
  ];

  const available = providers.filter((p) => p.apiKey);
  if (available.length === 0) {
    throw new NoProviderAvailableError();
  }

  let lastError: Error | null = null;
  for (const provider of available) {
    let chunkCount = 0;
    try {
      const { url, body, headers } = provider.buildRequest(options);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!res.ok) {
        throw new Error(`Provider ${provider.name} returned status ${res.status}`);
      }

      if (!res.body) {
        throw new Error(`Provider ${provider.name} returned no body`);
      }

      for await (const chunk of parseSSEStream(res.body)) {
        chunkCount++;
        yield chunk;
      }
      return;
    } catch (err) {
      lastError = err as Error;
      if (chunkCount > 0) {
        // Mid-stream failure — propagate to caller
        throw lastError;
      }
      // 0 chunks — silent failover to next provider
    }
  }

  throw new NoProviderAvailableError(
    `All LLM streaming providers failed. Last error: ${lastError?.message ?? 'unknown'}`,
  );
}
