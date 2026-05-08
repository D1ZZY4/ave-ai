import { z } from "zod";
import type { FlowTool, ToolExecutionResult } from "../types";
import type { OllamaTool } from "../helpers/ollama";

const schema = z.object({
  query: z.string().min(1).describe("The search query string"),
  maxResults: z.number().int().min(1).max(10).optional().default(5),
});

export const webSearchFlowTool: FlowTool = {
  id: "web_search",
  name: "Web Search",
  description: "Search the web for up-to-date information on a topic",
  schema,
  rateLimit: 10,
  cacheTtlMs: 60000,
  maxRetries: 2,
  fallbackTool: "calculator",
  async handler(args): Promise<ToolExecutionResult> {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      return { success: false, result: `Invalid params: ${parsed.error.message}` };
    }
    const { query } = parsed.data;
    return {
      success: true,
      result: `Web search for "${query}" is not available in this environment. Answer based on your training data and note if information may be outdated.`,
    };
  },
};

export const webSearchTool = {
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
  async handler(args: Record<string, unknown>): Promise<string> {
    const r = await webSearchFlowTool.handler(args);
    return r.result;
  },
};
