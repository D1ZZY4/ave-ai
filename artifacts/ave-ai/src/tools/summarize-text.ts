import { z } from "zod";
import type { FlowTool, ToolExecutionResult } from "../types";
import type { OllamaTool } from "../helpers/ollama";

const schema = z.object({
  text: z.string().min(1).describe("The text to summarize"),
  maxSentences: z.number().int().min(1).max(20).optional().default(5),
  style: z.enum(["bullet", "paragraph", "tldr"]).optional().default("paragraph"),
});

export const summarizeTextFlowTool: FlowTool = {
  id: "summarize_text",
  name: "Summarize Text",
  description: "Create a concise summary of a given text",
  schema,
  rateLimit: 20,
  cacheTtlMs: 120000,
  maxRetries: 2,
  async handler(args): Promise<ToolExecutionResult> {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      return { success: false, result: `Invalid params: ${parsed.error.message}` };
    }
    const { text, maxSentences, style } = parsed.data;
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    const picked = sentences.slice(0, maxSentences).map((s) => s.trim());

    let result: string;
    if (style === "bullet") {
      result = picked.map((s) => `• ${s}`).join("\n");
    } else if (style === "tldr") {
      result = `TL;DR: ${picked.slice(0, 2).join(" ")}`;
    } else {
      result = picked.join(" ");
    }

    return { success: true, result: `Summary:\n${result}` };
  },
};

export const summarizeTextTool = {
  id: "summarize_text",
  name: "Summarize Text",
  description: "Create a concise summary of text",
  ollamaTool: {
    type: "function",
    function: {
      name: "summarize_text",
      description: "Summarize a block of text into a concise form",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to summarize" },
          maxSentences: { type: "number", description: "Max sentences in summary (default 5)" },
          style: { type: "string", description: "Output style: 'bullet', 'paragraph', or 'tldr'" },
        },
        required: ["text"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const r = await summarizeTextFlowTool.handler(args);
    return r.result;
  },
};
