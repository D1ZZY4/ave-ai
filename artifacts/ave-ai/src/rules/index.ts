/**
 * Diagram 5: Rules Engine — 4-layer evaluation with Allow / Modify / Deny decisions.
 * Layers: Safety (200+) → Global (180-190) → Mode (100-160) → Tools (150-195)
 */
import { greetingRule } from "./greeting";
import { toneRule } from "./tone";
import { languageRule } from "./language";
import { agentRule } from "./agent";
import { contextRule } from "./context";
import { thinkingRule } from "./thinking";
import { expertModeRule } from "./expert-mode";
import { fastModeRule } from "./fast-mode";
import { safetyRule } from "./safety";
import { globalRules } from "./global";
import { toolRules } from "./tools";
import { detectPii } from "../helpers/piiDetector";
import { detectInjection } from "../helpers/injectionDetector";
import { analyzeToxicity } from "../helpers/toxicityAnalyzer";

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

export type RuleDecision = "Allow" | "Modify" | "Deny";

export interface RuleResult {
  decision: RuleDecision;
  reason?: string;
  modifiedContent?: string;
}

const CORE_RULES: Rule[] = [
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

export const ALL_RULES: Rule[] = [
  ...CORE_RULES,
  ...globalRules,
  ...toolRules,
];

/**
 * Diagram 5: 4-Layer Rules Engine with sequential evaluation.
 * Layer 1 — Safety (priority 200+): PII, injection, toxicity. Denial short-circuits.
 * Layer 2 — Global (180-190): iteration limits, accuracy, format.
 * Layer 3 — Mode (100-175): fast/expert-specific constraints.
 * Layer 4 — Tools (150-195): parameter validation, rate limits, citation.
 */
export class RulesEngine {
  private ctx: RuleContext;

  constructor(ctx: RuleContext) {
    this.ctx = ctx;
  }

  /**
   * Diagram 18, 28: Safety filter cascade — validate input before sending to LLM.
   * Returns Deny immediately on critical violations.
   */
  validateInput(input: string): RuleResult {
    const pii = detectPii(input);
    if (pii.highSeverityTypes.length > 0) {
      return {
        decision: "Deny",
        reason: `Your message contains sensitive personal information (${pii.highSeverityTypes.join(", ")}). Please remove it before sending.`,
      };
    }

    const injection = detectInjection(input);
    if (injection.hasInjection && injection.confidence >= 0.85) {
      return {
        decision: "Deny",
        reason: "Prompt injection pattern detected. Please rephrase your request.",
      };
    }

    const toxicity = analyzeToxicity(input);
    if (toxicity.isToxic) {
      return {
        decision: "Deny",
        reason: "Your message was flagged for potentially harmful content and cannot be processed.",
      };
    }

    if (pii.hasPii && pii.types.includes("email")) {
      return {
        decision: "Modify",
        reason: "Email address detected in input — processing with redacted version.",
        modifiedContent: pii.redacted,
      };
    }

    return { decision: "Allow" };
  }

  /**
   * Diagram 17: Validate tool call parameters before execution.
   */
  validateToolCall(toolName: string, params: Record<string, unknown>): RuleResult {
    const hasNullValues = Object.values(params).some(
      (v) => v === null || v === undefined || v === ""
    );
    if (hasNullValues) {
      return {
        decision: "Deny",
        reason: `Tool "${toolName}" received null/undefined/empty parameters. The model should provide valid values.`,
      };
    }
    return { decision: "Allow" };
  }

  /**
   * Diagram 2, 18: Validate LLM output before showing to user.
   * Modifies if PII found; denies if highly toxic.
   */
  validateOutput(output: string): RuleResult {
    const pii = detectPii(output);
    if (pii.highSeverityTypes.length > 0) {
      return {
        decision: "Modify",
        reason: `Output contained PII (${pii.highSeverityTypes.join(", ")}) — automatically redacted.`,
        modifiedContent: pii.redacted,
      };
    }

    const toxicity = analyzeToxicity(output);
    if (toxicity.score >= 0.8) {
      return {
        decision: "Deny",
        reason: "Response was blocked due to potentially harmful content.",
      };
    }

    return { decision: "Allow" };
  }
}

/**
 * Compile all applicable rules into a structured prompt + list of active rule IDs.
 * Sorted by priority descending (highest first = most important).
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
