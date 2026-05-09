import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat as useChatStore, type ProcessStep } from "../store/chat";
import { useSettings } from "../store/settings";
import { useSessionStore } from "../store/session";
import { runFastSession, runExpertSession } from "../helpers/orchestrator";
import { buildRegistry } from "../helpers/registry";
import { modeTransitionManager } from "../helpers/modeTransition";
import { useOfflineQueue } from "./useOfflineQueue";
import { notifyResponse } from "../helpers/notifications";
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
  const {
    createSession, addMessage, updateMessage, updateSessionTitle,
    activeSessionId, activeSession, updateSessionTokens,
  } = useChatStore();
  const sessionStore = useSessionStore();
  const abortRef = useRef<AbortController | null>(null);

  // ─── Diagram 19: Mode Transition — reaktif rebuild saat mode berubah ────────
  useEffect(() => {
    modeTransitionManager.transition(settings.chatMode, settings.enableTools);
  }, [settings.chatMode, settings.enableTools]);

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

  // ─── Diagram 44: Graceful shutdown — save state on unload ────────────────
  useEffect(() => {
    const handler = () => {
      abortRef.current?.abort();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const sendMessage = useCallback(
    async (userContent: string, sessionId?: string, images?: string[]) => {
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

      const currentSession = sessionId
        ? undefined
        : activeSession;
      const allMessages = currentSession?.messages || [];
      const mode = settings.chatMode;

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      sessionStore.startAbortController();

      addMessage(currentSessionId, {
        role: "user",
        content: userContent,
        images,
      });

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

      // Build chat history — include images in the last user message if provided
      const chatHistory: OllamaMessage[] = allMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          images: m.images,
        }));

      const opts = {
        mode,
        personaId: settings.selectedPersona,
        skillId: currentSession?.skill || "general",
        model: settings.selectedModel,
        baseUrl: settings.baseUrl,
        enableThinking: settings.enableThinking,
        enableTools: settings.enableTools && mode === "expert",
        signal: ctrl.signal,
        systemPromptOverride: (settings.systemPromptOverrides ?? {})[settings.selectedPersona] || undefined,
        numPredict: settings.maxOutputTokens,
        images,
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
          tokenCount: result.tokenCount,
        });

        sessionStore.setFinalAnswer(result.finalAnswer);

        // ─── Diagram 46: Track token usage per conversation ────────────────
        if (result.tokenCount > 0) {
          updateSessionTokens(currentSessionId, result.tokenCount);
        }

        if (allMessages.length === 0) {
          updateSessionTitle(
            currentSessionId,
            userContent.slice(0, 60).trim() || "New conversation"
          );
        }

        // ─── Diagram 51: Notification when response complete ───────────────
        if (settings.enableNotifications) {
          notifyResponse(settings.selectedPersona);
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
    [settings, activeSessionId, activeSession, createSession, addMessage, updateMessage, updateSessionTitle, updateSessionTokens, sessionStore]
  );

  // ─── Diagram 41: Auto-greeting — send brief greeting on new conversation ──
  const sendGreeting = useCallback(
    async (sessionId: string) => {
      if (!settings.selectedModel) return;

      const ctrl = new AbortController();
      const greetingMsgId = addMessage(sessionId, {
        role: "assistant",
        content: "",
        isStreaming: true,
        model: settings.selectedModel,
      });

      try {
        const result = await runFastSession(
          "__greeting__",
          [],
          {
            mode: "fast",
            personaId: settings.selectedPersona,
            skillId: "general",
            model: settings.selectedModel,
            baseUrl: settings.baseUrl,
            enableThinking: false,
            enableTools: false,
            signal: ctrl.signal,
            systemPromptOverride: (settings.systemPromptOverrides ?? {})[settings.selectedPersona] || undefined,
            isGreeting: true,
          }
        );
        if (!ctrl.signal.aborted) {
          updateMessage(sessionId, greetingMsgId, {
            content: result.finalAnswer,
            isStreaming: false,
          });
        }
      } catch {
        updateMessage(sessionId, greetingMsgId, {
          content: "Hello! How can I help you today?",
          isStreaming: false,
        });
      }
    },
    [settings, addMessage, updateMessage]
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
    sendGreeting,
    stopGeneration,
    isOnline: offlineQueue.isOnline,
    offlineQueueSize: offlineQueue.queueSize,
  };
}
