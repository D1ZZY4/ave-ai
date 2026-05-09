import type { Rule } from "./index";

/**
 * EXPERT MODE RULE
 * Tags: ["mode", "expert"]
 *
 * Deepens analysis when Expert mode is selected.
 */
export const expertModeRule: Rule = {
  id: "expert-mode",
  tags: ["mode", "expert"],
  priority: 50,
  condition: (ctx) => ctx.mode === "expert",
  instruction: `Expert mode is active:
- Go deep. Don't summarize when detail matters.
- Break down complex problems into components before solving.
- Consider trade-offs, second-order effects, and edge cases explicitly.
- If multiple valid approaches exist, compare them.
- Aim for thoroughness, not verbosity — every sentence should add value.`,
};
