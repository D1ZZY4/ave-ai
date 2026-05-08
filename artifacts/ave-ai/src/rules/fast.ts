import type { RuleResult } from "../types";
import { FAST_RULE_SET } from "../types";

/**
 * Diagram 7 — fastRules typed struct (exported sesuai spec)
 */
export const fastRules = FAST_RULE_SET;

export const fastRulesMeta = fastRules;

export function evaluateFastRules(toolRequested: boolean): RuleResult {
  if (toolRequested) {
    return { decision: "deny", reason: "Tools not allowed in Fast mode", reasonCode: "FAST_NO_TOOLS" };
  }
  return { decision: "allow" };
}

export const FAST_SYSTEM_ADDENDUM = `
[FAST MODE]
- Respond directly and concisely without tool calls.
- Do NOT use tools or multi-step reasoning.
- Aim for responses under ${FAST_RULE_SET.maxResponseLength} words unless the user explicitly asks for more.
- Prioritize speed and clarity.
`.trim();
