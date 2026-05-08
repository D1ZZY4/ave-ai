import type { AgentMemory, LongTermFact, ThinkingStep } from "../types";
import { TOKEN_BUDGET, SLIDING_WINDOW_SIZE, LOW_CONFIDENCE_THRESHOLD } from "../types";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = Math.floor(maxTokens * 3.5);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

export function createMemory(): AgentMemory {
  return {
    taskState: "",
    fileContext: [],
    actionHistory: [],
    workingMemory: {},
    longTermMemory: [],
  };
}

export function updateMemory(
  memory: AgentMemory,
  step: ThinkingStep,
  newFacts?: LongTermFact[]
): AgentMemory {
  const updated = { ...memory };

  updated.actionHistory = [...memory.actionHistory, step];

  if (updated.actionHistory.length > SLIDING_WINDOW_SIZE) {
    const overflow = updated.actionHistory.slice(0, updated.actionHistory.length - SLIDING_WINDOW_SIZE);
    const summary = summarizeSteps(overflow);
    updated.summarizedHistory = memory.summarizedHistory
      ? `${memory.summarizedHistory}\n${summary}`
      : summary;
    updated.actionHistory = updated.actionHistory.slice(-SLIDING_WINDOW_SIZE);
  }

  if (newFacts) {
    updated.longTermMemory = [
      ...memory.longTermMemory.filter((f) => f.confidence >= LOW_CONFIDENCE_THRESHOLD),
      ...newFacts,
    ];
  }

  return updated;
}

export function pruneMemory(memory: AgentMemory): AgentMemory {
  return {
    ...memory,
    longTermMemory: memory.longTermMemory.filter((f) => f.confidence >= LOW_CONFIDENCE_THRESHOLD),
  };
}

function summarizeSteps(steps: ThinkingStep[]): string {
  return steps
    .map((s) => {
      let line = `[Step ${s.stepNumber}] ${s.thought}`;
      if (s.action) line += ` → ${s.action}`;
      if (s.observation) line += ` → ${s.observation.slice(0, 120)}`;
      return line;
    })
    .join("\n");
}

export interface AssembledPrompt {
  systemPart: string;
  historyPart: string;
  totalTokens: number;
}

export function assembleMemoryPrompt(memory: AgentMemory, systemBase: string): AssembledPrompt {
  const systemPart = truncateToTokens(systemBase, TOKEN_BUDGET.system);

  const historyLines: string[] = [];

  if (memory.summarizedHistory) {
    historyLines.push(`[SUMMARIZED HISTORY]\n${memory.summarizedHistory}`);
  }

  const factLines = memory.longTermMemory
    .filter((f) => f.confidence >= LOW_CONFIDENCE_THRESHOLD)
    .map((f) => `- ${f.key}: ${f.value} (confidence: ${f.confidence.toFixed(2)})`)
    .join("\n");

  if (factLines) historyLines.push(`[KNOWN FACTS]\n${factLines}`);

  const stepLines = memory.actionHistory.map((s) => {
    let line = `Thought: ${s.thought}`;
    if (s.action) line += `\nAction: ${s.action}`;
    if (s.actionInput) line += `\nAction Input: ${JSON.stringify(s.actionInput)}`;
    if (s.observation) line += `\nObservation: ${s.observation}`;
    return line;
  });

  if (stepLines.length) historyLines.push(`[RECENT STEPS]\n${stepLines.join("\n---\n")}`);

  const historyRaw = historyLines.join("\n\n");
  const historyPart = truncateToTokens(historyRaw, TOKEN_BUDGET.history);

  const totalTokens = estimateTokens(systemPart) + estimateTokens(historyPart);

  return { systemPart, historyPart, totalTokens };
}

export function setWorkingMemory(memory: AgentMemory, key: string, value: string): AgentMemory {
  return { ...memory, workingMemory: { ...memory.workingMemory, [key]: value } };
}

export function setTaskState(memory: AgentMemory, task: string): AgentMemory {
  return { ...memory, taskState: task };
}
