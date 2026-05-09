/**
 * Diagram 16: Thinking Box — real-time streaming display of model reasoning.
 * Shows <think>...</think> content with typewriter cursor while streaming.
 * Collapsible with smooth animation, independent of the process log toggle.
 */
import { useState, useEffect, useRef } from "react";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBoxProps {
  content: string;
  isActive: boolean;
  defaultExpanded?: boolean;
}

export function ThinkingBox({ content, isActive, defaultExpanded = true }: ThinkingBoxProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isActive, expanded]);

  if (!content) return null;

  const preview = content.slice(0, 60).replace(/\n/g, " ").trim();

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden mb-2 transition-all",
      isActive
        ? "border-purple-700/50 bg-[hsl(260_30%_7%)]"
        : "border-[hsl(260_18%_15%)] bg-[hsl(258_25%_6%)]"
    )}>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className={cn(
          "flex-shrink-0",
          isActive ? "text-purple-400" : "text-[hsl(265_30%_42%)]"
        )}>
          <Brain size={12} />
        </span>

        <span className={cn(
          "flex-1 text-[10px] font-semibold uppercase tracking-wider",
          isActive ? "text-purple-300" : "text-[hsl(265_25%_48%)]"
        )}>
          {isActive ? "Thinking..." : "Thinking"}
          {isActive && (
            <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-purple-500 thinking-active" />
          )}
        </span>

        {!expanded && !isActive && (
          <span className="text-[9px] text-[hsl(265_15%_35%)] truncate max-w-[120px] mr-1 italic">
            {preview}
          </span>
        )}

        <span className="text-[hsl(265_15%_40%)] flex-shrink-0">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="px-3 pb-3 pt-0 max-h-52 overflow-y-auto scrollbar-hide"
        >
          <div className={cn(
            "text-[10px] leading-relaxed font-mono whitespace-pre-wrap",
            "border-l-2 border-[hsl(270_30%_22%)] pl-3",
            isActive ? "text-[hsl(265_20%_58%)]" : "text-[hsl(265_15%_48%)]"
          )}>
            {content}
            {isActive && (
              <span className="inline-block w-[2px] h-[0.9em] bg-purple-400 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
