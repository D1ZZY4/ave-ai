import type { z } from "zod";

export type AgentMode = "fast" | "expert";
export type SessionStatus = "idle" | "active" | "compressing" | "terminated" | "archived";
export type RuleDecision = "allow" | "modify" | "deny";
export type RulePriority = "safety" | "global" | "mode" | "target";
export type ExecType = "tool" | "skill";

// ─── Thinking & Session ─────────────────────────────────────────────────────

export interface ThinkingStep {
  stepNumber: number;
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: string;
  execType?: ExecType;
  timestamp: number;
}

export interface SessionState {
  id: string;
  mode: AgentMode;
  personaId: string;
  status: SessionStatus;
  thinkingSteps: ThinkingStep[];
  iterationCount: number;
  startedAt: number;
  tokenCount: number;
  abortController: AbortController | null;
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export interface RuleResult {
  decision: RuleDecision;
  reason?: string;
  reasonCode?: string;
  modifiedValue?: string;
}

export interface ApprovalResult {
  allowed: boolean;
  modified?: string;
  reasonCode?: string;
  reason?: string;
}

export interface RuleSet {
  global: {
    maxIterations: number;
    maxTimeMs: number;
    tokenBudget: number;
  };
  mode: {
    allowTools: boolean;
    requireThoughtTag: boolean;
    maxResponseLength: number;
    maxIterations: number;
  };
  tools: Record<string, {
    rateLimit: number;
    cacheTtlMs: number;
    maxRetries: number;
    fallback?: string;
  }>;
  safety: {
    toxicityThreshold: number;
    detectPII: boolean;
    detectInjection: boolean;
  };
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class BaseError extends Error {
  code: string;
  recoverable: boolean;
  constructor(message: string, code: string, recoverable = true) {
    super(message);
    this.code = code;
    this.recoverable = recoverable;
    this.name = "BaseError";
  }
}

export class ToolError extends BaseError {
  toolName: string;
  constructor(message: string, toolName: string) {
    super(message, "TOOL_ERROR", true);
    this.toolName = toolName;
    this.name = "ToolError";
  }
}

export class LLMError extends BaseError {
  constructor(message: string) {
    super(message, "LLM_ERROR", true);
    this.name = "LLMError";
  }
}

export class RulesError extends BaseError {
  reasonCode: string;
  constructor(message: string, reasonCode: string) {
    super(message, "RULES_ERROR", true);
    this.reasonCode = reasonCode;
    this.name = "RulesError";
  }
}

// ─── Tool & Skill ─────────────────────────────────────────────────────────────

export interface ToolExecutionResult {
  success: boolean;
  result: string;
  error?: string;
  cached?: boolean;
  retries?: number;
}

export interface FlowTool {
  id: string;
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  rateLimit: number;
  cacheTtlMs: number;
  maxRetries: number;
  fallbackTool?: string;
  handler: (params: Record<string, unknown>) => Promise<ToolExecutionResult>;
}

export interface SkillStep {
  type: ExecType;
  id: string;
  label?: string;
}

export interface FlowSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: SkillStep[];
  execute: (
    input: string,
    toolRegistry: Map<string, FlowTool>,
    skillRegistry: Map<string, FlowSkill>
  ) => Promise<string>;
}

// ─── Persona ────────────────────────────────────────────────────────────────

export interface FlowPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  expertPrompt?: string;
  safetyRules?: string[];
}

// ─── Memory ─────────────────────────────────────────────────────────────────

export interface MemoryBudget {
  system: number;
  fileContext: number;
  history: number;
  output: number;
  total: number;
}

export interface LongTermFact {
  key: string;
  value: string;
  confidence: number;
  addedAt: number;
}

export interface AgentMemory {
  taskState: string;
  fileContext: string[];
  actionHistory: ThinkingStep[];
  workingMemory: Record<string, string>;
  longTermMemory: LongTermFact[];
  summarizedHistory?: string;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface PromptAssembly {
  system: string;
  rules: string;
  tools: string;
  format: string;
  examples: string;
  final: string;
}

export interface OrchestratorOptions {
  mode: AgentMode;
  personaId: string;
  skillId: string;
  model: string;
  baseUrl: string;
  enableThinking: boolean;
  enableTools: boolean;
  signal?: AbortSignal;
}

export interface OrchestratorResult {
  finalAnswer: string;
  thinkingSteps: ThinkingStep[];
  iterationCount: number;
  tokenCount: number;
  denied?: boolean;
  denialReason?: string;
}

// ─── Offline Queue ────────────────────────────────────────────────────────────

export interface OfflineQueueItem {
  id: string;
  userContent: string;
  sessionId: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TOKEN_BUDGET_TOTAL = 65536;
export const TOKEN_BUDGET: MemoryBudget = {
  system: Math.floor(TOKEN_BUDGET_TOTAL * 0.15),       // ~9830
  fileContext: Math.floor(TOKEN_BUDGET_TOTAL * 0.35),   // ~22937
  history: Math.floor(TOKEN_BUDGET_TOTAL * 0.25),       // ~16384
  output: Math.floor(TOKEN_BUDGET_TOTAL * 0.25),        // ~16384
  total: TOKEN_BUDGET_TOTAL,
};

export const SLIDING_WINDOW_SIZE = 20;
export const MAX_ITERATIONS_FAST = 1;
export const MAX_ITERATIONS_EXPERT = 20;
export const MAX_TIME_MS = 120000;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
export const COMPRESS_THRESHOLD = Math.floor(TOKEN_BUDGET_TOTAL * 0.7);

export const GLOBAL_RULE_SET: RuleSet["global"] = {
  maxIterations: MAX_ITERATIONS_EXPERT,
  maxTimeMs: MAX_TIME_MS,
  tokenBudget: TOKEN_BUDGET_TOTAL,
};

export const FAST_RULE_SET: RuleSet["mode"] = {
  allowTools: false,
  requireThoughtTag: false,
  maxResponseLength: 500,
  maxIterations: MAX_ITERATIONS_FAST,
};

export const EXPERT_RULE_SET: RuleSet["mode"] = {
  allowTools: true,
  requireThoughtTag: true,
  maxResponseLength: 4096,
  maxIterations: MAX_ITERATIONS_EXPERT,
};

export const SAFETY_RULE_SET: RuleSet["safety"] = {
  toxicityThreshold: 0.8,
  detectPII: true,
  detectInjection: true,
};

// Re-export SafetyRuleSet type alias for Diagram 7
export type SafetyRuleSet = RuleSet["safety"];
