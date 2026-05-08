import { X, Wrench, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_TOOLS } from "../lib/tools";
import { useSettings } from "../store/settings";

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolsModal({ isOpen, onClose }: ToolsModalProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_18%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(260_18%_14%)]">
          <h2 className="text-base font-semibold text-[hsl(270_20%_92%)]">Tools</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(265_15%_45%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-2">
          {/* Enable tools toggle */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border",
              "border-[hsl(260_18%_18%)] bg-[hsl(258_25%_8%)]"
            )}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-[hsl(270_20%_92%)]">Enable AI Tools</div>
              <div className="text-xs text-[hsl(265_15%_45%)] mt-0.5">
                Let the model use tools when needed
              </div>
            </div>
            <button onClick={() => updateSettings({ enableTools: !settings.enableTools })}>
              {settings.enableTools ? (
                <ToggleRight size={28} className="text-purple-400" />
              ) : (
                <ToggleLeft size={28} className="text-[hsl(265_15%_40%)]" />
              )}
            </button>
          </div>

          {/* Tool list */}
          {AVAILABLE_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "px-4 py-4 rounded-2xl border transition-all",
                settings.enableTools
                  ? "border-[hsl(260_18%_18%)] bg-[hsl(258_25%_8%)]"
                  : "border-[hsl(260_18%_15%)] bg-[hsl(258_25%_7%)] opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[hsl(260_20%_14%)] flex items-center justify-center flex-shrink-0">
                  <Wrench size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[hsl(270_20%_92%)]">{tool.name}</div>
                  <div className="text-xs text-[hsl(265_15%_45%)] mt-0.5">{tool.description}</div>
                  <div className="text-[10px] text-[hsl(265_15%_38%)] font-mono mt-1.5">
                    {tool.ollamaTool.function.name}()
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] text-[hsl(265_15%_38%)] text-center">
            Tools extend the AI's capabilities. Requires model support.
          </p>
        </div>
      </div>
    </div>
  );
}
