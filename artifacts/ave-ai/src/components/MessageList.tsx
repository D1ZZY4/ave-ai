import { useEffect, useRef } from "react";
import type { Message } from "../store/chat";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
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

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-3 scrollbar-hide">
      <div className="max-w-xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
