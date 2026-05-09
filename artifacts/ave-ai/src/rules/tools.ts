/**
 * Diagram 5, 14, 17: Tool-specific rules — parameter validation, rate limits, result citation.
 * Applied only when enableThinking is true (tool calls active).
 */
import type { Rule } from "./index";

export const toolRules: Rule[] = [
  {
    id: "tool-param-validation",
    tags: ["tools", "safety"],
    priority: 195,
    condition: (ctx) => ctx.enableThinking,
    instruction:
      "Before calling any tool, verify that the parameters match the expected types. Never pass null, undefined, or empty strings for required parameters.",
  },
  {
    id: "tool-rate-limit",
    tags: ["tools", "safety"],
    priority: 175,
    condition: (ctx) => ctx.enableThinking,
    instruction:
      "Maximum 5 tool calls per response turn. If you need more, prioritize the most critical ones and note what remains.",
  },
  {
    id: "tool-result-cite",
    tags: ["tools", "accuracy"],
    priority: 160,
    condition: (ctx) => ctx.enableThinking,
    instruction:
      "Always incorporate tool results into your final answer. Never ignore or silently discard a tool output.",
  },
  {
    id: "tool-error-recovery",
    tags: ["tools", "resilience"],
    priority: 150,
    condition: (ctx) => ctx.enableThinking,
    instruction:
      "If a tool call fails or returns an error, do not retry more than twice. Explain the failure in your final answer and suggest manual alternatives if applicable.",
  },
];
