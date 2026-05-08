import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { useModels } from "../hooks/useModels";
import { Switch } from "@/components/ui/switch";

interface ModelSelectorProps {
  onClose?: () => void;
}

export function ModelSelector({ onClose }: ModelSelectorProps) {
  const { settings, updateSettings } = useSettings();
  const { models, loading, error, refetch } = useModels(settings.baseUrl);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (models.length > 0 && !settings.selectedModel) {
      updateSettings({ selectedModel: models[0].name });
    }
  }, [models, settings.selectedModel, updateSettings]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = settings.selectedModel
    ? settings.selectedModel.split(":")[0].split("/").pop() || settings.selectedModel
    : "No model";

  const shortDisplay = displayName.length > 10
    ? displayName.slice(0, 10) + "..."
    : displayName;

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
        <Cpu size={13} className="text-purple-400 flex-shrink-0" />
        <span className="uppercase tracking-wide">{shortDisplay}</span>
        <ChevronDown size={12} className="text-[hsl(265_15%_50%)]" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-2xl z-50 overflow-hidden slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[hsl(260_18%_14%)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_45%)]">
                Models
              </span>
              <button
                onClick={refetch}
                disabled={loading}
                className="p-1 rounded-lg text-[hsl(265_15%_45%)] hover:text-purple-300 transition-colors"
              >
                <RefreshCw size={12} className={cn(loading && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 flex items-start gap-2 text-xs text-red-400">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              <span>Cannot connect to Ollama. Check your base URL in settings.</span>
            </div>
          )}

          {/* Model list */}
          <div className="max-h-56 overflow-y-auto scrollbar-hide">
            {loading && !models.length ? (
              <div className="px-4 py-4 text-xs text-[hsl(265_15%_45%)] text-center">
                Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="px-4 py-4 text-xs text-[hsl(265_15%_45%)] text-center">
                No models found
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => {
                    updateSettings({ selectedModel: model.name });
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors",
                    model.name === settings.selectedModel
                      ? "bg-[hsl(260_20%_14%)]"
                      : "hover:bg-[hsl(260_20%_12%)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className={cn(
                          "text-sm font-medium",
                          model.name === settings.selectedModel
                            ? "text-purple-300"
                            : "text-[hsl(270_20%_88%)]"
                        )}
                      >
                        {model.name}
                      </div>
                      <div className="text-[10px] text-[hsl(265_15%_45%)] uppercase tracking-wider mt-0.5">
                        {model.details?.parameter_size} · {model.details?.quantization_level}
                      </div>
                    </div>
                    {model.name === settings.selectedModel && (
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
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Reasoning toggle */}
          <div className="border-t border-[hsl(260_18%_14%)] px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[hsl(270_20%_88%)]">Reasoning</div>
                <div className="text-[10px] text-[hsl(265_15%_45%)] uppercase tracking-wider">
                  Deep analysis mode
                </div>
              </div>
              <Switch
                checked={settings.enableThinking}
                onCheckedChange={(v) => updateSettings({ enableThinking: v })}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>

          {/* Settings link */}
          <div className="border-t border-[hsl(260_18%_14%)] px-4 py-3">
            <button
              onClick={() => { setOpen(false); onClose?.(); }}
              className="text-xs text-[hsl(265_15%_45%)] hover:text-purple-300 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
