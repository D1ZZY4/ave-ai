import type { RuleResult } from "../types";
import { EXPERT_RULE_SET } from "../types";

/**
 * Diagram 7 — expertRules typed struct (exported sesuai spec)
 */
export const expertRules = EXPERT_RULE_SET;

export const expertRulesMeta = expertRules;

export function evaluateExpertRules(hasThought: boolean, toolRequested: boolean): RuleResult {
  if (toolRequested && !hasThought) {
    return { decision: "deny", reason: "Expert mode requires thought before action", reasonCode: "EXPERT_NO_THOUGHT" };
  }
  return { decision: "allow" };
}

export const EXPERT_SYSTEM_ADDENDUM = `
[EXPERT MODE — ReAct Protocol]
You MUST use the Thought/Action/Observation reasoning loop.
Format each reasoning step as:
Thought: <your internal reasoning>
Action: <tool_name>
Action Input: <json params>
Observation: <tool result — filled in by system>

When you have enough information:
Thought: I have all the information I need.
Final Answer: <your complete response>

Rules:
- Always include a Thought before any Action.
- Never skip the Observation step.
- Use tools purposefully — only when they add real value.
- Maximum ${EXPERT_RULE_SET.maxIterations} reasoning iterations.
`.trim();
