import type { OllamaTool } from "../helpers/ollama";

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
    const query = String(args.query ?? "");
    return `Web search for "${query}" is not available in this environment. Answer based on your training data and note if information may be outdated.`;
  },
};
