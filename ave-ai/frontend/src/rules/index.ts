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

const safetyRule: Rule = {
  id: "safety",
  tags: ["safety"],
  priority: 250,
  instruction: "Never assist with creating malware, weapons, or illegal activities. Always protect user privacy. Do not generate content that could cause harm.",
};

const greetingRule: Rule = {
  id: "greeting",
  tags: ["greeting"],
  priority: 200,
  condition: (ctx) => ctx.isFirstMessage,
  instruction: "Start the conversation with a warm, brief greeting. Introduce yourself as Ave AI. Ask how you can help.",
};

const languageRule: Rule = {
  id: "language",
  tags: ["language"],
  priority: 190,
  instruction: (ctx) => `Always respond in the same language the user writes in. Current message language detected from: "${ctx.userMessage.slice(0, 50)}".`,
};

const thinkingRule: Rule = {
  id: "thinking",
  tags: ["thinking"],
  priority: 175,
  condition: (ctx) => ctx.enableThinking,
  instruction: "When reasoning is enabled, think through the problem step-by-step before answering. Show your reasoning process clearly.",
};

const expertModeRule: Rule = {
  id: "expert-mode",
  tags: ["mode", "expert"],
  priority: 160,
  condition: (ctx) => ctx.mode === "expert",
  instruction: "You are in Expert mode. Use deep reasoning, tools when available, and be thorough. Prioritize accuracy and completeness over brevity. Show step-by-step reasoning.",
};

const fastModeRule: Rule = {
  id: "fast-mode",
  tags: ["mode", "fast"],
  priority: 155,
  condition: (ctx) => ctx.mode === "fast",
  instruction: "You are in Fast mode. Be concise and direct. Prioritize the clearest, most useful answer without unnecessary elaboration.",
};

const contextRule: Rule = {
  id: "context",
  tags: ["context"],
  priority: 150,
  instruction: (ctx) => `Conversation context: ${ctx.messageCount} messages exchanged. Skill: ${ctx.skill}. Persona: ${ctx.persona}. Maintain consistency with the established context.`,
};

const agentRule: Rule = {
  id: "agent",
  tags: ["agent"],
  priority: 140,
  instruction: "You are Ave AI. You have access to tools when enabled. If a tool call fails, explain the issue and provide a helpful alternative. Never claim capabilities you don't have.",
};

const toneRule: Rule = {
  id: "tone",
  tags: ["tone"],
  priority: 130,
  instruction: "Maintain a consistent, natural tone. Be helpful without being sycophantic. Be honest without being harsh. Adapt to the user's communication style.",
};

const globalRule: Rule = {
  id: "global",
  tags: ["global"],
  priority: 180,
  instruction: "Provide accurate, up-to-date information. When uncertain, say so clearly. Do not fabricate facts, citations, or statistics. Keep responses focused and actionable.",
};

const toolRule: Rule = {
  id: "tools",
  tags: ["tools"],
  priority: 150,
  condition: (ctx) => ctx.mode === "expert",
  instruction: "When using tools, validate parameters before calling. If a tool fails, try once more with corrected parameters before reporting the failure. Always report tool results clearly.",
};

const ALL_RULES: Rule[] = [
  safetyRule,
  greetingRule,
  languageRule,
  thinkingRule,
  expertModeRule,
  fastModeRule,
  contextRule,
  agentRule,
  toneRule,
  globalRule,
  toolRule,
];

export class RulesEngine {
  private ctx: RuleContext;

  constructor(ctx: RuleContext) {
    this.ctx = ctx;
  }

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
