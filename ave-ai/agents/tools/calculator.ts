import type { OllamaTool } from "../helpers/ollama";

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
    const expr = String(args.expression ?? "");
    if (!expr) return "No expression provided.";
    try {
      const safe = expr.replace(/[^0-9+\-*/().,% \t]/g, "");
      const result = Function(`"use strict"; return (${safe})`)();
      return `${expr} = ${result}`;
    } catch {
      return `Unable to evaluate: ${expr}`;
    }
  },
};
