/**
 * Diagram 2, 3, 10, 11, 15, 25, 26, 27, 40, 46, 51, 53, 54:
 * Full orchestrator — input validation, health check, streaming, tool retry,
 * session compression, token tracking, output validation, notifications.
 */
import { useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat as useChatStore, type ProcessStep } from "../store/chat";
import { useSettings } from "../store/settings";
import { streamChat, type OllamaMessage } from "../helpers/ollama";
import { parseStreamingThinking } from "../helpers/thinking";
import { getSkill, detectSkill } from "../../../agents/skills/index";
import { getPersona } from "../../../agents/personas/index";
import { compileRules, RulesEngine, type RuleContext } from "../../../agents/rules/index";
import { getOllamaTools, executeTool } from "../../../agents/tools/index";
import { estimateTokens, shouldCompress, compressionTargetTokens } from "../helpers/tokenizer";
import { compressHistory } from "../helpers/compression";
import { checkOllamaHealth, setHealthStatus } from "../helpers/healthCheck";
import { sanitizeInput } from "../helpers/sanitizer";
import { loadFacts, formatFactsForPrompt, extractFacts, saveFact } from "../../../agents/memory/index";

function step(
  type: ProcessStep["type"],
  label: string,
  content?: string,
  status: ProcessStep["status"] = "done"
): ProcessStep {
  return { id: uuidv4(), type, label, content, status };
}

function fireNotification(title: string, body: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.svg", tag: "ave-ai-response" });
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
  } catch {
    // Ignore — notifications blocked or unavailable
  }
}

