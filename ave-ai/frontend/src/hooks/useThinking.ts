/**
 * flow-9 diagram 4: useThinking — selector hook for thinking step state.
 * Provides active thinking content and display settings to any component.
 * Thinking content is stored in message.steps[] (ProcessStep with type="thinking").
 */
import { useMemo } from "react";
import { useSettings } from "../store/settings";
import { useChat, type ProcessStep } from "../store/chat";

export interface ThinkingState {
  showThinking: boolean;
  showProcessLog: boolean;
  activeThinkingContent: string;
  hasActiveThinking: boolean;
  activeProcessSteps: ProcessStep[];
}

export function useThinking(sessionId?: string): ThinkingState {
  const { settings } = useSettings();
  const { sessions } = useChat();

  const session = useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId) : undefined),
    [sessions, sessionId]
  );

  const streamingMessage = useMemo(
    () => session?.messages.find((m) => m.isStreaming && m.role === "assistant"),
    [session]
  );

  const activeProcessSteps = useMemo<ProcessStep[]>(
    () => streamingMessage?.steps ?? [],
    [streamingMessage]
  );

  const activeThinkingStep = useMemo(
    () => activeProcessSteps.find((s) => s.type === "thinking" && s.status === "active"),
    [activeProcessSteps]
  );

  return {
    showThinking: settings.showThinking ?? true,
    showProcessLog: settings.showProcessLog ?? true,
    activeProcessSteps,
    activeThinkingContent: activeThinkingStep?.content ?? "",
    hasActiveThinking: activeThinkingStep !== undefined,
  };
}
