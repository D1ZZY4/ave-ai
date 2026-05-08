import { useRef, useCallback } from "react";
import { useChat as useChatStore } from "../store/chat";
import { useSettings } from "../store/settings";
import { streamChat, parseThinking, type OllamaMessage } from "../lib/ollama";
import { getSkill } from "../lib/skills";
import { getPersona } from "../lib/personas";
import { AVAILABLE_TOOLS, executeTool } from "../lib/tools";

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
        createSession(
          settings.selectedModel,
          settings.selectedPersona,
          "general"
        );

      const currentSession = activeSession;
      const skill = getSkill(currentSession?.skill || "general");
      const persona = getPersona(settings.selectedPersona);

      // Add user message
      addMessage(currentSessionId, {
        role: "user",
        content: userContent,
        isStreaming: false,
      });

      // Build system prompt
      const systemPrompt = `${skill.systemPrompt}\n\n${persona.systemAddition}`;

      // Build message history for Ollama
      const allMessages = currentSession?.messages || [];
      const ollamaMessages: OllamaMessage[] = [
        { role: "system", content: systemPrompt },
        ...allMessages
          .filter((m) => m.role !== "tool" && !m.isStreaming)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        { role: "user", content: userContent },
      ];

      // Add placeholder assistant message
      const assistantMsgId = addMessage(currentSessionId, {
        role: "assistant",
        content: "",
        thinking: "",
        isStreaming: true,
        isThinking: false,
        model: settings.selectedModel,
      });

      abortRef.current = new AbortController();

      try {
        const tools =
          settings.enableTools
            ? AVAILABLE_TOOLS.map((t) => t.ollamaTool)
            : undefined;

        let fullContent = "";
        let isDone = false;

        const gen = streamChat(
          settings.baseUrl,
          settings.selectedModel,
          ollamaMessages,
          tools,
          abortRef.current.signal
        );

        for await (const chunk of gen) {
          if (chunk.message?.tool_calls && chunk.message.tool_calls.length > 0) {
            // Handle tool calls
            const toolCallResults = [];
            for (const tc of chunk.message.tool_calls) {
              const result = await executeTool(
                tc.function.name,
                tc.function.arguments || {}
              );
              toolCallResults.push({
                toolName: tc.function.name,
                args: tc.function.arguments || {},
                result,
              });
            }
            updateMessage(currentSessionId, assistantMsgId, {
              toolCalls: toolCallResults,
              isStreaming: false,
            });
            isDone = true;
            break;
          }

          if (chunk.message?.content) {
            fullContent += chunk.message.content;
            const { thinking, response } = parseThinking(fullContent);
            updateMessage(currentSessionId, assistantMsgId, {
              content: response || fullContent,
              thinking,
              isThinking: !chunk.done && thinking !== "" && response === "",
              isStreaming: !chunk.done,
            });
          }

          if (chunk.done) {
            isDone = true;
            break;
          }
        }

        if (!isDone) {
          const { thinking, response } = parseThinking(fullContent);
          updateMessage(currentSessionId, assistantMsgId, {
            content: response || fullContent,
            thinking,
            isStreaming: false,
            isThinking: false,
          });
        } else if (!fullContent) {
          // Tool call path - already updated
        } else {
          const { thinking, response } = parseThinking(fullContent);
          updateMessage(currentSessionId, assistantMsgId, {
            content: response || fullContent,
            thinking,
            isStreaming: false,
            isThinking: false,
          });
        }

        // Auto-title after first exchange
        if (allMessages.length === 0) {
          const title = userContent.slice(0, 60).trim() || "New conversation";
          updateSessionTitle(currentSessionId, title);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          updateMessage(currentSessionId, assistantMsgId, {
            isStreaming: false,
            isThinking: false,
          });
        } else {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          updateMessage(currentSessionId, assistantMsgId, {
            content: `Error: ${errMsg}\n\nMake sure Ollama is running and the base URL is correct in Settings.`,
            isStreaming: false,
            isThinking: false,
          });
        }
      }
    },
    [
      settings,
      activeSessionId,
      activeSession,
      createSession,
      addMessage,
      updateMessage,
      updateSessionTitle,
    ]
  );

  return { sendMessage, stopGeneration };
}