export function useChatActions() {
  const { settings } = useSettings();
  const {
    createSession, addMessage, updateMessage, updateSessionTitle,
    updateSessionTokens, activeSessionId, activeSession,
  } = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  // ── flow-8 diagram 2: Graceful shutdown — save state & abort on tab close ─
  useEffect(() => {
    const handler = () => { abortRef.current?.abort(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (userContent: string, sessionId?: string, images?: string[]) => {
      // ── Diagram 43: Ensure model is selected ───────────────────────────
      if (!settings.selectedModel) {
        const sid = sessionId || activeSessionId || createSession("", settings.selectedPersona, "general");
        addMessage(sid, {
          role: "assistant",
          content: "**No model selected.** Please open Settings → Connection and choose or add a model before chatting.",
          isStreaming: false,
        });
        return;
      }

      const currentSessionId =
        sessionId ||
        activeSessionId ||
        createSession(settings.selectedModel, settings.selectedPersona, "general");

      const currentSession = activeSession;
      const allMessages = currentSession?.messages || [];

      // ── Diagram 28: Sanitize input ──────────────────────────────────────
      const sanitized = sanitizeInput(userContent, 8192);

      // ── Diagram 5, 18: Input validation via RulesEngine ────────────────
      const mode = settings.chatMode;
      const skillId = currentSession?.skill || detectSkill(sanitized);
      const persona = getPersona(settings.selectedPersona);
      const skill = getSkill(skillId);

      const ruleCtx: RuleContext = {
        isFirstMessage: allMessages.length === 0,
        messageCount: allMessages.length,
        skill: skillId,
        persona: settings.selectedPersona,
        mode,
        enableThinking: settings.enableThinking,
        userMessage: sanitized,
      };

      const engine = new RulesEngine(ruleCtx);
      const inputResult = engine.validateInput(sanitized);

      if (inputResult.decision === "Deny") {
        addMessage(currentSessionId, { role: "user", content: sanitized });
        addMessage(currentSessionId, {
          role: "assistant",
          content: `⚠️ **Message blocked:** ${inputResult.reason}`,
          isStreaming: false,
        });
        return;
      }

      const effectiveInput =
        inputResult.decision === "Modify" && inputResult.modifiedContent
          ? inputResult.modifiedContent
          : sanitized;

      // ── Diagram 4: Compile rules ────────────────────────────────────────
      const { rulesPrompt, appliedRules } = compileRules(ruleCtx);

      // ── Add user message ────────────────────────────────────────────────
      addMessage(currentSessionId, {
        role: "user",
        content: sanitized,
        images: images && images.length > 0 ? images : undefined,
      });

      // ── Init process steps ──────────────────────────────────────────────
      const initSteps: ProcessStep[] = [
        step("skill", `Skill → ${skill.name}`, skill.description),
        step("persona", `Persona → ${persona.name}`, persona.description),
        step("mode", `Mode → ${mode === "expert" ? "Expert" : "Fast"}`,
          mode === "expert" ? "Deep reasoning" : "Speed-optimized"),
        step("rules", `Rules → ${appliedRules.length} active`, appliedRules.join(", ")),
      ];

      // ── Placeholder assistant message ───────────────────────────────────
      const assistantMsgId = addMessage(currentSessionId, {
        role: "assistant",
        content: "",
        steps: initSteps,
        isStreaming: true,
        model: settings.selectedModel,
      });

      // ── Diagram 52: System prompt with persona override ─────────────────
      const personaOverride = settings.systemPromptOverrides?.[settings.selectedPersona];
      const personaPrompt = personaOverride || persona.systemPrompt;

      // ── flow-12 diagram 5: Load long-term memory facts for prompt injection ─
      const memoryFacts = settings.memoryEnabled ? await loadFacts() : [];
      const memoryBlock = formatFactsForPrompt(memoryFacts);

      // ── Build layered system prompt (Diagram 23) ────────────────────────
      const systemPrompt = [
        `[SKILL: ${skill.name.toUpperCase()}]\n${skill.systemPrompt}`,
        `[PERSONA: ${persona.name.toUpperCase()}]\n${personaPrompt}`,
        `[RULES]\n${rulesPrompt}`,
        memoryBlock ? `[MEMORY]\n${memoryBlock}` : "",
      ].filter(Boolean).join("\n\n---\n\n");

      // ── Build message history ───────────────────────────────────────────
      const historyMessages: OllamaMessage[] = [
        { role: "system", content: systemPrompt },
        ...allMessages
          .filter((m) => !m.isStreaming)
          .map((m): OllamaMessage => {
            const msg: OllamaMessage = {
              role: m.role as "user" | "assistant",
              content: m.content,
            };
            if (m.images && m.images.length > 0 && m.role === "user") {
              msg.images = m.images;
            }
            return msg;
          }),
        images && images.length > 0
          ? { role: "user", content: effectiveInput, images }
          : { role: "user", content: effectiveInput },
      ];

      // ── Diagram 15: Session compression at 70% token budget ─────────────
      const totalTokens = historyMessages.reduce(
        (t, m) => t + estimateTokens(m.content) + 4, 0
      );
      let ollamaMessages = historyMessages;
      let compressionNote = "";

      if (shouldCompress(totalTokens)) {
        const compressed = compressHistory(historyMessages, compressionTargetTokens());
        ollamaMessages = compressed.messages;
        if (compressed.wasCompressed) {
          compressionNote = `Compressing state — removed ${compressed.removedCount} old messages to stay within context window.`;
        }
      }

      // ── Diagram 54: Max output tokens from settings ─────────────────────
      const numPredict = Math.min(settings.maxOutputTokens ?? 2048, 8192);

      // ── Diagram 4, 19: Mode-based Ollama options ────────────────────────
      const ollamaOptions =
        mode === "expert"
          ? { temperature: 0.4, num_predict: numPredict, top_p: 0.85, repeat_penalty: 1.15 }
          : { temperature: 0.7, num_predict: Math.min(numPredict, 1024), top_p: 0.9, repeat_penalty: 1.1 };

      // ── Diagram 2, 3: Tool schema only in Expert + enableTools ──────────
      const tools =
        mode === "expert" && settings.enableTools ? getOllamaTools() : undefined;

      // ── Diagram 25: Per-conversation AbortController ────────────────────
      abortRef.current = new AbortController();

      // ── Diagram 53: Health check (non-blocking, cached 30s) ─────────────
      checkOllamaHealth(settings.baseUrl, abortRef.current.signal).then((status) => {
        setHealthStatus(status);
      }).catch(() => {});

      let currentSteps: ProcessStep[] = [...initSteps];

      try {
        let rawContent = "";
        let thinkingStepId: string | null = null;
        let evalCount = 0;

        if (compressionNote) {
          currentSteps = [
            ...currentSteps,
            step("response", "Context compressed", compressionNote, "done"),
          ];
        }

        const patchSteps = (steps: ProcessStep[]) => {
          currentSteps = steps;
          updateMessage(currentSessionId, assistantMsgId, { steps: [...steps] });
        };

        // ── Diagram 2, 40: Streaming loop ───────────────────────────────
        const gen = streamChat(
          settings.baseUrl,
          settings.selectedModel,
          ollamaMessages,
          tools,
          ollamaOptions,
          abortRef.current.signal
        );

        let toolCallCount = 0;
        const MAX_TOOL_CALLS = 5;

        for await (const chunk of gen) {
          // ── flow-16 diagrams 1-3: Parallel tool execution ──────────────
          if (chunk.message?.tool_calls?.length && toolCallCount < MAX_TOOL_CALLS) {
            const remaining = MAX_TOOL_CALLS - toolCallCount;
            const callsToRun = chunk.message.tool_calls.slice(0, remaining);
            toolCallCount += callsToRun.length;

            // Register all tool steps as active immediately
            const toolSteps: ProcessStep[] = callsToRun.map((tc) => ({
              id: uuidv4(),
              type: "tool-call" as const,
              label: `Tool → ${tc.function.name}`,
              content: `args: ${JSON.stringify(tc.function.arguments)}`,
              status: "active" as const,
            }));
            patchSteps([...currentSteps, ...toolSteps]);

            // Execute all independent tool calls concurrently (flow-16 #2)
            const toolResults = await Promise.all(
              callsToRun.map(async (tc, i) => {
                const stepId = toolSteps[i].id;
                const validation = engine.validateToolCall(
                  tc.function.name,
                  tc.function.arguments || {}
                );
                if (validation.decision === "Deny") {
                  return { stepId, content: `Blocked: ${validation.reason}` };
                }
                const result = await executeTool(tc.function.name, tc.function.arguments || {});
                return { stepId, content: result.slice(0, 120) };
              })
            );

            // Mark all tool steps done with their results
            patchSteps(
              currentSteps.map((s) => {
                const r = toolResults.find((r) => r.stepId === s.id);
                return r ? { ...s, content: r.content, status: "done" as const } : s;
              })
            );
            continue;
          }

          if (chunk.message?.content) rawContent += chunk.message.content;
          if (chunk.eval_count) evalCount = chunk.eval_count;

          // ── Diagram 16: Real-time thinking display ──────────────────────
          const parsed = parseStreamingThinking(rawContent);

          if (parsed.state === "streaming") {
            if (!thinkingStepId) {
              const ts: ProcessStep = {
                id: uuidv4(),
                type: "thinking",
                label: "Thinking...",
                content: parsed.thinkingContent,
                status: "active",
              };
              thinkingStepId = ts.id;
              patchSteps([...currentSteps, ts]);
            } else {
              patchSteps(
                currentSteps.map((s) =>
                  s.id === thinkingStepId
                    ? { ...s, content: parsed.thinkingContent, label: "Thinking...", status: "active" }
                    : s
                )
              );
            }
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: "",
              isStreaming: true,
            });
          } else if (parsed.state === "done") {
            if (thinkingStepId) {
              patchSteps(
                currentSteps.map((s) =>
                  s.id === thinkingStepId
                    ? { ...s, content: parsed.thinkingContent, label: "Thinking", status: "done" }
                    : s
                )
              );
            }
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: parsed.responseContent,
              isStreaming: !chunk.done,
            });
          } else {
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: rawContent,
              isStreaming: !chunk.done,
            });
          }

          if (chunk.done) break;
        }

        // ── Finalize content ────────────────────────────────────────────
        const finalParsed = parseStreamingThinking(rawContent);
        let finalContent =
          finalParsed.state === "done"
            ? finalParsed.responseContent
            : finalParsed.state === "streaming"
            ? finalParsed.thinkingContent
            : rawContent;

        // ── Diagram 2, 18: Output validation ────────────────────────────
        const outputResult = engine.validateOutput(finalContent);
        if (outputResult.decision === "Deny") {
          finalContent = `⚠️ **Response blocked:** ${outputResult.reason}`;
        } else if (outputResult.decision === "Modify" && outputResult.modifiedContent) {
          finalContent = outputResult.modifiedContent;
        }

        updateMessage(currentSessionId, assistantMsgId, {
          content: finalContent,
          isStreaming: false,
          tokenCount: evalCount,
          steps: currentSteps.map((s) => ({ ...s, status: "done" as const })),
        });

        // ── Diagram 46: Token usage tracking ────────────────────────────
        if (evalCount > 0) {
          updateSessionTokens(currentSessionId, evalCount);
        }

        // ── Diagram 32, 33: Auto-title on first message ──────────────────
        if (allMessages.length === 0) {
          updateSessionTitle(
            currentSessionId,
            sanitized.slice(0, 60).trim() || "New conversation"
          );
        }

        // ── Diagram 51: Notification on completion ───────────────────────
        if (settings.enableNotifications && document.hidden) {
          fireNotification(
            "Ave AI",
            finalContent.replace(/[#*`]/g, "").slice(0, 80) || "Response ready"
          );
        }

        // ── flow-12 diagram 4: Extract & persist new facts from response ─
        if (settings.memoryEnabled && finalContent.length > 0) {
          extractFacts(finalContent, memoryFacts, settings.baseUrl, settings.selectedModel)
            .then(({ facts }) => Promise.all(facts.map((f) => saveFact(f))))
            .catch(() => {});
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          updateMessage(currentSessionId, assistantMsgId, {
            isStreaming: false,
            steps: currentSteps.map((s) => ({ ...s, status: "done" as const })),
          });
          return;
        }

        // ── Diagram 11: Error handling & recovery ────────────────────────
        const msg = err instanceof Error ? err.message : String(err);
        setHealthStatus("fail");
        updateMessage(currentSessionId, assistantMsgId, {
          content: `**Connection error:** ${msg}\n\nMake sure Ollama is running at **${settings.baseUrl}** and a model is selected.\n\n_Tip: Open Settings → Connection to test your connection._`,
          isStreaming: false,
          steps: undefined,
        });
      }
    },
    [settings, activeSessionId, activeSession, createSession, addMessage, updateMessage, updateSessionTitle, updateSessionTokens]
  );

  return { sendMessage, stopGeneration };
}
