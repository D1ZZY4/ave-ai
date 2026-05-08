import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bot, Sparkles, Terminal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { PERSONAS } from "../lib/personas";

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  "ave-prime": <Bot size={14} />,
  muse: <Sparkles size={14} />,
  architect: <Terminal size={14} />,
  diplomat: <Shield size={14} />,
};

export function PersonaSelector() {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERSONAS.find((p) => p.id === settings.selectedPersona) || PERSONAS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = `Ave ${current.name === "Ave Prime" ? "Prime" : current.name}`;
  const short = displayName.length > 12 ? displayName.slice(0, 11) + "…" : displayName;

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
        <div className="absolute top-full right-0 mt-1.5 w-56 rounded-2xl border border-[hsl(260_18%_17%)] bg-[hsl(258_28%_8%)] shadow-2xl z-50 overflow-hidden slide-up">
          <div className="px-3.5 py-2 border-b border-[hsl(260_18%_13%)]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_40%)]">Persona</span>
          </div>
          <div className="py-1">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => { updateSettings({ selectedPersona: persona.id }); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors text-left",
                  persona.id === current.id ? "bg-[hsl(260_20%_13%)]" : "hover:bg-[hsl(260_20%_11%)]"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0",
                  persona.id === current.id
                    ? "bg-purple-600 text-white"
                    : "bg-[hsl(260_20%_14%)] text-[hsl(265_15%_50%)]"
                )}>
                  {PERSONA_ICONS[persona.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-[12px] font-semibold",
                    persona.id === current.id ? "text-purple-300" : "text-[hsl(270_20%_85%)]"
                  )}>
                    {persona.name}
                  </div>
                  <div className="text-[10px] text-[hsl(265_15%_42%)] truncate leading-tight mt-0.5">
                    {persona.description}
                  </div>
                </div>
                {persona.id === current.id && (
                  <svg className="text-purple-400 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
