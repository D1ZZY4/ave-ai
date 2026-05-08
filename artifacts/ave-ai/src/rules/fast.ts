import type { RuleResult } from "../types";

export const fastRulesMeta = {
  allowTools: false,
  maxResponseLength: 500,
  maxIterations: 1,
};

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
- Aim for responses under 500 words unless the user explicitly asks for more.
- Prioritize speed and clarity.
`.trim();
