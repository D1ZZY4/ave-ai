import { X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_TOOLS } from "../tools/index";
import { useSettings } from "../store/settings";
import { Switch } from "@/components/ui/switch";

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
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)]">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Tools</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-1.5">
          {/* Master toggle */}
          <div className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_14%)]">
            <div>
              <div className="text-[12px] font-semibold text-[hsl(270_20%_88%)]">Enable all tools</div>
              <div className="text-[10px] text-[hsl(265_15%_42%)] mt-0.5">Let the model call tools automatically</div>
            </div>
            <Switch
              checked={settings.enableTools}
              onCheckedChange={(v) => updateSettings({ enableTools: v })}
              className="data-[state=checked]:bg-purple-600 scale-90"
            />
          </div>

          {/* Tool list */}
          {ALL_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "px-3.5 py-3 rounded-2xl border transition-all",
                settings.enableTools
                  ? "border-[hsl(260_18%_16%)] bg-[hsl(258_25%_7%)]"
                  : "border-[hsl(260_18%_13%)] bg-[hsl(258_25%_6%)] opacity-40"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[hsl(260_20%_13%)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wrench size={13} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[hsl(270_20%_85%)]">{tool.name}</div>
                  <div className="text-[10px] text-[hsl(265_15%_42%)] mt-0.5">{tool.description}</div>
                  <div className="text-[9px] text-[hsl(265_15%_32%)] font-mono mt-1">
                    {tool.ollamaTool.function.name}()
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <p className="text-[10px] text-[hsl(265_15%_34%)] text-center">
            Tools extend the AI's capabilities. Requires model support.
          </p>
        </div>
      </div>
    </div>
  );
}
