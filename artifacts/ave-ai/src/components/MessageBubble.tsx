import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Message } from "../store/chat";
import { ActivityLog } from "./ActivityLog";
import { ChoiceCards } from "./ChoiceCards";
import { QuestionForm } from "./QuestionForm";
import { parseResponse } from "../helpers/parse-response";
import { useSettings } from "../store/settings";
import { cn } from "@/lib/utils";

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
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function Prose({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  if (!content.trim()) return null;
  return (
    <div className={cn("prose prose-sm max-w-none", isStreaming && "typing-cursor")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!match) {
              return (
                <code className="bg-[hsl(260_20%_14%)] px-1.5 py-0.5 rounded text-purple-300 text-[0.8em]" {...props}>
                  {children}
                </code>
              );
            }
            const codeStr = String(children).replace(/\n$/, "");
            return (
              <div className="relative group my-2">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <CopyButton text={codeStr} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(260 18% 18%)",
                    background: "hsl(258 30% 6%)",
                    fontSize: "0.78rem",
                    lineHeight: "1.6",
                  }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0 text-[13px] leading-relaxed text-[hsl(270_20%_88%)]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-2 pl-4 space-y-0.5 text-[13px] text-[hsl(270_20%_88%)]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-2 pl-4 space-y-0.5 text-[13px] text-[hsl(270_20%_88%)]">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-base font-bold text-[hsl(270_20%_95%)] mb-2 mt-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-sm font-bold text-[hsl(270_20%_95%)] mb-1.5 mt-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-[13px] font-semibold text-[hsl(270_20%_92%)] mb-1 mt-2">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-purple-600 pl-3 my-2 text-[hsl(265_15%_55%)] italic text-[13px]">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="text-[12px] border-collapse w-full">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border border-[hsl(260_18%_20%)] px-2.5 py-1.5 text-left font-semibold text-[hsl(270_20%_90%)] bg-[hsl(260_20%_12%)]">{children}</th>;
          },
          td({ children }) {
            return <td className="border border-[hsl(260_18%_18%)] px-2.5 py-1.5 text-[hsl(270_20%_82%)]">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onSend: (content: string) => void;
  isLastMessage: boolean;
  globalStreaming: boolean;
}

export function MessageBubble({ message, onSend, isLastMessage, globalStreaming }: MessageBubbleProps) {
  const { settings } = useSettings();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3 msg-appear">
        <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-[hsl(260_22%_15%)] border border-[hsl(260_18%_22%)] text-[hsl(270_20%_90%)] text-[13px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const isStreaming = !!message.isStreaming;
  const hasContent = !!message.content;
  const isGenerating = isStreaming && !hasContent;

  // Parse only the last AI message, only after it finishes streaming
  const canParse = isLastMessage && !isStreaming && hasContent;
  const parsed = canParse ? parseResponse(message.content) : null;
  const hasBlock = parsed && parsed.blockType !== "none";

  return (
    <div className="mb-4 msg-appear">
      {/* Activity log */}
      {message.steps && message.steps.length > 0 && (
        <ActivityLog
          steps={message.steps}
          showThinking={settings.showThinking}
          showProcessLog={settings.showProcessLog}
        />
      )}

      {hasContent ? (
        hasBlock ? (
          /* ── Parsed: prose + interactive block + optional after-text ── */
          <>
            {parsed!.prose && <Prose content={parsed!.prose} />}

            {(parsed!.blockType === "choices" || parsed!.blockType === "confirm") && (
              <ChoiceCards
                choices={parsed!.choices}
                onSelect={onSend}
                disabled={globalStreaming}
                type={parsed!.blockType}
              />
            )}

            {parsed!.blockType === "questions" && (
              <QuestionForm
                prose={parsed!.prose}
                questions={parsed!.questions}
                onSubmit={onSend}
                disabled={globalStreaming}
              />
            )}

            {/* After-text: model's closing line after the list */}
            {parsed!.afterText && (
              <div className="mt-2">
                <Prose content={parsed!.afterText} />
              </div>
            )}
          </>
        ) : (
          /* ── Plain markdown response ── */
          <Prose content={message.content} isStreaming={isStreaming} />
        )
      ) : isGenerating ? (
        <div className="flex gap-1 py-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-500"
              style={{ animation: `blink 1.2s ease ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
