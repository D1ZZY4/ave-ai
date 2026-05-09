/**
 * Diagram 10, 14, 17, 26, 27: Tool Registry with retry, caching, and rate limiting.
 * All tool calls go through executeTool() which handles the full lifecycle.
 */
import { calculatorTool } from "./calculator";
import { currentTimeTool } from "./current-time";
import { webSearchTool } from "./web-search";
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

export const ALL_TOOLS: ToolDefinition[] = [
  { ...calculatorTool, cacheable: true, cacheTtlMs: 600_000 },
  { ...currentTimeTool, cacheable: false },
  { ...webSearchTool, cacheable: true, cacheTtlMs: 120_000 },
];

export function getOllamaTools(): OllamaTool[] {
  return ALL_TOOLS.map((t) => t.ollamaTool);
}

/**
 * Diagram 10: Retry with exponential backoff.
 * Retries up to maxRetries times with doubling delay starting at 500ms.
 */
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

/**
 * Diagram 14, 26, 27: Execute a tool by name with:
 * 1. Rate limit check (Diagram 27)
 * 2. Cache lookup (Diagram 26)
 * 3. Execution with retry (Diagram 10)
 * 4. Cache store on success (Diagram 26)
 */
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
