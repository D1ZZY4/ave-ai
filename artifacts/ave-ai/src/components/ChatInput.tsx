import { useState, useRef, useCallback } from "react";
import {
  Send,
  Square,
  Plus,
  Brain,
  Globe,
  Zap,
  ChevronDown,
  Sparkles,
  Code2,
  List,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { BUILT_IN_SKILLS } from "../lib/skills";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  general: <Zap size={13} />,
  developer: <Code2 size={13} />,
  summary: <List size={13} />,
  prd: <Sparkles size={13} />,
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
  onSend,
  onStop,
  isStreaming,
  selectedSkill,
  onSkillChange,
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
      el.style.height = Math.min(el.scrollHeight, 180) + "px";
    }
  };

  const currentSkill = BUILT_IN_SKILLS.find((s) => s.id === selectedSkill) || BUILT_IN_SKILLS[0];
  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="relative px-3 pb-4 pt-2">
      {/* Skills dropdown */}
      {showSkills && (
        <div className="absolute bottom-full left-4 mb-2 w-52 rounded-2xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-xl overflow-hidden z-50 slide-up">
          {BUILT_IN_SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => {
                onSkillChange(skill.id);
                setShowSkills(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                skill.id === selectedSkill
                  ? "bg-[hsl(270_60%_22%/0.5)] text-purple-300"
                  : "text-[hsl(270_20%_88%)] hover:bg-[hsl(260_20%_14%)]"
              )}
            >
              <span className={cn("text-[hsl(265_15%_50%)]", skill.id === selectedSkill && "text-purple-400")}>
                {SKILL_ICONS[skill.id]}
              </span>
              <span className="text-sm font-medium uppercase tracking-wide">{skill.name}</span>
              {skill.id === selectedSkill && (
                <span className="ml-auto text-purple-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[hsl(260_18%_20%)] bg-[hsl(258_25%_10%)] overflow-hidden">
        {/* Toggle row */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <button
            onClick={() => updateSettings({ enableThinking: !settings.enableThinking })}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
              settings.enableThinking
                ? "bg-[hsl(270_60%_22%/0.6)] text-purple-300 border border-[hsl(270_50%_40%/0.4)]"
                : "text-[hsl(265_15%_50%)] hover:text-[hsl(265_15%_70%)]"
            )}
          >
            <Brain size={12} />
            Think
          </button>
          <button
            onClick={() => updateSettings({ enableSearch: !settings.enableSearch })}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
              settings.enableSearch
                ? "bg-[hsl(270_60%_22%/0.6)] text-purple-300 border border-[hsl(270_50%_40%/0.4)]"
                : "text-[hsl(265_15%_50%)] hover:text-[hsl(265_15%_70%)]"
            )}
          >
            <Globe size={12} />
            Search
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
          className="w-full bg-transparent px-4 py-2 text-sm text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_38%)] resize-none outline-none scrollbar-hide"
          style={{ minHeight: "40px", maxHeight: "180px" }}
        />

        {/* Bottom row */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full text-[hsl(265_15%_45%)] hover:text-purple-300 transition-colors">
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowSkills((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
                showSkills
                  ? "bg-[hsl(270_60%_22%/0.5)] text-purple-300"
                  : "text-[hsl(265_15%_50%)] hover:text-[hsl(265_15%_70%)]"
              )}
            >
              {SKILL_ICONS[currentSkill.id]}
              {currentSkill.name}
              <ChevronDown size={11} />
            </button>
          </div>

          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-full bg-[hsl(260_20%_18%)] border border-[hsl(260_18%_24%)] flex items-center justify-center text-[hsl(265_15%_60%)] hover:text-white transition-colors"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                canSend
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
                  : "bg-[hsl(260_20%_14%)] text-[hsl(265_15%_35%)] cursor-not-allowed"
              )}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
