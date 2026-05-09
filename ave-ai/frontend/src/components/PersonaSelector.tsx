import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bot, Sparkles, Terminal, Shield, Eye, Flame, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { ALL_PERSONAS } from "../personas/index";

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  "ave-prime": <Bot size={14} />,
  muse: <Sparkles size={14} />,
  architect: <Terminal size={14} />,
  diplomat: <Shield size={14} />,
  sage: <Eye size={14} />,
  maverick: <Flame size={14} />,
  mentor: <GraduationCap size={14} />,
};

const PERSONA_ACCENT: Record<string, string> = {
  "ave-prime": "bg-purple-600",
  muse: "bg-pink-600",
  architect: "bg-blue-600",
  diplomat: "bg-teal-600",
  sage: "bg-amber-600",
  maverick: "bg-orange-600",
  mentor: "bg-green-600",
};

export function PersonaSelector() {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ALL_PERSONAS.find((p) => p.id === settings.selectedPersona) ?? ALL_PERSONAS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const short = current.name.length > 9 ? current.name.slice(0, 8) + "…" : current.name;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all",
          "border-[hsl(260_18%_19%)] bg-[hsl(258_25%_10%)] text-[hsl(270_20%_82%)]",
          "hover:border-[hsl(260_18%_26%)]"
        )}
      >
        <span className="text-purple-400"><Bot size={12} /></span>
        <span className="uppercase tracking-wide">{short}</span>
        <ChevronDown size={10} className="text-[hsl(265_15%_45%)]" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-60 rounded-2xl border border-[hsl(260_18%_17%)] bg-[hsl(258_28%_8%)] shadow-2xl z-50 overflow-hidden slide-up">
          <div className="px-3.5 py-2 border-b border-[hsl(260_18%_13%)]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_40%)]">Persona</span>
          </div>

          <div className="py-1 max-h-80 overflow-y-auto scrollbar-hide">
            {ALL_PERSONAS.map((persona) => {
              const isActive = persona.id === current.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => { updateSettings({ selectedPersona: persona.id }); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors text-left",
                    isActive ? "bg-[hsl(260_20%_13%)]" : "hover:bg-[hsl(260_20%_11%)]"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-white",
                    isActive ? PERSONA_ACCENT[persona.id] || "bg-purple-600" : "bg-[hsl(260_20%_14%)] text-[hsl(265_15%_50%)]"
                  )}>
                    {PERSONA_ICONS[persona.id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-[12px] font-semibold",
                      isActive ? "text-purple-300" : "text-[hsl(270_20%_85%)]"
                    )}>
                      {persona.name}
                    </div>
                    <div className="text-[10px] text-[hsl(265_15%_42%)] truncate leading-tight mt-0.5">
                      {persona.description}
                    </div>
                  </div>
                  {isActive && (
                    <svg className="text-purple-400 flex-shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
