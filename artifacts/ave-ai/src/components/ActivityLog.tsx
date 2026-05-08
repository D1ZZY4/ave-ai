import { useState } from "react";
import { ChevronDown, ChevronRight, Brain, Zap, User, Cpu, Wrench, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessStep } from "../store/chat";

const STEP_ICONS: Record<string, React.ReactNode> = {
  skill: <Sparkles size={11} />,
  persona: <User size={11} />,
  mode: <Zap size={11} />,
  thinking: <Brain size={11} />,
  "tool-call": <Wrench size={11} />,
  response: <Cpu size={11} />,
};

function ThinkingContent({ content }: { content: string; isActive: boolean }) {
  return (
    <div className="mt-1.5 text-[11px] leading-relaxed text-[hsl(265_15%_58%)] whitespace-pre-wrap max-h-52 overflow-y-auto scrollbar-hide font-mono">
      {content}
    </div>
  );
}

function StepRow({ step, showThinking }: { step: ProcessStep; showThinking: boolean }) {
  const [expanded, setExpanded] = useState(step.type === "thinking");
  const isThinking = step.type === "thinking";
  const isActive = step.status === "active";
  const hasContent = !!step.content;

  if (isThinking && !showThinking) return null;

  return (
    <div className={cn("rounded-xl overflow-hidden transition-all", isThinking && "border border-[hsl(260_18%_18%)]")}>
      <button
        onClick={() => hasContent && setExpanded((p) => !p)}
        className={cn(
          "w-full flex items-center gap-2 text-left px-2.5 py-1.5 transition-colors",
          isThinking
            ? "bg-[hsl(258_25%_9%)]"
            : "hover:bg-[hsl(260_20%_12%/0.4)] rounded-lg",
          hasContent && isThinking ? "cursor-pointer" : isThinking ? "cursor-default" : "cursor-default"
        )}
      >
        {/* Status indicator */}
        <span
          className={cn(
            "flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full",
            isActive
              ? "text-purple-400"
              : isThinking
              ? "text-[hsl(265_30%_55%)]"
              : "text-[hsl(265_15%_40%)]"
          )}
        >
          {STEP_ICONS[step.type]}
        </span>

        {/* Label */}
        <span
          className={cn(
            "flex-1 text-[11px] font-medium",
            isActive
              ? isThinking ? "text-purple-300 thinking-active" : "text-[hsl(270_20%_80%)]"
              : isThinking
              ? "text-[hsl(265_30%_60%)]"
              : "text-[hsl(265_15%_45%)]"
          )}
        >
          {step.label}
        </span>

        {/* Meta info */}
        {!isThinking && step.content && (
          <span className="text-[10px] text-[hsl(265_15%_35%)] truncate max-w-[100px]">
            {step.content}
          </span>
        )}

        {/* Expand toggle for thinking */}
        {isThinking && hasContent && (
          <span className="text-[hsl(265_15%_40%)] ml-1">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        )}

        {/* Active pulse dot */}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 thinking-active" />
        )}
      </button>

      {/* Thinking content expanded */}
      {isThinking && expanded && step.content && (
        <div className="px-3 pb-2.5">
          <ThinkingContent content={step.content} isActive={isActive} />
        </div>
      )}
    </div>
  );
}

interface ActivityLogProps {
  steps: ProcessStep[];
  showThinking: boolean;
  showProcessLog: boolean;
}

export function ActivityLog({ steps, showThinking, showProcessLog }: ActivityLogProps) {
  const [logExpanded, setLogExpanded] = useState(true);

  if (!steps || steps.length === 0) return null;

  // Separate prep steps from thinking step
  const prepSteps = steps.filter((s) => s.type !== "thinking" && s.type !== "tool-call");
  const thinkingStep = steps.find((s) => s.type === "thinking");
  const toolSteps = steps.filter((s) => s.type === "tool-call");

  const hasThinking = !!thinkingStep;
  const hasTools = toolSteps.length > 0;
  const hasAnything = (showProcessLog && prepSteps.length > 0) || (showThinking && hasThinking) || hasTools;

  if (!hasAnything) return null;

  return (
    <div className="mb-3 space-y-0.5">
      {/* Process log toggle header */}
      {showProcessLog && prepSteps.length > 0 && (
        <button
          onClick={() => setLogExpanded((p) => !p)}
          className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_38%)] hover:text-[hsl(265_15%_55%)] transition-colors px-1 py-0.5 mb-1"
        >
          {logExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Process
        </button>
      )}

      {/* Prep steps */}
      {showProcessLog && logExpanded && (
        <div className="space-y-0.5 mb-1">
          {prepSteps.map((step) => (
            <StepRow key={step.id} step={step} showThinking={showThinking} />
          ))}
        </div>
      )}

      {/* Tool calls */}
      {hasTools && (
        <div className="space-y-0.5 mb-1">
          {toolSteps.map((step) => (
            <StepRow key={step.id} step={step} showThinking={showThinking} />
          ))}
        </div>
      )}

      {/* Thinking block — always visible when active regardless of process log setting */}
      {thinkingStep && showThinking && (
        <StepRow step={thinkingStep} showThinking={showThinking} />
      )}
    </div>
  );
}
