import { X, Zap, Code2, List, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_SKILLS } from "../skills/index";

const SKILL_ICONS: Record<string, React.ReactNode> = {
  general: <Zap size={18} />,
  developer: <Code2 size={18} />,
  summary: <List size={18} />,
  prd: <Sparkles size={18} />,
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
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)]">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Skills</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-1.5">
          {ALL_SKILLS.map((skill) => (
            <button
              key={skill.id}
              onClick={() => { onSelect(skill.id); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all",
                skill.id === selectedSkill
                  ? "bg-[hsl(270_55%_16%/0.7)] border border-[hsl(270_45%_32%/0.5)]"
                  : "bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_14%)] hover:border-[hsl(260_18%_20%)]"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                skill.id === selectedSkill ? "bg-purple-600 text-white" : "bg-[hsl(260_20%_13%)] text-[hsl(265_15%_48%)]"
              )}>
                {SKILL_ICONS[skill.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[12px] font-semibold",
                  skill.id === selectedSkill ? "text-purple-300" : "text-[hsl(270_20%_88%)]"
                )}>
                  {skill.name}
                </div>
                <div className="text-[10px] text-[hsl(265_15%_42%)] mt-0.5 leading-snug">{skill.description}</div>
              </div>
              {skill.id === selectedSkill && <Check size={14} className="text-purple-400 flex-shrink-0" />}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <p className="text-[10px] text-[hsl(265_15%_34%)] text-center">
            Skills shape the AI's focus and system behavior for each conversation
          </p>
        </div>
      </div>
    </div>
  );
}
