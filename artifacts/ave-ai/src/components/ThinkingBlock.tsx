import { useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  thinking: string;
  isActive?: boolean;
}

export function ThinkingBlock({ thinking, isActive }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  if (!thinking && !isActive) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all",
          "border border-[hsl(260_18%_22%)]",
          isActive
            ? "bg-[hsl(270_60%_22%/0.4)] text-purple-300 thinking-active"
            : "bg-[hsl(260_20%_14%)] text-[hsl(265_15%_55%)] hover:text-purple-300"
        )}
      >
        <Brain size={12} className={cn(isActive && "text-purple-400")} />
        <span>{isActive ? "Thinking..." : "Thinking"}</span>
        {!isActive && (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        )}
      </button>

      {!isActive && expanded && thinking && (
        <div className="mt-2 px-3 py-3 rounded-xl thinking-gradient border border-[hsl(260_18%_20%)] text-xs text-[hsl(265_15%_60%)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-hide slide-up">
          {thinking}
        </div>
      )}
    </div>
  );
}
