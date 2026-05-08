import { greetingRule } from "./greeting";
import { toneRule } from "./tone";
import { languageRule } from "./language";
import { agentRule } from "./agent";
import { contextRule } from "./context";
import { thinkingRule } from "./thinking";
import { expertModeRule } from "./expert-mode";
import { fastModeRule } from "./fast-mode";
import { safetyRule } from "./safety";

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
  safetyRule,      // priority 200 — absolute
  greetingRule,    // priority 100 — first message
  languageRule,    // priority 90  — always
  thinkingRule,    // priority 80  — when thinking on
  expertModeRule,  // priority 50  — expert mode
  fastModeRule,    // priority 50  — fast mode
  contextRule,     // priority 30  — after a few messages
  agentRule,       // priority 20  — always
  toneRule,        // priority 10  — always
];

/**
 * Compile applicable rules into a single instruction block.
 * Rules are sorted by priority (highest first = most authoritative).
 * Returns both the compiled string and the list of applied rule IDs for the activity log.
 */
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
