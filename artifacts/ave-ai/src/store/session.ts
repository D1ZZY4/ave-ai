import { create } from "zustand";
import type { ThinkingStep, SessionStatus, AgentMode } from "../types";

interface SessionStore {
  sessionId: string | null;
  mode: AgentMode;
  personaId: string;
  status: SessionStatus;
  thinkingSteps: ThinkingStep[];
  iterationCount: number;
  tokenCount: number;
  startedAt: number | null;
  abortController: AbortController | null;
  finalAnswer: string | null;
  errorMessage: string | null;

  setSessionActive: (sessionId: string, mode: AgentMode, personaId: string) => void;
  setStatus: (status: SessionStatus) => void;
  appendThinkingStep: (step: ThinkingStep) => void;
  updateLastThinkingStep: (patch: Partial<ThinkingStep>) => void;
  setFinalAnswer: (answer: string) => void;
  setError: (msg: string) => void;
  setTokenCount: (count: number) => void;
  incrementIteration: () => void;
  startAbortController: () => AbortController;
  abortSession: () => void;
  clearSession: () => void;
  setMode: (mode: AgentMode) => void;
  setPersona: (personaId: string) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  mode: "fast",
  personaId: "ave-prime",
  status: "idle",
  thinkingSteps: [],
  iterationCount: 0,
  tokenCount: 0,
  startedAt: null,
  abortController: null,
  finalAnswer: null,
  errorMessage: null,

  setSessionActive: (sessionId, mode, personaId) =>
    set({
      sessionId,
      mode,
      personaId,
      status: "active",
      thinkingSteps: [],
      iterationCount: 0,
      tokenCount: 0,
      startedAt: Date.now(),
      finalAnswer: null,
      errorMessage: null,
    }),

  setStatus: (status) => set({ status }),

  appendThinkingStep: (step) =>
    set((s) => ({ thinkingSteps: [...s.thinkingSteps, step] })),

  updateLastThinkingStep: (patch) =>
    set((s) => {
      if (s.thinkingSteps.length === 0) return s;
      const steps = [...s.thinkingSteps];
      steps[steps.length - 1] = { ...steps[steps.length - 1], ...patch };
      return { thinkingSteps: steps };
    }),

  setFinalAnswer: (answer) => set({ finalAnswer: answer, status: "idle" }),

  setError: (msg) => set({ errorMessage: msg, status: "idle" }),

  setTokenCount: (count) => set({ tokenCount: count }),

  incrementIteration: () => set((s) => ({ iterationCount: s.iterationCount + 1 })),

  startAbortController: () => {
    const ctrl = new AbortController();
    set({ abortController: ctrl });
    return ctrl;
  },

  abortSession: () => {
    get().abortController?.abort();
    set({ status: "idle", abortController: null });
  },

  clearSession: () =>
    set({
      sessionId: null,
      status: "idle",
      thinkingSteps: [],
      iterationCount: 0,
      tokenCount: 0,
      startedAt: null,
      abortController: null,
      finalAnswer: null,
      errorMessage: null,
    }),

  setMode: (mode) => {
    set({ mode });
  },

  setPersona: (personaId) => set({ personaId }),
}));
