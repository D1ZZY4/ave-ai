import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import type { ToolCallResult } from "../store/chat";

interface ToolCallBlockProps {
  toolCalls: ToolCallResult[];
}

export function ToolCallBlock({ toolCalls }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[hsl(260_18%_22%)] bg-[hsl(260_20%_14%)] text-[hsl(265_15%_55%)] hover:text-purple-300 transition-all"
      >
        <Wrench size={12} />
        <span>{toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""} used</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 slide-up">
          {toolCalls.map((tc, i) => (
            <div
              key={i}
              className="px-3 py-2.5 rounded-xl border border-[hsl(260_18%_20%)] bg-[hsl(258_25%_8%)]"
            >
              <div className="text-xs font-mono text-purple-400 mb-1">{tc.toolName}</div>
              <div className="text-xs text-[hsl(265_15%_55%)] font-mono">
                args: {JSON.stringify(tc.args)}
              </div>
              <div className="mt-1.5 text-xs text-[hsl(270_20%_80%)]">{tc.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
