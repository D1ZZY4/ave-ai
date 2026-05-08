import type { Rule } from "./index";

/**
 * CONTEXT RULE
 * Tags: ["context", "memory"]
 *
 * Instructs the AI to leverage conversation history intelligently.
 * Applied after the first few messages.
 */
export const contextRule: Rule = {
  id: "context",
  tags: ["context", "memory"],
  priority: 30,
  condition: (ctx) => ctx.messageCount > 2,
  instruction: `Context awareness:
- You have access to the full conversation history. Use it.
- Reference earlier decisions, code, or discussion naturally when relevant.
- If the user seems to be building on a previous idea, connect the dots for them.
- Track what has been tried and what hasn't — don't suggest the same thing twice.
- If there's a contradiction between the user's current request and something they said earlier, surface it.`,
};
