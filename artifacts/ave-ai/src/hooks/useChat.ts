import { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat as useChatStore, type ProcessStep } from "../store/chat";
import { useSettings } from "../store/settings";
import { streamChat, type OllamaMessage } from "../helpers/ollama";
import { parseStreamingThinking } from "../helpers/thinking";
import { getSkill, detectSkill } from "../skills/index";
import { getPersona } from "../personas/index";
import { compileRules, type RuleContext } from "../rules/index";
import { getOllamaTools, executeTool } from "../tools/index";

function step(
  type: ProcessStep["type"],
  label: string,
  content?: string,
  status: ProcessStep["status"] = "done"
): ProcessStep {
  return { id: uuidv4(), type, label, content, status };
}

export function useChatActions() {
  const { settings } = useSettings();
  const { createSession, addMessage, updateMessage, updateSessionTitle, activeSessionId, activeSession } =
    useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (userContent: string, sessionId?: string) => {
      const currentSessionId =
        sessionId ||
        activeSessionId ||
        createSession(settings.selectedModel, settings.selectedPersona, "general");

      const currentSession = activeSession;
      const allMessages = currentSession?.messages || [];

      // ── Layer 1: Skill (auto-detect or manual) ──────────────────────────
      const skillId = currentSession?.skill || detectSkill(userContent);
      const skill = getSkill(skillId);

      // ── Layer 2: Persona ────────────────────────────────────────────────
      const persona = getPersona(settings.selectedPersona);

      // ── Layer 3: Mode ───────────────────────────────────────────────────
      const mode = settings.chatMode;

      // ── Layer 4: Rules ──────────────────────────────────────────────────
      const ruleCtx: RuleContext = {
        isFirstMessage: allMessages.length === 0,
        messageCount: allMessages.length,
        skill: skillId,
        persona: settings.selectedPersona,
        mode,
        enableThinking: settings.enableThinking,
        userMessage: userContent,
      };
      const { rulesPrompt, appliedRules } = compileRules(ruleCtx);

      // ── Add user message ────────────────────────────────────────────────
      addMessage(currentSessionId, { role: "user", content: userContent });

      // ── Init process steps ──────────────────────────────────────────────
      const initSteps: ProcessStep[] = [
        step("skill", `Skill → ${skill.name}`, skill.description),
        step("persona", `Persona → ${persona.name}`, persona.description),
        step("mode", `Mode → ${mode === "expert" ? "Expert" : "Fast"}`,
          mode === "expert" ? "Deep reasoning" : "Speed-optimized"),
        step("rules", `Rules → ${appliedRules.length} active`,
          appliedRules.join(", ")),
      ];

      // ── Placeholder assistant message ───────────────────────────────────
      const assistantMsgId = addMessage(currentSessionId, {
        role: "assistant",
        content: "",
        steps: initSteps,
        isStreaming: true,
        model: settings.selectedModel,
      });

      // ── Build layered system prompt ─────────────────────────────────────
      const systemPrompt = [
        `[SKILL: ${skill.name.toUpperCase()}]\n${skill.systemPrompt}`,
        `[PERSONA: ${persona.name.toUpperCase()}]\n${persona.systemPrompt}`,
        `[RULES]\n${rulesPrompt}`,
      ]
        .filter(Boolean)
        .join("\n\n---\n\n");

      // ── Build message history ───────────────────────────────────────────
      const ollamaMessages: OllamaMessage[] = [
        { role: "system", content: systemPrompt },
        ...allMessages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: userContent },
      ];

      abortRef.current = new AbortController();

      const ollamaOptions =
        mode === "expert"
          ? { temperature: 0.4, num_predict: 2048, top_p: 0.85, repeat_penalty: 1.15 }
          : { temperature: 0.7, num_predict: 1024, top_p: 0.9, repeat_penalty: 1.1 };

      const tools = settings.enableTools ? getOllamaTools() : undefined;

      try {
        let rawContent = "";
        let thinkingStepId: string | null = null;
        let currentSteps = [...initSteps];

        const patchSteps = (steps: ProcessStep[]) => {
          currentSteps = steps;
          updateMessage(currentSessionId, assistantMsgId, { steps: [...steps] });
        };

        const gen = streamChat(
          settings.baseUrl,
          settings.selectedModel,
          ollamaMessages,
          tools,
          ollamaOptions,
          abortRef.current.signal
        );

        for await (const chunk of gen) {
          // ── Tool calls ──────────────────────────────────────────────────
          if (chunk.message?.tool_calls?.length) {
            for (const tc of chunk.message.tool_calls) {
              const toolStep: ProcessStep = {
                id: uuidv4(),
                type: "tool-call",
                label: `Tool → ${tc.function.name}`,
                content: `args: ${JSON.stringify(tc.function.arguments)}`,
                status: "active",
              };
              patchSteps([...currentSteps, toolStep]);

              const result = await executeTool(tc.function.name, tc.function.arguments || {});

              patchSteps(
                currentSteps.map((s) =>
                  s.id === toolStep.id ? { ...s, content: result, status: "done" } : s
                )
              );
            }
            continue;
          }

          if (chunk.message?.content) rawContent += chunk.message.content;

          // ── Parse thinking ──────────────────────────────────────────────
          const parsed = parseStreamingThinking(rawContent);

          if (parsed.state === "streaming") {
            // Thinking actively in progress
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
            updateMessage(currentSessionId, assistantMsgId, { steps: currentSteps, content: "", isStreaming: true });
          } else if (parsed.state === "done") {
            // Thinking complete — seal it
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
            // Direct response (no thinking)
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: rawContent,
              isStreaming: !chunk.done,
            });
          }

          if (chunk.done) break;
        }

        // ── Finalize ────────────────────────────────────────────────────
        const finalParsed = parseStreamingThinking(rawContent);
        const finalContent =
          finalParsed.state === "done"
            ? finalParsed.responseContent
            : finalParsed.state === "streaming"
            ? finalParsed.thinkingContent
            : rawContent;

        updateMessage(currentSessionId, assistantMsgId, {
          content: finalContent,
          isStreaming: false,
          steps: currentSteps.map((s) => ({ ...s, status: "done" })),
        });

        // Auto-title
        if (allMessages.length === 0) {
          updateSessionTitle(currentSessionId, userContent.slice(0, 60).trim() || "New conversation");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          updateMessage(currentSessionId, assistantMsgId, { isStreaming: false });
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        updateMessage(currentSessionId, assistantMsgId, {
          content: `Connection error: ${msg}\n\nMake sure Ollama is running at **${settings.baseUrl}** and a model is selected.`,
          isStreaming: false,
          steps: undefined,
        });
      }
    },
    [settings, activeSessionId, activeSession, createSession, addMessage, updateMessage, updateSessionTitle]
  );

  return { sendMessage, stopGeneration };
}
