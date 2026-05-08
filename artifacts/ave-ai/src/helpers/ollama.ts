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

export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  const url = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${url}/api/tags`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);
  const data = await res.json();
  return data.models || [];
}

export async function* streamChat(
  baseUrl: string,
  model: string,
  messages: OllamaMessage[],
  tools?: OllamaTool[],
  options?: OllamaOptions,
  signal?: AbortSignal
): AsyncGenerator<OllamaChatChunk> {
  const url = baseUrl.replace(/\/$/, "");
  const body: Record<string, unknown> = {
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

  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from Ollama");

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
