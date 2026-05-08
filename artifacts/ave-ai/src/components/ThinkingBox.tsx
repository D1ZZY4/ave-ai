import { useThinking } from "../hooks/useThinking";
import { Brain, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";

export function ThinkingBox() {
  const { thinkingSteps, isThinking, iterationCount, tokenCount } = useThinking();
  const [expanded, setExpanded] = useState(true);

  if (thinkingSteps.length === 0 && !isThinking) return null;

  return (
    <div className="mx-3 mb-2 rounded-xl border border-purple-900/30 bg-[hsl(258_30%_8%)] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-purple-900/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <Loader2 size={13} className="text-purple-400 animate-spin" />
          ) : (
            <Brain size={13} className="text-purple-400" />
          )}
          <span className="text-[11px] font-medium text-purple-300 uppercase tracking-wider">
            {isThinking ? "Thinking..." : `Reasoning (${thinkingSteps.length} steps)`}
          </span>
          {iterationCount > 0 && (
            <span className="text-[9px] text-purple-500 bg-purple-900/30 rounded-full px-1.5 py-0.5">
              iter {iterationCount}
            </span>
          )}
          {tokenCount > 0 && (
            <span className="text-[9px] text-purple-500/70">
              ~{tokenCount.toLocaleString()} tok
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={12} className="text-purple-500" /> : <ChevronDown size={12} className="text-purple-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {thinkingSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="rounded-lg bg-[hsl(258_25%_11%)] p-2.5 space-y-1"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono text-purple-500 bg-purple-900/20 rounded px-1">
                  #{step.stepNumber}
                </span>
                {step.action && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-900/20 rounded px-1">
                    {step.action}
                  </span>
                )}
              </div>

              {step.thought && (
                <div>
                  <span className="text-[9px] text-purple-500 uppercase tracking-wider">Thought</span>
                  <p className="text-[11px] text-purple-200/80 mt-0.5 leading-relaxed whitespace-pre-wrap">
                    {step.thought}
                  </p>
                </div>
              )}

              {step.actionInput && (
                <div>
                  <span className="text-[9px] text-amber-500 uppercase tracking-wider">Input</span>
                  <pre className="text-[10px] text-amber-200/70 mt-0.5 font-mono overflow-x-auto">
                    {JSON.stringify(step.actionInput, null, 2)}
                  </pre>
                </div>
              )}

              {step.observation && (
                <div>
                  <span className="text-[9px] text-green-500 uppercase tracking-wider">Observation</span>
                  <p className="text-[11px] text-green-200/70 mt-0.5 leading-relaxed whitespace-pre-wrap">
                    {step.observation}
                  </p>
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Loader2 size={10} className="text-purple-400 animate-spin" />
              <span className="text-[10px] text-purple-400/60 animate-pulse">Processing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
