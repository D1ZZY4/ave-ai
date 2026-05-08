import type { AgentMode } from "../types";
import { getOllamaTools } from "../tools/index";
import type { OllamaTool } from "./ollama";

/**
 * Diagram 19 — Mode Transition: Reaktif rebuild prompt schema saat mode berubah.
 *
 * Fast  → SwitchExpert → RebuildExpert: Susun ulang prompt + tools schema
 * Expert → SwitchFast  → RebuildFast:   Hapus tools schema
 *
 * Dipanggil segera saat mode berubah (bukan lazy saat sendMessage).
 */

export interface ModeTransitionResult {
  mode: AgentMode;
  toolSchemas: OllamaTool[];
  promptAddendum: string;
  allowTools: boolean;
}

const FAST_ADDENDUM = `[MODE: FAST] No tools. Respond directly and concisely.`;
const EXPERT_ADDENDUM = `[MODE: EXPERT] ReAct loop active. Use Thought/Action/Observation format.`;

export function buildModeContext(mode: AgentMode, enableTools: boolean): ModeTransitionResult {
  if (mode === "fast") {
    return {
      mode: "fast",
      toolSchemas: [],
      promptAddendum: FAST_ADDENDUM,
      allowTools: false,
    };
  }
  return {
    mode: "expert",
    toolSchemas: enableTools ? getOllamaTools() : [],
    promptAddendum: EXPERT_ADDENDUM,
    allowTools: enableTools,
  };
}

type ModeChangeListener = (result: ModeTransitionResult) => void;

class ModeTransitionManager {
  private currentMode: AgentMode = "fast";
  private enableTools = true;
  private listeners: ModeChangeListener[] = [];
  private currentContext: ModeTransitionResult;

  constructor() {
    this.currentContext = buildModeContext("fast", true);
  }

  subscribe(fn: ModeChangeListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  /**
   * Called when user dispatches SET_MODE.
   * Immediately rebuilds context and notifies all subscribers.
   */
  transition(newMode: AgentMode, enableTools: boolean): ModeTransitionResult {
    if (newMode === this.currentMode && enableTools === this.enableTools) {
      return this.currentContext;
    }
    this.currentMode = newMode;
    this.enableTools = enableTools;
    this.currentContext = buildModeContext(newMode, enableTools);
    for (const fn of this.listeners) {
      fn(this.currentContext);
    }
    return this.currentContext;
  }

  getContext(): ModeTransitionResult {
    return this.currentContext;
  }
}

export const modeTransitionManager = new ModeTransitionManager();
