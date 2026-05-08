import { calculatorTool } from "./calculator";
import { currentTimeTool } from "./current-time";
import { webSearchTool } from "./web-search";
import type { OllamaTool } from "../helpers/ollama";

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

export { calculatorTool, currentTimeTool, webSearchTool };
