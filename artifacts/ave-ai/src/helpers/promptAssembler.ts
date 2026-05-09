import type { AgentMode, OrchestratorOptions } from "../types";
import { getPersona } from "../personas/index";
import { getSkill } from "../skills/index";
import { compileRules } from "../rules/index";
import { FAST_SYSTEM_ADDENDUM } from "../rules/fast";
import { EXPERT_SYSTEM_ADDENDUM } from "../rules/expert";
import { getOllamaTools } from "../tools/index";
import type { OllamaMessage, OllamaTool } from "./ollama";

const REACT_EXAMPLES = `
Example Expert Turn:
Thought: The user wants to know the current time in Jakarta.
Action: current_time
Action Input: {"timezone": "Asia/Jakarta"}
Observation: 2024-01-15 10:30:00 WIB (UTC+7)
Thought: I now have the time. I can answer directly.
Final Answer: The current time in Jakarta is 10:30 AM WIB.
`.trim();

export interface AssembledRequest {
  systemPrompt: string;
  ollamaMessages: OllamaMessage[];
  tools: OllamaTool[] | undefined;
}

export function assembleFastPrompt(
  opts: OrchestratorOptions,
  chatHistory: OllamaMessage[],
  userInput: string,
  memoryBlock: string
): AssembledRequest {
  const persona = getPersona(opts.personaId);
  const skill = getSkill(opts.skillId);
  const { rulesPrompt } = compileRules({
    isFirstMessage: chatHistory.length === 0,
    messageCount: chatHistory.length,
    skill: opts.skillId,
    persona: opts.personaId,
    mode: "fast",
    enableThinking: opts.enableThinking,
    userMessage: userInput,
  });

  const safetyBlock = persona.safetyRules?.length
    ? `[PERSONA SAFETY RULES]\n${persona.safetyRules.map((r) => `- ${r}`).join("\n")}`
    : "";

  const personaPrompt = opts.systemPromptOverride ?? persona.systemPrompt;

  // Diagram 40: Qwen3 auto-detect → add special reasoning instruction
  const qwen3Block = opts.model?.toLowerCase().includes("qwen")
    ? `[MODEL-SPECIFIC: QWEN3]\nYou are a thinking-capable model. Before your final answer, reason step by step. You may use Thought/Action/Observation format if needed.`
    : "";

  const systemPrompt = [
    `[PERSONA: ${persona.name.toUpperCase()}]\n${personaPrompt}`,
    `[SKILL: ${skill.name.toUpperCase()}]\n${skill.systemPrompt}`,
    `[RULES]\n${rulesPrompt}`,
    safetyBlock,
    qwen3Block,
    FAST_SYSTEM_ADDENDUM,
    memoryBlock ? `[MEMORY]\n${memoryBlock}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const userMsg: OllamaMessage = { role: "user", content: userInput };
  if (opts.images && opts.images.length > 0) userMsg.images = opts.images;

  return {
    systemPrompt,
    ollamaMessages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      userMsg,
    ],
    tools: undefined,
  };
}

export function assembleExpertPrompt(
  opts: OrchestratorOptions,
  chatHistory: OllamaMessage[],
  userInput: string,
  memoryBlock: string,
  toolSchemas: OllamaTool[]
): AssembledRequest {
  const persona = getPersona(opts.personaId);
  const skill = getSkill(opts.skillId);
  const { rulesPrompt } = compileRules({
    isFirstMessage: chatHistory.length === 0,
    messageCount: chatHistory.length,
    skill: opts.skillId,
    persona: opts.personaId,
    mode: "expert",
    enableThinking: opts.enableThinking,
    userMessage: userInput,
  });

  const toolList = toolSchemas
    .map((t) => `- ${t.function.name}: ${t.function.description}`)
    .join("\n");

  const safetyBlock = persona.safetyRules?.length
    ? `[PERSONA SAFETY RULES]\n${persona.safetyRules.map((r) => `- ${r}`).join("\n")}`
    : "";

  const expertAddendum = persona.expertPrompt
    ? `[EXPERT MODE GUIDANCE — ${persona.name.toUpperCase()}]\n${persona.expertPrompt}`
    : "";

  const personaPrompt = opts.systemPromptOverride ?? persona.systemPrompt;

  // Diagram 40: Qwen3 auto-detect → add special reasoning instruction
  const qwen3Block = opts.model?.toLowerCase().includes("qwen")
    ? `[MODEL-SPECIFIC: QWEN3]\nYou are a thinking-capable model. Use Thought/Action/Observation format for every step. Reason explicitly before choosing an action.`
    : "";

  const systemPrompt = [
    `[PERSONA: ${persona.name.toUpperCase()}]\n${personaPrompt}`,
    `[SKILL: ${skill.name.toUpperCase()}]\n${skill.systemPrompt}`,
    `[RULES]\n${rulesPrompt}`,
    safetyBlock,
    qwen3Block,
    expertAddendum,
    toolList ? `[AVAILABLE TOOLS]\n${toolList}` : "",
    EXPERT_SYSTEM_ADDENDUM,
    `[FEW-SHOT EXAMPLES]\n${REACT_EXAMPLES}`,
    memoryBlock ? `[MEMORY]\n${memoryBlock}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const userMsg: OllamaMessage = { role: "user", content: userInput };
  if (opts.images && opts.images.length > 0) userMsg.images = opts.images;

  return {
    systemPrompt,
    ollamaMessages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      userMsg,
    ],
    tools: toolSchemas.length > 0 ? toolSchemas : undefined,
  };
}

export function buildToolSchemas(mode: AgentMode, enableTools: boolean): OllamaTool[] {
  if (mode === "fast" || !enableTools) return [];
  return getOllamaTools();
}
