import { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat as useChatStore, type ProcessStep } from "../store/chat";
import { useSettings } from "../store/settings";
import { streamChat, type OllamaMessage } from "../helpers/ollama";
import { parseStreamingThinking } from "../helpers/thinking";
import { getSkill, detectSkill } from "../skills/index";
import { getPersona } from "../lib/personas";
import { getOllamaTools, executeTool } from "../tools/index";

function makeStep(type: ProcessStep["type"], label: string, content?: string, status: ProcessStep["status"] = "active"): ProcessStep {
  return { id: uuidv4(), type, label, content, status };
}

export function useChatActions() {
  const { settings } = useSettings();
  const {
    createSession,
    addMessage,
    updateMessage,
    updateSessionTitle,
    activeSessionId,
    activeSession,
  } = useChatStore();
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

      // Auto-detect skill if not manually overridden
      const skillId = currentSession?.skill || detectSkill(userContent);
      const skill = getSkill(skillId);
      const persona = getPersona(settings.selectedPersona);
      const mode = settings.chatMode;

      // Add user message
      addMessage(currentSessionId, { role: "user", content: userContent });

      // Build initial process steps
      const initSteps: ProcessStep[] = [
        makeStep("skill", `Skill → ${skill.name}`, skill.description, "done"),
        makeStep("persona", `Persona → ${persona.name}`, persona.description, "done"),
        makeStep("mode", `Mode → ${mode === "expert" ? "Expert" : "Fast"}`,
          mode === "expert" ? "Deep reasoning enabled" : "Optimized for speed", "done"),
      ];

      // Add placeholder assistant message with process steps
      const assistantMsgId = addMessage(currentSessionId, {
        role: "assistant",
        content: "",
        steps: initSteps,
        isStreaming: true,
        model: settings.selectedModel,
      });

      // Build system prompt from layers
      const modeInstruction =
        mode === "expert"
          ? "Think deeply and thoroughly before responding. Break down complex problems. Consider edge cases and trade-offs. Be comprehensive."
          : "Be concise and direct. Prioritize clarity and speed. Give the core answer first.";

      const thinkingInstruction = settings.enableThinking
        ? "Use your full reasoning capacity. Think step by step before responding."
        : "";

      const systemPrompt = [
        skill.systemPrompt,
        persona.systemAddition,
        `Mode: ${modeInstruction}`,
        thinkingInstruction,
      ]
        .filter(Boolean)
        .join("\n\n");

      // Build message history
      const allMessages = currentSession?.messages || [];
      const ollamaMessages: OllamaMessage[] = [
        { role: "system", content: systemPrompt },
        ...allMessages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: userContent },
      ];

      abortRef.current = new AbortController();

      // Ollama options based on mode
      const ollamaOptions =
        mode === "expert"
          ? { temperature: 0.4, num_predict: 2048, top_p: 0.85, repeat_penalty: 1.15 }
          : { temperature: 0.7, num_predict: 1024, top_p: 0.9, repeat_penalty: 1.1 };

      const tools = settings.enableTools ? getOllamaTools() : undefined;

      try {
        let rawContent = "";
        let thinkingStepId: string | null = null;
        let currentSteps = [...initSteps];

        const updateSteps = (steps: ProcessStep[]) => {
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
          // Handle tool calls
          if (chunk.message?.tool_calls?.length) {
            for (const tc of chunk.message.tool_calls) {
              const toolStep = makeStep(
                "tool-call",
                `Tool → ${tc.function.name}`,
                `args: ${JSON.stringify(tc.function.arguments)}`,
                "active"
              );
              updateSteps([...currentSteps, toolStep]);

              const result = await executeTool(tc.function.name, tc.function.arguments || {});

              const doneToolStep: ProcessStep = { ...toolStep, content: result, status: "done" };
              updateSteps(currentSteps.map((s) => s.id === toolStep.id ? doneToolStep : s));
            }
            continue;
          }

          if (chunk.message?.content) {
            rawContent += chunk.message.content;
          }

          // Parse thinking from raw stream
          const parsed = parseStreamingThinking(rawContent);

          if (parsed.state === "streaming") {
            // Thinking is actively streaming — add/update thinking step
            if (!thinkingStepId) {
              const thinkStep = makeStep("thinking", "Thinking...", parsed.thinkingContent, "active");
              thinkingStepId = thinkStep.id;
              updateSteps([...currentSteps, thinkStep]);
            } else {
              updateSteps(
                currentSteps.map((s) =>
                  s.id === thinkingStepId
                    ? { ...s, content: parsed.thinkingContent, status: "active" }
                    : s
                )
              );
            }
            // No response content yet
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: "",
              isStreaming: true,
            });
          } else if (parsed.state === "done") {
            // Thinking done — mark it complete, show response
            if (thinkingStepId) {
              updateSteps(
                currentSteps.map((s) =>
                  s.id === thinkingStepId
                    ? { ...s, content: parsed.thinkingContent, status: "done", label: "Thinking" }
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
            // No thinking — direct response
            updateMessage(currentSessionId, assistantMsgId, {
              steps: currentSteps,
              content: parsed.responseContent || rawContent,
              isStreaming: !chunk.done,
            });
          }

          if (chunk.done) break;
        }

        // Finalize
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

        // Auto-title on first message
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
