/**
 * flow-3 #24: Count tool — count items, characters, words, lines in text.
 */
import type { OllamaTool } from "../helpers/ollama";

export const countTool = {
  id: "count",
  name: "Count",
  description: "Count words, characters, lines, or items in text",
  ollamaTool: {
    type: "function",
    function: {
      name: "count",
      description: "Count words, characters, lines, or list items in provided text",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "The text to count" },
          mode: {
            type: "string",
            enum: ["words", "characters", "lines", "items"],
            description: "What to count: words, characters, lines, or comma-separated items",
          },
        },
        required: ["text", "mode"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const text = String(args.text ?? "");
    const mode = String(args.mode ?? "words");
    if (!text) return "No text provided.";
    switch (mode) {
      case "characters":
        return `Character count: ${text.length} (${text.replace(/\s/g, "").length} non-whitespace)`;
      case "lines":
        return `Line count: ${text.split("\n").length}`;
      case "items":
        return `Item count: ${text.split(",").map((s) => s.trim()).filter(Boolean).length}`;
      case "words":
      default:
        return `Word count: ${text.trim().split(/\s+/).filter(Boolean).length}`;
    }
  },
};
