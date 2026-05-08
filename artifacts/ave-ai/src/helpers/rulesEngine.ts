import type { RuleResult, ApprovalResult, AgentMode, RulePriority } from "../types";
import { evaluateInputSafety, evaluateOutputSafety } from "./safety";
import { evaluateGlobalRules, type GlobalRuleInput } from "../rules/global";
import { evaluateFastRules, fastRulesMeta } from "../rules/fast";
import { evaluateExpertRules } from "../rules/expert";
import { getToolRule } from "../rules/tools";
import { checkRateLimit } from "./rateLimit";

/**
 * Diagram 5 — Rules Engine: Alur Evaluasi
 *
 * Setiap evaluasi dikumpulkan dalam typed array, diurutkan priority:
 *   Safety (3) > Global (2) > Mode (1) > Target (0)
 * Evaluasi berurutan, short-circuit pada deny pertama.
 */

interface RuleEval {
  priority: RulePriority;
  order: number;
  evaluate: () => RuleResult;
}

const PRIORITY_ORDER: Record<RulePriority, number> = {
  safety: 3,
  global: 2,
  mode: 1,
  target: 0,
};

function runEvalChain(evals: RuleEval[]): ApprovalResult {
  const sorted = [...evals].sort((a, b) => b.order - a.order);

  let modifyResult: ApprovalResult | null = null;

  for (const ev of sorted) {
    const result = ev.evaluate();
    if (result.decision === "deny") {
      return { allowed: false, reasonCode: result.reasonCode, reason: result.reason };
    }
    if (result.decision === "modify" && !modifyResult) {
      modifyResult = { allowed: true, modified: result.modifiedValue, reasonCode: result.reasonCode };
    }
  }

  return modifyResult ?? { allowed: true };
}

export function evaluateInput(
  input: string,
  mode: AgentMode,
  globalCtx: GlobalRuleInput
): ApprovalResult {
  const evals: RuleEval[] = [
    {
      priority: "safety",
      order: PRIORITY_ORDER.safety,
      evaluate: () => evaluateInputSafety(input),
    },
    {
      priority: "global",
      order: PRIORITY_ORDER.global,
      evaluate: () => evaluateGlobalRules(globalCtx),
    },
    {
      priority: "mode",
      order: PRIORITY_ORDER.mode,
      evaluate: () => {
        if (mode === "fast") return { decision: "allow" };
        return { decision: "allow" };
      },
    },
  ];

  return runEvalChain(evals);
}

export function preApproveTool(
  toolName: string,
  params: Record<string, unknown>,
  mode: AgentMode,
  thought: string,
  globalCtx: GlobalRuleInput
): ApprovalResult {
  const toolRule = getToolRule(toolName);

  const evals: RuleEval[] = [
    {
      priority: "safety",
      order: PRIORITY_ORDER.safety,
      evaluate: () => evaluateInputSafety(JSON.stringify(params)),
    },
    {
      priority: "global",
      order: PRIORITY_ORDER.global,
      evaluate: () => evaluateGlobalRules(globalCtx),
    },
    {
      priority: "mode",
      order: PRIORITY_ORDER.mode,
      evaluate: () =>
        mode === "fast"
          ? evaluateFastRules(true)
          : evaluateExpertRules(thought.trim().length > 0, true),
    },
    {
      priority: "target",
      order: PRIORITY_ORDER.target,
      evaluate: () => {
        if (!checkRateLimit(toolName)) {
          return { decision: "deny", reason: `Rate limit reached for ${toolName}`, reasonCode: "RATE_LIMIT" };
        }
        if (toolRule.allowedParams) {
          const unknownKeys = Object.keys(params).filter(
            (k) => !toolRule.allowedParams!.includes(k)
          );
          if (unknownKeys.length > 0) {
            return { decision: "deny", reason: `Disallowed params: ${unknownKeys.join(", ")}`, reasonCode: "PARAM_DISALLOWED" };
          }
        }
        return { decision: "allow" };
      },
    },
  ];

  return runEvalChain(evals);
}

export function postCheckResult(
  toolName: string,
  result: string,
  _params: Record<string, unknown>
): ApprovalResult {
  const evals: RuleEval[] = [
    {
      priority: "safety",
      order: PRIORITY_ORDER.safety,
      evaluate: () => evaluateOutputSafety(result),
    },
    {
      priority: "target",
      order: PRIORITY_ORDER.target,
      evaluate: () => {
        if (result.length > 10000) {
          return { decision: "modify", modifiedValue: result.slice(0, 10000) + "...[truncated]", reasonCode: "RESULT_TOO_LONG" };
        }
        return { decision: "allow" };
      },
    },
  ];

  void toolName;
  return runEvalChain(evals);
}

export function evaluateOutput(output: string): ApprovalResult {
  const evals: RuleEval[] = [
    {
      priority: "safety",
      order: PRIORITY_ORDER.safety,
      evaluate: () => evaluateOutputSafety(output),
    },
    {
      priority: "target",
      order: PRIORITY_ORDER.target,
      evaluate: () => {
        if (output.length > fastRulesMeta.maxResponseLength * 10) {
          return { decision: "allow" };
        }
        return { decision: "allow" };
      },
    },
  ];

  return runEvalChain(evals);
}
