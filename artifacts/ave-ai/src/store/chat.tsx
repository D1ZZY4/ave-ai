import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  thinking?: string;
  toolCalls?: ToolCallResult[];
  isStreaming?: boolean;
  isThinking?: boolean;
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
  clearAll: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function loadSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem("ave-ai-sessions");
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    // Only keep last 50 sessions, trim old messages
    const trimmed = sessions.slice(-50).map((s) => ({
      ...s,
      messages: s.messages.slice(-100),
    }));
    localStorage.setItem("ave-ai-sessions", JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);

  const persist = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  }, []);

  const createSession = useCallback(
    (model: string, persona: string, skill: string): string => {
      const id = uuidv4();
      const session: ChatSession = {
        id,
        title: "New conversation",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model,
        persona,
        skill,
      };
      persist((prev) => [session, ...prev]);
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
      const message: Message = { ...msg, id: msgId, timestamp: Date.now() };
      persist((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
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
        const updated = prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
                updatedAt: Date.now(),
              }
            : s
        );
        saveSessions(updated);
        return updated;
      });
    },
    []
  );

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
      persist((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      );
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
    setActiveSessionIdState(null);
  }, [persist]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        createSession,
        setActiveSession,
        deleteSession,
        addMessage,
        updateMessage,
        updateSessionTitle,
        clearAll,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
