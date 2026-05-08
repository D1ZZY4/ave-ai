import type { z } from "zod";

export type AgentMode = "fast" | "expert";
export type SessionStatus = "idle" | "active" | "compressing" | "terminated";
export type RuleDecision = "allow" | "modify" | "deny";
export type RulePriority = "safety" | "global" | "mode" | "target";

export interface ThinkingStep {
  stepNumber: number;
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: string;
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

export interface BaseError extends Error {
  code: string;
  recoverable: boolean;
}

export interface ToolError extends Error {
  code: "TOOL_ERROR";
  toolName: string;
  recoverable: true;
}

export interface LLMError extends Error {
  code: "LLM_ERROR";
  recoverable: true;
}

export interface RulesError extends Error {
  code: "RULES_ERROR";
  reasonCode: string;
  recoverable: true;
}

export interface TypedTool<TSchema extends z.ZodObject<z.ZodRawShape>> {
  id: string;
  name: string;
  description: string;
  schema: TSchema;
  rateLimit?: number;
  cacheTtl?: number;
  maxRetries?: number;
  fallbackTool?: string;
  handler: (params: z.infer<TSchema>) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  result: string;
  error?: string;
  cached?: boolean;
  retries?: number;
}

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

export const TOKEN_BUDGET_TOTAL = 65536;
export const TOKEN_BUDGET: MemoryBudget = {
  system: Math.floor(TOKEN_BUDGET_TOTAL * 0.15),
  fileContext: Math.floor(TOKEN_BUDGET_TOTAL * 0.35),
  history: Math.floor(TOKEN_BUDGET_TOTAL * 0.25),
  output: Math.floor(TOKEN_BUDGET_TOTAL * 0.25),
  total: TOKEN_BUDGET_TOTAL,
};

export const SLIDING_WINDOW_SIZE = 20;
export const MAX_ITERATIONS_FAST = 1;
export const MAX_ITERATIONS_EXPERT = 20;
export const MAX_TIME_MS = 120000;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
