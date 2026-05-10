import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "../store/chat";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  sessionId: string;
  onSend: (content: string, images?: string[]) => void;
  onRetry?: (lastUserContent: string) => void;
  onEdit?: (msgId: string, newContent: string) => void;
  highlightMsgId?: string;
}

export function MessageList({ messages, sessionId, onSend, onRetry, onEdit, highlightMsgId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastLen = useRef(0);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const shouldScroll =
      messages.length !== lastLen.current ||
      (last?.isStreaming && last.role === "assistant");

    if (shouldScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastLen.current = messages.length;
  }, [messages]);

  const isAnyStreaming = messages.some((m) => m.isStreaming);
  const lastMsgId = messages[messages.length - 1]?.id;

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && !m.isStreaming);

  const handleRetry = () => {
    if (lastUserMsg && onRetry) {
      onRetry(lastUserMsg.content);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-3 scrollbar-hide">
      <div className="max-w-xl mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            id={`msg-${msg.id}`}
            className={cn(
              "transition-all duration-500",
              highlightMsgId === msg.id && "ring-1 ring-purple-500/50 rounded-2xl bg-purple-900/10"
            )}
          >
            <MessageBubble
              message={msg}
              sessionId={sessionId}
              onSend={onSend}
              isLastMessage={msg.id === lastMsgId}
              isLastUserMessage={msg.id === lastUserMsg?.id}
              globalStreaming={isAnyStreaming}
              onRetry={msg.id === lastAssistantMsg?.id ? handleRetry : undefined}
              onEdit={onEdit ? (content) => onEdit(msg.id, content) : undefined}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
