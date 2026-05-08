import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { storageGet, storageSet } from "../helpers/storage";

export type ProcessStepType =
  | "skill"
  | "persona"
  | "mode"
  | "rules"
  | "thinking"
  | "tool-call"
  | "response";

export type ProcessStepStatus = "active" | "done";

export interface ProcessStep {
  id: string;
  type: ProcessStepType;
  label: string;
  content?: string;
  status: ProcessStepStatus;
  meta?: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: ProcessStep[];
  isStreaming?: boolean;
  timestamp: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  persona: string;
  skill: string;
}

interface ChatContextValue {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  createSession: (model: string, persona: string, skill: string) => string;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  addMessage: (sessionId: string, msg: Omit<Message, "id" | "timestamp">) => string;
  updateMessage: (sessionId: string, msgId: string, patch: Partial<Message>) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    storageGet<ChatSession[]>("ave-ai-sessions", [])
  );
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);

  const persist = useCallback((updater: (prev: ChatSession[]) => ChatSession[]) => {
    setSessions((prev) => {
      const next = updater(prev);
      storageSet(
        "ave-ai-sessions",
        next.slice(-50).map((s) => ({ ...s, messages: s.messages.slice(-120) }))
      );
      return next;
    });
  }, []);

  const createSession = useCallback(
    (model: string, persona: string, skill: string): string => {
      const id = uuidv4();
      persist((prev) => [
        { id, title: "New conversation", messages: [], createdAt: Date.now(), updatedAt: Date.now(), model, persona, skill },
        ...prev,
      ]);
      setActiveSessionIdState(id);
      return id;
    },
    [persist]
  );

  const setActiveSession = useCallback((id: string | null) => {
    setActiveSessionIdState(id);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((s) => s.id !== id));
      setActiveSessionIdState((prev) => (prev === id ? null : prev));
    },
    [persist]
  );

  const addMessage = useCallback(
    (sessionId: string, msg: Omit<Message, "id" | "timestamp">): string => {
      const msgId = uuidv4();
      persist((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, { ...msg, id: msgId, timestamp: Date.now() }], updatedAt: Date.now() }
            : s
        )
      );
      return msgId;
    },
    [persist]
  );

  const updateMessage = useCallback(
    (sessionId: string, msgId: string, patch: Partial<Message>) => {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: s.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)), updatedAt: Date.now() }
            : s
        );
        storageSet("ave-ai-sessions", next.slice(-50));
        return next;
      });
    },
    []
  );

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
      persist((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)));
    },
    [persist]
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <ChatContext.Provider value={{ sessions, activeSessionId, activeSession, createSession, setActiveSession, deleteSession, addMessage, updateMessage, updateSessionTitle }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
