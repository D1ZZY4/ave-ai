import { create } from "zustand";
import type { ThinkingStep, SessionStatus, AgentMode } from "../types";
import { COMPRESS_THRESHOLD } from "../types";

const ARCHIVE_KEY = "ave-ai-session-archive";

function archiveSession(sessionId: string, steps: ThinkingStep[], tokenCount: number): void {
  try {
    const archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]") as unknown[];
    archive.unshift({
      sessionId,
      steps: steps.slice(-10),
      tokenCount,
      archivedAt: Date.now(),
    });
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive.slice(0, 20)));
  } catch {
    // ignore storage errors
  }
}

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
  registryReady: boolean;

  setSessionActive: (sessionId: string, mode: AgentMode, personaId: string) => void;
  setStatus: (status: SessionStatus) => void;
  appendThinkingStep: (step: ThinkingStep) => void;
  updateLastThinkingStep: (patch: Partial<ThinkingStep>) => void;
  setFinalAnswer: (answer: string) => void;
  setError: (msg: string) => void;
  setTokenCount: (count: number) => void;
  checkAndTriggerCompression: () => boolean;
  incrementIteration: () => void;
  startAbortController: () => AbortController;
  abortSession: () => void;
  terminateAndArchive: () => void;
  clearSession: () => void;
  setMode: (mode: AgentMode) => void;
  setPersona: (personaId: string) => void;
  setRegistryReady: (ready: boolean) => void;
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
  registryReady: false,

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

  setFinalAnswer: (answer) => {
    const s = get();
    if (s.sessionId) {
      archiveSession(s.sessionId, s.thinkingSteps, s.tokenCount);
    }
    set({ finalAnswer: answer, status: "idle" });
  },

  setError: (msg) => set({ errorMessage: msg, status: "idle" }),

  setTokenCount: (count) => set({ tokenCount: count }),

  checkAndTriggerCompression: (): boolean => {
    const s = get();
    if (s.tokenCount >= COMPRESS_THRESHOLD && s.status === "active") {
      set({ status: "compressing" });
      return true;
    }
    return false;
  },

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

  terminateAndArchive: () => {
    const s = get();
    if (s.sessionId) {
      archiveSession(s.sessionId, s.thinkingSteps, s.tokenCount);
    }
    set({ status: "archived", abortController: null });
    setTimeout(() => set({ status: "idle" }), 100);
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

  setMode: (mode) => set({ mode }),

  setPersona: (personaId) => set({ personaId }),

  setRegistryReady: (ready) => set({ registryReady: ready }),
}));
