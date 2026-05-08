import { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { useModels } from "../hooks/useModels";
import { Switch } from "@/components/ui/switch";

export function ModelSelector() {
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const raw = settings.selectedModel || "No model";
  const display = raw.split(":")[0].split("/").pop() || raw;
  const short = display.length > 12 ? display.slice(0, 11) + "…" : display;

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
        <Cpu size={12} className="text-purple-400 flex-shrink-0" />
        <span className="uppercase tracking-wide">{short}</span>
        <ChevronDown size={10} className="text-[hsl(265_15%_45%)]" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-68 rounded-2xl border border-[hsl(260_18%_17%)] bg-[hsl(258_28%_8%)] shadow-2xl z-50 overflow-hidden slide-up" style={{ width: "17rem" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[hsl(260_18%_13%)]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_40%)]">Models</span>
            <button
              onClick={refetch}
              disabled={loading}
              className="p-1 rounded-lg text-[hsl(265_15%_40%)] hover:text-purple-300 transition-colors"
            >
              <RefreshCw size={11} className={cn(loading && "animate-spin")} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3.5 py-2.5 flex items-start gap-2 text-[11px] text-red-400 border-b border-[hsl(260_18%_13%)]">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <span>Cannot connect to Ollama. Check your base URL in settings.</span>
            </div>
          )}

          {/* Model list */}
          <div className="max-h-52 overflow-y-auto scrollbar-hide">
            {loading && !models.length ? (
              <div className="px-4 py-4 text-[11px] text-[hsl(265_15%_42%)] text-center">Loading models…</div>
            ) : models.length === 0 && !error ? (
              <div className="px-4 py-4 text-[11px] text-[hsl(265_15%_42%)] text-center">No models found</div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => { updateSettings({ selectedModel: model.name }); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 transition-colors",
                    model.name === settings.selectedModel ? "bg-[hsl(260_20%_13%)]" : "hover:bg-[hsl(260_20%_11%)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className={cn(
                        "text-[12px] font-medium truncate",
                        model.name === settings.selectedModel ? "text-purple-300" : "text-[hsl(270_20%_85%)]"
                      )}>
                        {model.name}
                      </div>
                      {model.details?.parameter_size && (
                        <div className="text-[9px] text-[hsl(265_15%_38%)] uppercase tracking-wider mt-0.5">
                          {model.details.parameter_size}
                          {model.details.quantization_level ? ` · ${model.details.quantization_level}` : ""}
                        </div>
                      )}
                    </div>
                    {model.name === settings.selectedModel && (
                      <svg className="text-purple-400 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Reasoning toggle */}
          <div className="border-t border-[hsl(260_18%_13%)] px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium text-[hsl(270_20%_85%)]">Reasoning</div>
              <div className="text-[9px] text-[hsl(265_15%_38%)] uppercase tracking-wider">Deep analysis</div>
            </div>
            <Switch
              checked={settings.enableThinking}
              onCheckedChange={(v) => updateSettings({ enableThinking: v })}
              className="data-[state=checked]:bg-purple-600 scale-90"
            />
          </div>
        </div>
      )}
    </div>
  );
}
