import { useEffect, useRef } from "react";
import type { Message } from "../store/chat";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  onSend: (content: string) => void;
  onRetry?: (lastUserContent: string) => void;
  onEdit?: (msgId: string, newContent: string) => void;
}

export function MessageList({ messages, onSend, onRetry, onEdit }: MessageListProps) {
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
          <MessageBubble
            key={msg.id}
            message={msg}
            onSend={onSend}
            isLastMessage={msg.id === lastMsgId}
            isLastUserMessage={msg.id === lastUserMsg?.id}
            globalStreaming={isAnyStreaming}
            onRetry={msg.id === lastAssistantMsg?.id ? handleRetry : undefined}
            onEdit={onEdit ? (content) => onEdit(msg.id, content) : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
