import { useState } from "react";
import { ChevronDown, ChevronRight, Brain, Zap, User, Cpu, Wrench, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessStep } from "../store/chat";

const STEP_ICONS: Record<string, React.ReactNode> = {
  skill: <Sparkles size={10} />,
  persona: <User size={10} />,
  mode: <Zap size={10} />,
  rules: <BookOpen size={10} />,
  thinking: <Brain size={10} />,
  "tool-call": <Wrench size={10} />,
  response: <Cpu size={10} />,
};

interface StepRowProps {
  step: ProcessStep;
  showThinking: boolean;
}

function StepRow({ step, showThinking }: StepRowProps) {
  const [expanded, setExpanded] = useState(step.type === "thinking");
  const isThinking = step.type === "thinking";
  const isActive = step.status === "active";
  const hasExpandable = isThinking && !!step.content;

  if (isThinking && !showThinking) return null;

  return (
    <div className={cn("overflow-hidden", isThinking && "rounded-xl border border-[hsl(260_18%_17%)]")}>
      <button
        onClick={() => hasExpandable && setExpanded((p) => !p)}
        className={cn(
          "w-full flex items-center gap-2 text-left px-2 py-1.5 transition-colors",
          isThinking ? "bg-[hsl(258_25%_8%)]" : "rounded-lg",
          hasExpandable ? "cursor-pointer" : "cursor-default"
        )}
      >
        <span className={cn(
          "flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center",
          isActive ? "text-purple-400" : isThinking ? "text-[hsl(265_30%_50%)]" : "text-[hsl(265_15%_35%)]"
        )}>
          {STEP_ICONS[step.type]}
        </span>

        <span className={cn(
          "flex-1 text-[10px] font-medium",
          isActive
            ? isThinking ? "text-purple-300 thinking-active" : "text-[hsl(270_20%_75%)]"
            : isThinking ? "text-[hsl(265_25%_55%)]" : "text-[hsl(265_15%_40%)]"
        )}>
          {step.label}
        </span>

        {/* Meta for non-thinking steps */}
        {!isThinking && step.content && (
          <span className="text-[9px] text-[hsl(265_15%_30%)] truncate max-w-[90px] flex-shrink-0">
            {step.content}
          </span>
        )}

        {/* Thinking expand toggle */}
        {hasExpandable && (
          <span className="text-[hsl(265_15%_38%)] flex-shrink-0 ml-0.5">
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}

        {/* Active pulse */}
        {isActive && (
          <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0 thinking-active" />
        )}
      </button>

      {/* Thinking content */}
      {isThinking && expanded && step.content && (
        <div className="px-3 pb-2.5 pt-0.5">
          <div className="text-[10px] leading-relaxed text-[hsl(265_15%_52%)] whitespace-pre-wrap max-h-44 overflow-y-auto scrollbar-hide font-mono border-l border-[hsl(270_30%_22%)] pl-2.5">
            {step.content}
          </div>
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
  const [collapsed, setCollapsed] = useState(false);

  if (!steps || steps.length === 0) return null;

  const prepSteps = steps.filter((s) => s.type !== "thinking" && s.type !== "tool-call");
  const thinkingStep = steps.find((s) => s.type === "thinking");
  const toolSteps = steps.filter((s) => s.type === "tool-call");
  const isAnyActive = steps.some((s) => s.status === "active");

  const showPrep = showProcessLog && prepSteps.length > 0;
  const showThink = showThinking && !!thinkingStep;
  const showTools = toolSteps.length > 0;

  if (!showPrep && !showThink && !showTools) return null;

  return (
    <div className="mb-3">
      {/* Collapsible header */}
      {(showPrep || showTools) && (
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_33%)] hover:text-[hsl(265_15%_50%)] transition-colors mb-1 px-0.5"
        >
          {collapsed ? <ChevronRight size={9} /> : <ChevronDown size={9} />}
          <span>Process</span>
          {isAnyActive && <span className="w-1 h-1 rounded-full bg-purple-500 ml-0.5 thinking-active" />}
        </button>
      )}

      {!collapsed && (
        <div className="space-y-0.5">
          {/* Prep steps */}
          {showPrep && prepSteps.map((s) => (
            <StepRow key={s.id} step={s} showThinking={showThinking} />
          ))}

          {/* Tool calls */}
          {showTools && toolSteps.map((s) => (
            <StepRow key={s.id} step={s} showThinking={showThinking} />
          ))}
        </div>
      )}

      {/* Thinking — always visible when active, independent of process log */}
      {showThink && thinkingStep && (
        <div className={cn(showPrep || showTools ? "mt-1.5" : "")}>
          <StepRow step={thinkingStep} showThinking={showThinking} />
        </div>
      )}
    </div>
  );
}
