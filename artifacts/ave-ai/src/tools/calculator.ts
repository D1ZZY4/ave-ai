import { z } from "zod";
import type { FlowTool, ToolExecutionResult } from "../types";
import type { OllamaTool } from "../helpers/ollama";

const schema = z.object({
  expression: z.string().min(1).describe("Math expression to evaluate, e.g. '(12 * 3) / 4 + 7'"),
});

export const calculatorFlowTool: FlowTool = {
  id: "calculator",
  name: "Calculator",
  description: "Evaluate a mathematical expression and return the numeric result",
  schema,
  rateLimit: 60,
  cacheTtlMs: 300000,
  maxRetries: 1,
  async handler(args): Promise<ToolExecutionResult> {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      return { success: false, result: `Invalid params: ${parsed.error.message}` };
    }
    const expr = parsed.data.expression;
    try {
      const safe = expr.replace(/[^0-9+\-*/().,% \t]/g, "");
      const result = Function(`"use strict"; return (${safe})`)();
      return { success: true, result: `${expr} = ${result}` };
    } catch {
      return { success: false, result: `Unable to evaluate: ${expr}` };
    }
  },
};

export const calculatorTool = {
  id: "calculator",
  name: "Calculator",
  description: "Perform mathematical calculations",
  ollamaTool: {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate a mathematical expression and return the numeric result",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "The math expression to evaluate" },
        },
        required: ["expression"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const result = await calculatorFlowTool.handler(args);
    return result.result;
  },
};
