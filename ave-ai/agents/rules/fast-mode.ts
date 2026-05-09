import type { Rule } from "./index";

/**
 * FAST MODE RULE
 * Tags: ["mode", "fast"]
 *
 * Optimizes for speed and clarity in Fast mode.
 */
export const fastModeRule: Rule = {
  id: "fast-mode",
  tags: ["mode", "fast"],
  priority: 50,
  condition: (ctx) => ctx.mode === "fast",
  instruction: `Fast mode is active:
- Lead with the answer, then explain if needed.
- Avoid lengthy preambles or conclusions.
- Use bullet points over paragraphs when listing items.
- If the answer is short, keep it short. Don't pad.`,
};
