import type { OllamaTool } from "../helpers/ollama";
import { toolResultCache, makeCacheKey } from "../helpers/cache";
import { rateLimiter, TOOL_LIMITS } from "../helpers/rateLimit";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  ollamaTool: OllamaTool;
  handler: (args: Record<string, unknown>) => Promise<string>;
  cacheable?: boolean;
  cacheTtlMs?: number;
}

const calculatorTool: ToolDefinition = {
  id: "calculator",
  name: "Calculator",
  description: "Perform mathematical calculations",
  ollamaTool: {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate a mathematical expression and return the numeric result",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "The math expression to evaluate" },
        },
        required: ["expression"],
      },
    },
  } satisfies OllamaTool,
  cacheable: true,
  cacheTtlMs: 600_000,
  async handler(args: Record<string, unknown>): Promise<string> {
    const expr = String(args.expression ?? "");
    if (!expr) return "No expression provided.";
    try {
      const safe = expr.replace(/[^0-9+\-*/().,% \t]/g, "");
      const result = Function(`"use strict"; return (${safe})`)();
      return `${expr} = ${result}`;
    } catch {
      return `Unable to evaluate: ${expr}`;
    }
  },
};

const currentTimeTool: ToolDefinition = {
  id: "current_time",
  name: "Current Time",
  description: "Get the current date and time",
  ollamaTool: {
    type: "function",
    function: {
      name: "current_time",
      description: "Return the current date and time, optionally in a specific timezone",
      parameters: {
        type: "object",
        properties: {
          timezone: { type: "string", description: "IANA timezone name, e.g. 'Asia/Jakarta'. Defaults to UTC." },
          format: { type: "string", description: "Either 'full' (default) or 'short'" },
        },
      },
    },
  } satisfies OllamaTool,
  cacheable: false,
  async handler(args: Record<string, unknown>): Promise<string> {
    const tz = String(args.timezone ?? "UTC");
    const fmt = String(args.format ?? "full");
    const now = new Date();
    try {
      if (fmt === "short") {
        return now.toLocaleString("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions);
      }
      return now.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return `Current time (UTC): ${now.toISOString()}`;
    }
  },
};

const webSearchTool: ToolDefinition = {
  id: "web_search",
  name: "Web Search",
  description: "Search the web for current information",
  ollamaTool: {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for up-to-date information on a topic",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query string" },
          maxResults: { type: "number", description: "Max results to return (1-10, default 5)" },
        },
        required: ["query"],
      },
    },
  } satisfies OllamaTool,
  cacheable: true,
  cacheTtlMs: 120_000,
  async handler(args: Record<string, unknown>): Promise<string> {
    const query = String(args.query ?? "");
    return `Web search for "${query}" is not available in this environment. Answer based on your training data and note if information may be outdated.`;
  },
};

export const ALL_TOOLS: ToolDefinition[] = [
  calculatorTool,
  currentTimeTool,
  webSearchTool,
];

export function getOllamaTools(options?: { webSearch?: boolean }): OllamaTool[] {
  const webSearchOn = options?.webSearch ?? true;
  return ALL_TOOLS
    .filter((t) => webSearchOn || t.id !== "web_search")
    .map((t) => t.ollamaTool);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = ALL_TOOLS.find(
    (t) => t.ollamaTool.function.name === name || t.id === name
  );
  if (!tool) return `Tool "${name}" not found in registry.`;

  const toolKey = `tool:${tool.ollamaTool.function.name}`;
  const limits = TOOL_LIMITS[name] ?? TOOL_LIMITS.default;

  if (!rateLimiter.tryConsume(toolKey, limits.limit, limits.windowMs)) {
    const waitMs = rateLimiter.retryAfterMs(toolKey, limits.limit, limits.windowMs);
    return `Rate limit exceeded for tool "${name}". Retry after ${Math.ceil(waitMs / 1000)}s.`;
  }

  if (tool.cacheable) {
    const cacheKey = makeCacheKey(name, args);
    const cached = toolResultCache.get(cacheKey);
    if (cached) return `[cached] ${cached}`;
  }

  try {
    const result = await withRetry(() => tool.handler(args), 2, 400);

    if (tool.cacheable) {
      const cacheKey = makeCacheKey(name, args);
      toolResultCache.set(cacheKey, result, tool.cacheTtlMs);
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Tool "${name}" failed after retries: ${msg}`;
  }
}

export { calculatorTool, currentTimeTool, webSearchTool };
