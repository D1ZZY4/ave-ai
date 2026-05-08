import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat as useChatStore, type ProcessStep } from "../store/chat";
import { useSettings } from "../store/settings";
import { useSessionStore } from "../store/session";
import { runFastSession, runExpertSession } from "../helpers/orchestrator";
import { buildRegistry } from "../helpers/registry";
import { useOfflineQueue } from "./useOfflineQueue";
import type { OllamaMessage } from "../helpers/ollama";
import type { ThinkingStep, OfflineQueueItem } from "../types";

function thinkingToProcessStep(step: ThinkingStep): ProcessStep {
  const parts: string[] = [];
  if (step.thought) parts.push(`Thought: ${step.thought}`);
  if (step.action) {
    const label = step.execType ? `${step.execType.toUpperCase()}: ${step.action}` : step.action;
    parts.push(`Action: ${label}`);
  }
  if (step.actionInput) parts.push(`Input: ${JSON.stringify(step.actionInput)}`);
  if (step.observation) parts.push(`Observation: ${step.observation}`);
  return {
    id: uuidv4(),
    type: "thinking",
    label: step.action
      ? `Step ${step.stepNumber} → ${step.action}${step.execType ? ` (${step.execType})` : ""}`
      : `Step ${step.stepNumber}`,
    content: parts.join("\n"),
    status: "done",
  };
}

export function useAgent() {
  const { settings } = useSettings();
  const { createSession, addMessage, updateMessage, updateSessionTitle, activeSessionId, activeSession } =
    useChatStore();
  const sessionStore = useSessionStore();
  const abortRef = useRef<AbortController | null>(null);

  // ─── Init: build registry on mount (Diagram 21) ──────────────────────────
  useEffect(() => {
    if (sessionStore.registryReady) return;
    buildRegistry()
      .then(({ errors }) => {
        if (errors.length > 0) {
          console.warn("[useAgent] Registry dependency errors:", errors);
        }
        sessionStore.setRegistryReady(true);
      })
      .catch((err) => {
        console.error("[useAgent] Registry build failed:", err);
        sessionStore.setRegistryReady(true);
      });
  }, [sessionStore]);

  const sendMessage = useCallback(
    async (userContent: string, sessionId?: string) => {
      if (!navigator.onLine) {
        const sid = sessionId || activeSessionId || "";
        offlineQueue.enqueue(userContent, sid);
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const currentSessionId =
        sessionId ||
        activeSessionId ||
        createSession(settings.selectedModel, settings.selectedPersona, "general");

      const currentSession = activeSession;
      const allMessages = currentSession?.messages || [];
      const mode = settings.chatMode;

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      sessionStore.startAbortController();

      addMessage(currentSessionId, { role: "user", content: userContent });

      const initSteps: ProcessStep[] = [
        {
          id: uuidv4(),
          type: "mode",
          label: `Mode → ${mode === "expert" ? "Expert (ReAct)" : "Fast"}`,
          content: mode === "expert" ? "Deep reasoning with tools" : "Speed-optimized direct response",
          status: "done",
        },
        {
          id: uuidv4(),
          type: "persona",
          label: `Persona → ${settings.selectedPersona}`,
          content: settings.selectedPersona,
          status: "done",
        },
      ];

      const assistantMsgId = addMessage(currentSessionId, {
        role: "assistant",
        content: "",
        steps: initSteps,
        isStreaming: true,
        model: settings.selectedModel,
      });

      const chatHistory: OllamaMessage[] = allMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const opts = {
        mode,
        personaId: settings.selectedPersona,
        skillId: currentSession?.skill || "general",
        model: settings.selectedModel,
        baseUrl: settings.baseUrl,
        enableThinking: settings.enableThinking,
        enableTools: settings.enableTools && mode === "expert",
        signal: ctrl.signal,
      };

      sessionStore.setSessionActive(currentSessionId, mode, settings.selectedPersona);

      let thinkingProcessSteps: ProcessStep[] = [...initSteps];

      try {
        let result;

        if (mode === "fast") {
          result = await runFastSession(userContent, chatHistory, opts);
        } else {
          result = await runExpertSession(
            userContent,
            chatHistory,
            opts,
            (step: ThinkingStep) => {
              sessionStore.appendThinkingStep(step);
              const ps = thinkingToProcessStep(step);
              thinkingProcessSteps = [...thinkingProcessSteps, ps];
              updateMessage(currentSessionId, assistantMsgId, {
                steps: thinkingProcessSteps,
                content: "",
                isStreaming: true,
              });
            },
            (patch: Partial<ThinkingStep>) => {
              sessionStore.updateLastThinkingStep(patch);
              if (thinkingProcessSteps.length > 0) {
                const last = thinkingProcessSteps[thinkingProcessSteps.length - 1];
                const updatedContent = patch.observation
                  ? (last.content || "") + `\nObservation: ${patch.observation}`
                  : last.content;
                thinkingProcessSteps = [
                  ...thinkingProcessSteps.slice(0, -1),
                  { ...last, content: updatedContent },
                ];
                updateMessage(currentSessionId, assistantMsgId, {
                  steps: thinkingProcessSteps,
                  content: "",
                  isStreaming: true,
                });
              }
            }
          );
        }

        if (ctrl.signal.aborted) {
          updateMessage(currentSessionId, assistantMsgId, { isStreaming: false });
          sessionStore.clearSession();
          return;
        }

        const finalSteps = result.thinkingSteps.map(thinkingToProcessStep);
        const allSteps = [...initSteps, ...finalSteps];

        updateMessage(currentSessionId, assistantMsgId, {
          content: result.finalAnswer,
          isStreaming: false,
          steps: allSteps.map((s) => ({ ...s, status: "done" })),
        });

        sessionStore.setFinalAnswer(result.finalAnswer);

        if (allMessages.length === 0) {
          updateSessionTitle(
            currentSessionId,
            userContent.slice(0, 60).trim() || "New conversation"
          );
        }
      } catch (err) {
        if (err instanceof Error && (err.name === "AbortError" || ctrl.signal.aborted)) {
          updateMessage(currentSessionId, assistantMsgId, { isStreaming: false });
          sessionStore.clearSession();
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        updateMessage(currentSessionId, assistantMsgId, {
          content: `Connection error: ${msg}\n\nMake sure Ollama is running at **${settings.baseUrl}** and a model is selected.`,
          isStreaming: false,
          steps: undefined,
        });
        sessionStore.setError(msg);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, activeSessionId, activeSession, createSession, addMessage, updateMessage, updateSessionTitle, sessionStore]
  );

  // ─── Offline Queue flush handler (Diagram 29) ─────────────────────────────
  const handleFlush = useCallback(
    async (item: OfflineQueueItem) => {
      await sendMessage(item.userContent, item.sessionId || undefined);
    },
    [sendMessage]
  );

  const offlineQueue = useOfflineQueue(handleFlush);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    sessionStore.abortSession();
  }, [sessionStore]);

  return {
    sendMessage,
    stopGeneration,
    isOnline: offlineQueue.isOnline,
    offlineQueueSize: offlineQueue.queueSize,
  };
}
