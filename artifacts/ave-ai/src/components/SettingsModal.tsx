import { useState } from "react";
import { X, Save, RotateCcw, ExternalLink, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { AVAILABLE_TOOLS } from "../lib/tools";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [username, setUsername] = useState(settings.username);

  const handleSave = () => {
    updateSettings({ baseUrl: baseUrl.trim() || "http://localhost:11434", username });
    onClose();
  };

  const handleReset = () => {
    setBaseUrl("http://localhost:11434");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_18%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[85vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(260_18%_14%)]">
          <h2 className="text-base font-semibold text-[hsl(270_20%_92%)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(265_15%_45%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Ollama Base URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-[hsl(265_15%_50%)]">
                Ollama Base URL
              </label>
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                Docs <ExternalLink size={10} />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2.5 rounded-xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_20%)] text-sm text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_35%)] outline-none focus:border-[hsl(270_50%_45%)] transition-colors"
              />
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl border border-[hsl(260_18%_20%)] text-[hsl(265_15%_45%)] hover:text-purple-300 hover:border-[hsl(270_50%_35%)] transition-colors"
                title="Reset to default"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <p className="text-[11px] text-[hsl(265_15%_40%)]">
              The URL where your Ollama instance is running. Default: http://localhost:11434
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-[hsl(265_15%_50%)]">
              Display Name
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user_ave_ai"
              className="w-full px-3 py-2.5 rounded-xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_20%)] text-sm text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_35%)] outline-none focus:border-[hsl(270_50%_45%)] transition-colors"
            />
          </div>

          {/* Tools */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-[hsl(265_15%_50%)] block">
              Available Tools
            </label>
            <div className="space-y-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_16%)]"
                >
                  <Wrench size={14} className="text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[hsl(270_20%_88%)]">{tool.name}</div>
                    <div className="text-[11px] text-[hsl(265_15%_45%)] truncate">{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[hsl(258_25%_7%)] border border-[hsl(260_18%_16%)]">
              <span className="text-sm text-[hsl(270_20%_88%)]">Enable tools</span>
              <button
                onClick={() => updateSettings({ enableTools: !settings.enableTools })}
                className={cn(
                  "relative w-10 h-5.5 rounded-full transition-all duration-200",
                  settings.enableTools ? "bg-purple-600" : "bg-[hsl(260_20%_18%)]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                    settings.enableTools && "translate-x-4"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[hsl(260_18%_14%)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(260_18%_20%)] text-sm text-[hsl(265_15%_55%)] hover:text-white hover:border-[hsl(260_18%_28%)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
