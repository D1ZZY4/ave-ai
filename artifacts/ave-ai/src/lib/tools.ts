import type { OllamaTool } from "./ollama";

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  ollamaTool: OllamaTool;
  handler?: (args: Record<string, unknown>) => Promise<string>;
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    id: "get_current_time",
    name: "Current Time",
    description: "Get the current date and time",
    ollamaTool: {
      type: "function",
      function: {
        name: "get_current_time",
        description: "Get the current date and time in the user's timezone",
        parameters: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "Optional timezone (e.g. 'Asia/Jakarta'). Defaults to local.",
            },
          },
        },
      },
    },
    handler: async (args) => {
      const tz = (args.timezone as string) || undefined;
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
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
      return `Current time: ${formatted}`;
    },
  },
  {
    id: "calculate",
    name: "Calculator",
    description: "Perform mathematical calculations",
    ollamaTool: {
      type: "function",
      function: {
        name: "calculate",
        description: "Perform a mathematical calculation and return the result",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "The mathematical expression to evaluate (e.g. '2 + 2 * 3')",
            },
          },
          required: ["expression"],
        },
      },
    },
    handler: async (args) => {
      const expr = args.expression as string;
      try {
        // Safe eval for basic math
        const result = Function(`"use strict"; return (${expr.replace(/[^0-9+\-*/().% \t]/g, "")})`)();
        return `${expr} = ${result}`;
      } catch {
        return `Could not evaluate: ${expr}`;
      }
    },
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for information (requires model support)",
    ollamaTool: {
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information about a topic",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query",
            },
          },
          required: ["query"],
        },
      },
    },
    handler: async (args) => {
      return `Web search for "${args.query}" is not available in this environment. Please provide information from your training data.`;
    },
  },
];

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = AVAILABLE_TOOLS.find((t) => t.ollamaTool.function.name === toolName);
  if (!tool?.handler) {
    return `Tool "${toolName}" is not implemented.`;
  }
  try {
    return await tool.handler(args);
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
