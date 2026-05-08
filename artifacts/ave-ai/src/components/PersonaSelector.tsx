import { useState, useRef, useEffect } from "react";
import { ChevronDown, Bot, Sparkles, Terminal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { PERSONAS } from "../lib/personas";

const PERSONA_ICONS: Record<string, React.ReactNode> = {
  "ave-prime": <Bot size={16} />,
  muse: <Sparkles size={16} />,
  architect: <Terminal size={16} />,
  diplomat: <Shield size={16} />,
};

export function PersonaSelector() {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = PERSONAS.find((p) => p.id === settings.selectedPersona) || PERSONAS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const shortName = current.name.length > 8 ? current.name.slice(0, 7) + "..." : current.name;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
          "border-[hsl(260_18%_20%)] bg-[hsl(258_25%_10%)] text-[hsl(270_20%_88%)]",
          "hover:border-[hsl(260_18%_28%)] hover:bg-[hsl(258_25%_13%)]"
        )}
      >
        <span className="text-purple-400">
          <Bot size={13} />
        </span>
        <span className="uppercase tracking-wide">Ave {shortName}</span>
        <ChevronDown size={12} className="text-[hsl(265_15%_50%)]" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-2xl z-50 overflow-hidden slide-up">
          <div className="px-4 py-2.5 border-b border-[hsl(260_18%_14%)]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_45%)]">
              Persona
            </span>
          </div>

          <div className="py-1">
            {PERSONAS.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  updateSettings({ selectedPersona: persona.id });
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                  persona.id === current.id
                    ? "bg-[hsl(260_20%_14%)]"
                    : "hover:bg-[hsl(260_20%_12%)]"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                    persona.id === current.id
                      ? "bg-purple-600 text-white"
                      : "bg-[hsl(260_20%_16%)] text-[hsl(265_15%_55%)]"
                  )}
                >
                  {PERSONA_ICONS[persona.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      persona.id === current.id
                        ? "text-purple-300"
                        : "text-[hsl(270_20%_88%)]"
                    )}
                  >
                    {persona.name}
                  </div>
                  <div className="text-[10px] text-[hsl(265_15%_45%)] uppercase tracking-wider truncate">
                    {persona.description}
                  </div>
                </div>
                {persona.id === current.id && (
                  <svg
                    className="text-purple-400 flex-shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
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
