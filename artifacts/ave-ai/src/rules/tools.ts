export interface ToolRule {
  toolName: string;
  rateLimit: number;
  cacheTtlMs: number;
  maxRetries: number;
  fallbackTool?: string;
  allowedParams?: string[];
}

export const toolRules: Record<string, ToolRule> = {
  calculator: {
    toolName: "calculator",
    rateLimit: 60,
    cacheTtlMs: 300000,
    maxRetries: 1,
  },
  current_time: {
    toolName: "current_time",
    rateLimit: 60,
    cacheTtlMs: 5000,
    maxRetries: 1,
  },
  web_search: {
    toolName: "web_search",
    rateLimit: 10,
    cacheTtlMs: 60000,
    maxRetries: 2,
    fallbackTool: "calculator",
  },
  read_file: {
    toolName: "read_file",
    rateLimit: 30,
    cacheTtlMs: 30000,
    maxRetries: 1,
  },
  summarize_text: {
    toolName: "summarize_text",
    rateLimit: 20,
    cacheTtlMs: 120000,
    maxRetries: 2,
  },
};

export function getToolRule(toolName: string): ToolRule {
  return (
    toolRules[toolName] ?? {
      toolName,
      rateLimit: 20,
      cacheTtlMs: 60000,
      maxRetries: 2,
    }
  );
}
