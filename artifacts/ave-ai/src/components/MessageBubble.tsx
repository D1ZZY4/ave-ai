import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Message } from "../store/chat";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1 rounded hover:bg-[hsl(260_20%_18%)] text-[hsl(265_15%_50%)] hover:text-purple-300 transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 msg-appear">
        <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm bg-[hsl(260_20%_16%)] border border-[hsl(260_18%_22%)] text-[hsl(270_20%_92%)] text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const isEmpty = !message.content && !message.isThinking && !message.toolCalls?.length;

  return (
    <div className="mb-5 msg-appear">
      {/* Thinking block */}
      {(message.thinking || message.isThinking) && (
        <ThinkingBlock
          thinking={message.thinking || ""}
          isActive={message.isThinking}
        />
      )}

      {/* Tool calls */}
      {message.toolCalls && <ToolCallBlock toolCalls={message.toolCalls} />}

      {/* Response content */}
      {message.content ? (
        <div
          className={cn(
            "prose prose-sm max-w-none text-[hsl(270_20%_88%)]",
            message.isStreaming && !message.isThinking && "typing-cursor"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const inline = !match;
                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
                const codeStr = String(children).replace(/\n$/, "");
                return (
                  <div className="relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <CopyButton text={codeStr} />
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(260 18% 20%)",
                        background: "hsl(258 30% 6%)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {codeStr}
                    </SyntaxHighlighter>
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      ) : isEmpty ? (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
              style={{ animation: `blink 1.2s ease ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
