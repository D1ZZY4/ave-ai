import { X, Zap, Code2, List, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILT_IN_SKILLS } from "../lib/skills";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  general: <Zap size={20} />,
  developer: <Code2 size={20} />,
  summary: <List size={20} />,
  prd: <Sparkles size={20} />,
};

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkill: string;
  onSelect: (id: string) => void;
}

export function SkillsModal({ isOpen, onClose, selectedSkill, onSelect }: SkillsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_18%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(260_18%_14%)]">
          <h2 className="text-base font-semibold text-[hsl(270_20%_92%)]">Skills</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(265_15%_45%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-2">
          {BUILT_IN_SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => { onSelect(skill.id); onClose(); }}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all",
                skill.id === selectedSkill
                  ? "bg-[hsl(270_60%_18%/0.6)] border border-[hsl(270_50%_35%/0.4)]"
                  : "bg-[hsl(258_25%_8%)] border border-[hsl(260_18%_16%)] hover:border-[hsl(260_18%_22%)]"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                  skill.id === selectedSkill
                    ? "bg-purple-600 text-white"
                    : "bg-[hsl(260_20%_14%)] text-[hsl(265_15%_55%)]"
                )}
              >
                {SKILL_ICONS[skill.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "font-semibold text-sm",
                    skill.id === selectedSkill ? "text-purple-300" : "text-[hsl(270_20%_92%)]"
                  )}
                >
                  {skill.name}
                </div>
                <div className="text-xs text-[hsl(265_15%_45%)] mt-0.5">{skill.description}</div>
              </div>
              {skill.id === selectedSkill && (
                <Check size={16} className="text-purple-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] text-[hsl(265_15%_38%)] text-center">
            Skills set the AI's focus and system behavior for your conversation
          </p>
        </div>
      </div>
    </div>
  );
}
