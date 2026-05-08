import type { Rule } from "./index";

/**
 * THINKING RULE
 * Tags: ["thinking", "reasoning", "expert"]
 *
 * Applied when thinking mode is enabled.
 * Instructs the model how to use its reasoning capacity.
 */
export const thinkingRule: Rule = {
  id: "thinking",
  tags: ["thinking", "reasoning"],
  priority: 80,
  condition: (ctx) => ctx.enableThinking,
  instruction: `Reasoning instructions:
- Before responding, think through the problem fully in your <think> block.
- In your thinking: identify assumptions, consider edge cases, evaluate multiple approaches.
- Challenge your first instinct — ask yourself if there's a better way.
- Your thinking is for working through the problem. Your response is the conclusion.
- Keep the response itself clean and direct — the reasoning happened in thinking.`,
};
