import { z } from "zod";
import type { FlowTool, ToolExecutionResult } from "../types";
import type { OllamaTool } from "../helpers/ollama";

const schema = z.object({
  path: z.string().min(1).describe("File path to read, e.g. 'docs/README.md'"),
  maxLines: z.number().int().min(1).max(500).optional().default(100),
});

const VIRTUAL_FS: Record<string, string> = {
  "docs/README.md": "# Ave AI\nAn intelligent assistant powered by Ollama LLM.\n\n## Features\n- Fast mode for quick answers\n- Expert mode with ReAct reasoning\n- Tools: calculator, current time, web search\n",
  "docs/architecture.md": "# Architecture\n- React TypeScript frontend\n- Ollama LLM backend\n- Zustand state management\n- ReAct reasoning loop\n",
};

export const readFileFlowTool: FlowTool = {
  id: "read_file",
  name: "Read File",
  description: "Read the contents of a file from the virtual file system",
  schema,
  rateLimit: 30,
  cacheTtlMs: 30000,
  maxRetries: 1,
  async handler(args): Promise<ToolExecutionResult> {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      return { success: false, result: `Invalid params: ${parsed.error.message}` };
    }
    const { path, maxLines } = parsed.data;
    const content = VIRTUAL_FS[path];
    if (!content) {
      const available = Object.keys(VIRTUAL_FS).join(", ");
      return {
        success: false,
        result: `File not found: "${path}". Available files: ${available}`,
      };
    }
    const lines = content.split("\n").slice(0, maxLines).join("\n");
    return { success: true, result: `[${path}]\n${lines}` };
  },
};

export const readFileTool = {
  id: "read_file",
  name: "Read File",
  description: "Read contents of a file",
  ollamaTool: {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file by its path",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to read" },
          maxLines: { type: "number", description: "Maximum lines to return (default 100)" },
        },
        required: ["path"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const r = await readFileFlowTool.handler(args);
    return r.result;
  },
};
