import type { RuleResult } from "../types";
import { MAX_ITERATIONS_EXPERT, MAX_TIME_MS, TOKEN_BUDGET_TOTAL, GLOBAL_RULE_SET } from "../types";

export interface GlobalRuleInput {
  iterationCount: number;
  elapsedMs: number;
  estimatedTokens: number;
}

/**
 * Diagram 7 — globalRules typed struct (exported sesuai spec)
 */
export const globalRules = GLOBAL_RULE_SET;

export function evaluateGlobalRules(input: GlobalRuleInput): RuleResult {
  if (input.iterationCount >= MAX_ITERATIONS_EXPERT) {
    return { decision: "deny", reason: `Max iterations reached (${MAX_ITERATIONS_EXPERT})`, reasonCode: "MAX_ITERATIONS" };
  }
  if (input.elapsedMs >= MAX_TIME_MS) {
    return { decision: "deny", reason: "Session timeout (120s)", reasonCode: "TIMEOUT" };
  }
  if (input.estimatedTokens >= TOKEN_BUDGET_TOTAL * 0.95) {
    return { decision: "deny", reason: "Token budget exhausted", reasonCode: "TOKEN_BUDGET_EXCEEDED" };
  }
  return { decision: "allow" };
}

export const globalRulesMeta = globalRules;
