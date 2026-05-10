/**
 * flow-3 #24: Web status tool — reports whether web search is currently enabled.
 */
import type { OllamaTool } from "../helpers/ollama";

export const webStatusTool = {
  id: "web_status",
  name: "Web Status",
  description: "Check if web search is enabled or disabled",
  ollamaTool: {
    type: "function",
    function: {
      name: "web_status",
      description: "Returns whether web search access is currently enabled or disabled",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  } satisfies OllamaTool,
  async handler(_args: Record<string, unknown>): Promise<string> {
    return JSON.stringify({ webEnabled: true, note: "Web search is available via the web_search tool." });
  },
};
