import type { RuleResult, ApprovalResult, AgentMode } from "../types";
import { evaluateInputSafety, evaluateOutputSafety } from "./safety";
import { evaluateGlobalRules, type GlobalRuleInput } from "../rules/global";
import { evaluateFastRules } from "../rules/fast";
import { evaluateExpertRules } from "../rules/expert";
import { getToolRule } from "../rules/tools";
import { checkRateLimit } from "./rateLimit";

function toApproval(result: RuleResult): ApprovalResult {
  if (result.decision === "allow") return { allowed: true };
  if (result.decision === "modify") return { allowed: true, modified: result.modifiedValue, reasonCode: result.reasonCode };
  return { allowed: false, reasonCode: result.reasonCode, reason: result.reason };
}

export function evaluateInput(input: string, mode: AgentMode, globalCtx: GlobalRuleInput): ApprovalResult {
  const checks: RuleResult[] = [
    evaluateInputSafety(input),
    evaluateGlobalRules(globalCtx),
  ];

  for (const check of checks) {
    if (check.decision === "deny") return toApproval(check);
  }

  const modifyCheck = checks.find((c) => c.decision === "modify");
  if (modifyCheck) return toApproval(modifyCheck);

  return { allowed: true };
}

export function preApproveTool(
  toolName: string,
  params: Record<string, unknown>,
  mode: AgentMode,
  thought: string,
  globalCtx: GlobalRuleInput
): ApprovalResult {
  const globalCheck = evaluateGlobalRules(globalCtx);
  if (globalCheck.decision === "deny") return toApproval(globalCheck);

  const modeCheck = mode === "fast"
    ? evaluateFastRules(true)
    : evaluateExpertRules(thought.trim().length > 0, true);
  if (modeCheck.decision === "deny") return toApproval(modeCheck);

  const toolRule = getToolRule(toolName);

  if (!checkRateLimit(toolName)) {
    return { allowed: false, reasonCode: "RATE_LIMIT", reason: `Rate limit reached for ${toolName}` };
  }

  void params;
  void toolRule;

  return { allowed: true };
}

export function postCheckResult(
  toolName: string,
  result: string,
  _params: Record<string, unknown>
): ApprovalResult {
  const safetyCheck = evaluateOutputSafety(result);
  if (safetyCheck.decision === "deny") return toApproval(safetyCheck);
  if (safetyCheck.decision === "modify") return toApproval(safetyCheck);

  void toolName;

  return { allowed: true };
}

export function evaluateOutput(output: string): ApprovalResult {
  const safetyCheck = evaluateOutputSafety(output);
  return toApproval(safetyCheck);
}
