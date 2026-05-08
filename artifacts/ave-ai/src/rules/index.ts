import { greetingRule } from "./greeting";
import { toneRule } from "./tone";
import { languageRule } from "./language";
import { agentRule } from "./agent";
import { contextRule } from "./context";
import { thinkingRule } from "./thinking";
import { expertModeRule } from "./expert-mode";
import { fastModeRule } from "./fast-mode";
import { safetyRule } from "./safety";

export type { GlobalRuleInput } from "./global";
export type { ToolRule } from "./tools";
export { evaluateGlobalRules, globalRulesMeta } from "./global";
export { evaluateFastRules, fastRulesMeta, FAST_SYSTEM_ADDENDUM } from "./fast";
export { evaluateExpertRules, expertRulesMeta, EXPERT_SYSTEM_ADDENDUM } from "./expert";
export { toolRules, getToolRule } from "./tools";

export interface RuleContext {
  isFirstMessage: boolean;
  messageCount: number;
  skill: string;
  persona: string;
  mode: "fast" | "expert";
  enableThinking: boolean;
  userMessage: string;
}

export interface Rule {
  id: string;
  tags: string[];
  priority: number;
  condition?: (ctx: RuleContext) => boolean;
  instruction: string | ((ctx: RuleContext) => string);
}

export const ALL_RULES: Rule[] = [
  safetyRule,
  greetingRule,
  languageRule,
  thinkingRule,
  expertModeRule,
  fastModeRule,
  contextRule,
  agentRule,
  toneRule,
];

export function compileRules(ctx: RuleContext): {
  rulesPrompt: string;
  appliedRules: string[];
} {
  const applicable = ALL_RULES
    .filter((rule) => !rule.condition || rule.condition(ctx))
    .sort((a, b) => b.priority - a.priority);

  const appliedRules = applicable.map((r) => r.id);

  const rulesPrompt = applicable
    .map((rule) => {
      const instruction =
        typeof rule.instruction === "function"
          ? rule.instruction(ctx)
          : rule.instruction;
      return `[${rule.id.toUpperCase()}]\n${instruction}`;
    })
    .join("\n\n");

  return { rulesPrompt, appliedRules };
}

export {
  greetingRule, toneRule, languageRule, agentRule,
  contextRule, thinkingRule, expertModeRule, fastModeRule, safetyRule,
};
