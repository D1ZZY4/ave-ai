/**
 * Ollama API helper — all requests go through the API server proxy.
 * This avoids CORS when using external URLs (Cloudflare tunnels, VPS, Kaggle, etc.)
 */

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: OllamaToolCall[];
  images?: string[];
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
}

export interface OllamaChatChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaOptions {
  temperature?: number;
  num_predict?: number;
  top_p?: number;
  repeat_penalty?: number;
}

/**
 * Returns the correct proxy base path.
 * In production (deployed), BASE_URL will include the frontend path prefix.
 */
function proxyBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

/**
 * Fetch available models from Ollama via our API proxy.
 * Passes the user's configured baseUrl so the server can forward it.
 */
export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  const url = `${proxyBase()}/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error || `Failed to fetch models (${res.status})`);
  }
  const data = await res.json() as { models: OllamaModel[] };
  return data.models || [];
}

/**
 * Stream a chat completion via our API proxy.
 * The proxy forwards the request to the user's configured Ollama URL.
 */
export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: OllamaMessage[],
  tools?: OllamaTool[],
  options?: OllamaOptions,
  signal?: AbortSignal
): AsyncGenerator<OllamaChatChunk> {
  const body: Record<string, unknown> = {
    baseUrl,
    model,
    messages,
    stream: true,
    options: {
      temperature: options?.temperature ?? 0.7,
      num_predict: options?.num_predict ?? 1024,
      top_p: options?.top_p ?? 0.9,
      repeat_penalty: options?.repeat_penalty ?? 1.1,
    },
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  const res = await fetch(`${proxyBase()}/ollama/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error || `Ollama proxy error (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream from proxy");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as OllamaChatChunk;
      } catch {
        // skip malformed chunk
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim()) as OllamaChatChunk;
    } catch {
      // ignore
    }
  }
}
