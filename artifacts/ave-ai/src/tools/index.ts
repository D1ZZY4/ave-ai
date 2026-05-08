import { calculatorTool } from "./calculator";
import { currentTimeTool } from "./current-time";
import { webSearchTool } from "./web-search";
import type { OllamaTool } from "../helpers/ollama";
import type { ToolExecutionResult } from "../types";
import { cacheGet, cacheSet } from "../helpers/cache";
import { checkRateLimit, recordUsage, initRateLimit } from "../helpers/rateLimit";
import { withRetry } from "../helpers/timer";
import { getToolRule } from "../rules/tools";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  ollamaTool: OllamaTool;
  handler: (args: Record<string, unknown>) => Promise<string>;
}

export const ALL_TOOLS: ToolDefinition[] = [
  calculatorTool,
  currentTimeTool,
  webSearchTool,
];

initRateLimit("calculator", 60);
initRateLimit("current_time", 60);
initRateLimit("web_search", 10);

export function getOllamaTools(): OllamaTool[] {
  return ALL_TOOLS.map((t) => t.ollamaTool);
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const tool = ALL_TOOLS.find((t) => t.ollamaTool.function.name === name);
  if (!tool) return `Tool "${name}" not found.`;
  try {
    return await tool.handler(args);
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function executeToolWithLifecycle(
  name: string,
  args: Record<string, unknown>,
  _globalCtx: { iterationCount: number; elapsedMs: number; estimatedTokens: number }
): Promise<ToolExecutionResult> {
  const tool = ALL_TOOLS.find((t) => t.ollamaTool.function.name === name);
  if (!tool) {
    return { success: false, result: `Tool "${name}" not found.`, error: "NOT_FOUND" };
  }

  const rule = getToolRule(name);

  const cached = cacheGet(name, args);
  if (cached) {
    return { success: true, result: cached, cached: true, retries: 0 };
  }

  if (!checkRateLimit(name)) {
    const fallback = rule.fallbackTool
      ? ALL_TOOLS.find((t) => t.ollamaTool.function.name === rule.fallbackTool)
      : null;

    if (fallback) {
      try {
        const result = await fallback.handler(args);
        return { success: true, result, cached: false, retries: 0 };
      } catch {
        // ignore fallback errors
      }
    }
    return { success: false, result: `Rate limit reached for tool "${name}"`, error: "RATE_LIMIT" };
  }

  let retries = 0;
  try {
    const result = await withRetry(
      () => tool.handler(args),
      rule.maxRetries,
      (attempt) => { retries = attempt; },
    );
    recordUsage(name);
    cacheSet(name, args, result, rule.cacheTtlMs);
    return { success: true, result, cached: false, retries };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);

    if (rule.fallbackTool) {
      const fallback = ALL_TOOLS.find((t) => t.ollamaTool.function.name === rule.fallbackTool);
      if (fallback) {
        try {
          const fallbackResult = await fallback.handler(args);
          return { success: true, result: `[via fallback ${rule.fallbackTool}] ${fallbackResult}`, cached: false, retries };
        } catch {
          // ignore
        }
      }
    }

    return { success: false, result: `Tool "${name}" failed: ${errMsg}`, error: errMsg, retries };
  }
}

export { calculatorTool, currentTimeTool, webSearchTool };
