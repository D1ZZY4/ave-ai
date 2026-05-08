import { useThinking } from "../hooks/useThinking";
import { useSessionStore } from "../store/session";
import { Brain, ChevronDown, ChevronUp, Loader2, Zap, Archive } from "lucide-react";
import { useState } from "react";

export function ThinkingBox() {
  const { thinkingSteps, isThinking, iterationCount, tokenCount } = useThinking();
  const status = useSessionStore((s) => s.status);
  const [expanded, setExpanded] = useState(true);

  const isCompressing = status === "compressing";

  if (thinkingSteps.length === 0 && !isThinking && !isCompressing) return null;

  const isExpertMode = thinkingSteps.some((s) => s.action);
  const isFastThinking = thinkingSteps.length > 0 && !isExpertMode;

  return (
    <div className="mx-3 mb-2 rounded-xl border border-purple-900/30 bg-[hsl(258_30%_8%)] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-purple-900/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCompressing ? (
            <Archive size={13} className="text-amber-400 animate-pulse" />
          ) : isThinking ? (
            <Loader2 size={13} className="text-purple-400 animate-spin" />
          ) : isFastThinking ? (
            <Zap size={13} className="text-blue-400" />
          ) : (
            <Brain size={13} className="text-purple-400" />
          )}

          <span className="text-[11px] font-medium text-purple-300 uppercase tracking-wider">
            {isCompressing
              ? "Compressing memory..."
              : isThinking
              ? "Thinking..."
              : isFastThinking
              ? `Internal reasoning (${thinkingSteps.length})`
              : `Reasoning (${thinkingSteps.length} steps)`}
          </span>

          {iterationCount > 0 && !isFastThinking && (
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
        {expanded ? (
          <ChevronUp size={12} className="text-purple-500" />
        ) : (
          <ChevronDown size={12} className="text-purple-500" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {isCompressing && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-amber-900/10 border border-amber-900/20">
              <Archive size={10} className="text-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-300/70">
                Summarizing old history to free token budget...
              </span>
            </div>
          )}

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
                    {step.execType && (
                      <span className="ml-1 opacity-50">({step.execType})</span>
                    )}
                  </span>
                )}
                {isFastThinking && (
                  <span className="text-[9px] text-blue-400 bg-blue-900/20 rounded px-1">
                    fast-think
                  </span>
                )}
              </div>

              {step.thought && (
                <div>
                  <span className="text-[9px] text-purple-500 uppercase tracking-wider">
                    Thought
                  </span>
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
                  <span className="text-[9px] text-green-500 uppercase tracking-wider">
                    Observation
                  </span>
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
