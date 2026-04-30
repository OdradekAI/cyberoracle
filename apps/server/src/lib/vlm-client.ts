export class NoProviderAvailableError extends Error {
  constructor(message = 'All VLM providers failed or no API keys configured') {
    super(message);
    this.name = 'NoProviderAvailableError';
  }
}

export interface VLMCallOptions {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | ContentPart[];
  }>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface Provider {
  name: string;
  apiKey: string | undefined;
  buildRequest: (options: VLMCallOptions) => {
    url: string;
    body: string;
    headers: Record<string, string>;
  };
  parseResponse: (json: unknown) => string;
}

function makeQwenProvider(): Provider {
  return {
    name: 'qwen-vl-max',
    apiKey: process.env.QWEN_API_KEY,
    buildRequest(options) {
      return {
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800,
        }),
      };
    },
    parseResponse(json: unknown) {
      const data = json as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]!.message.content;
    },
  };
}

function makeGLMProvider(): Provider {
  return {
    name: 'glm-4v',
    apiKey: process.env.GLM_API_KEY,
    buildRequest(options) {
      return {
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.GLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4v',
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800,
        }),
      };
    },
    parseResponse(json: unknown) {
      const data = json as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]!.message.content;
    },
  };
}

function makeOpenAIProvider(): Provider {
  return {
    name: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
    buildRequest(options) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 800,
        }),
      };
    },
    parseResponse(json: unknown) {
      const data = json as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]!.message.content;
    },
  };
}

export async function callVLM(options: VLMCallOptions): Promise<string> {
  const providers: Provider[] = [makeQwenProvider(), makeGLMProvider(), makeOpenAIProvider()];

  const available = providers.filter((p) => p.apiKey);
  if (available.length === 0) {
    throw new NoProviderAvailableError();
  }

  let lastError: Error | null = null;
  for (const provider of available) {
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

      const json = await res.json();
      return provider.parseResponse(json);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw new NoProviderAvailableError(
    `All VLM providers failed. Last error: ${lastError?.message ?? 'unknown'}`,
  );
}
