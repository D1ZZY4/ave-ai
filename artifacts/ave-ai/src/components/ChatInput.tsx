import { useState, useRef, useCallback } from "react";
import {
  Send, Square, Plus, Brain, Globe, Zap, ChevronDown,
  Sparkles, Code2, List, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { ALL_SKILLS } from "../skills/index";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  general: <Zap size={12} />,
  developer: <Code2 size={12} />,
  summary: <List size={12} />,
  prd: <Sparkles size={12} />,
};

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  selectedSkill: string;
  onSkillChange: (id: string) => void;
  placeholder?: string;
}

export function ChatInput({
  onSend, onStop, isStreaming, selectedSkill, onSkillChange,
  placeholder = "Describe your vision...",
}: ChatInputProps) {
  const { settings, updateSettings } = useSettings();
  const [value, setValue] = useState("");
  const [showSkills, setShowSkills] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }
  };

  const currentSkill = ALL_SKILLS.find((s) => s.id === selectedSkill) || ALL_SKILLS[0];
  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="relative px-3 pb-3 pt-1.5">
      {/* Skills dropdown */}
      {showSkills && (
        <div className="absolute bottom-full left-4 mb-1.5 w-44 rounded-2xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-xl overflow-hidden z-50 slide-up">
          {ALL_SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => { onSkillChange(skill.id); setShowSkills(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                skill.id === selectedSkill
                  ? "bg-[hsl(270_60%_20%/0.5)] text-purple-300"
                  : "text-[hsl(270_20%_80%)] hover:bg-[hsl(260_20%_13%)]"
              )}
            >
              <span className={cn("flex-shrink-0", skill.id === selectedSkill ? "text-purple-400" : "text-[hsl(265_15%_48%)]")}>
                {SKILL_ICONS[skill.id]}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">{skill.name}</span>
              {skill.id === selectedSkill && (
                <svg className="ml-auto text-purple-400 flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[hsl(260_18%_20%)] bg-[hsl(258_25%_10%)] overflow-hidden">
        {/* Toggle row */}
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5">
          <button
            onClick={() => updateSettings({ enableThinking: !settings.enableThinking })}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
              settings.enableThinking
                ? "bg-[hsl(270_60%_20%/0.6)] text-purple-300 border border-[hsl(270_50%_38%/0.4)]"
                : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
            )}
          >
            <Brain size={11} />
            Think
          </button>
          <button
            onClick={() => updateSettings({ enableTools: !settings.enableTools })}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
              settings.enableTools
                ? "bg-[hsl(270_60%_20%/0.6)] text-purple-300 border border-[hsl(270_50%_38%/0.4)]"
                : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
            )}
          >
            <Globe size={11} />
            Tools
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent px-3.5 py-2 text-[13px] text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_35%)] resize-none outline-none scrollbar-hide"
          style={{ minHeight: "36px", maxHeight: "140px" }}
        />

        {/* Bottom row */}
        <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <button className="p-1 rounded-lg text-[hsl(265_15%_40%)] hover:text-purple-300 transition-colors">
              <Plus size={15} />
            </button>
            <button
              onClick={() => setShowSkills((p) => !p)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                showSkills
                  ? "bg-[hsl(270_60%_20%/0.5)] text-purple-300"
                  : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
              )}
            >
              {SKILL_ICONS[currentSkill.id]}
              <span className="ml-0.5">{currentSkill.name}</span>
              <ChevronDown size={10} />
            </button>
          </div>

          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-7 h-7 rounded-full bg-[hsl(260_20%_16%)] border border-[hsl(260_18%_22%)] flex items-center justify-center text-[hsl(265_15%_55%)] hover:text-white transition-colors"
            >
              <Square size={12} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                canSend
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-[hsl(260_20%_13%)] text-[hsl(265_15%_30%)] cursor-not-allowed"
              )}
            >
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
