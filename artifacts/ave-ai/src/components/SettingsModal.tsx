import { useState } from "react";
import { X, Save, RotateCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../store/settings";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1 pr-4 min-w-0">
        <div className="text-[12px] font-medium text-[hsl(270_20%_85%)]">{label}</div>
        <div className="text-[10px] text-[hsl(265_15%_40%)] mt-0.5 leading-snug">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-purple-600 flex-shrink-0 scale-90"
      />
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [username, setUsername] = useState(settings.username);

  const handleSave = () => {
    updateSettings({
      baseUrl: baseUrl.trim() || "http://localhost:11434",
      username: username.trim() || "you",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[88vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)]">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {/* Ollama Base URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
                Ollama Base URL
              </label>
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                Docs <ExternalLink size={9} />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_32%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors"
              />
              <button
                onClick={() => setBaseUrl("http://localhost:11434")}
                className="p-2 rounded-xl border border-[hsl(260_18%_18%)] text-[hsl(265_15%_40%)] hover:text-purple-300 hover:border-[hsl(270_45%_32%)] transition-colors"
                title="Reset to default"
              >
                <RotateCcw size={13} />
              </button>
            </div>
            <p className="text-[10px] text-[hsl(265_15%_35%)]">
              Where your Ollama instance is running. Default: http://localhost:11434
            </p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
              Display Name
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you"
              className="w-full px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_32%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[hsl(260_18%_13%)]" />

          {/* Display settings */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)] mb-1">
              Display
            </div>
            <div className="divide-y divide-[hsl(260_18%_13%)]">
              <ToggleRow
                label="Show process log"
                description="Display skill, persona, and mode info with each response"
                checked={settings.showProcessLog}
                onChange={(v) => updateSettings({ showProcessLog: v })}
              />
              <ToggleRow
                label="Show thinking"
                description="Display the AI's reasoning process in real time"
                checked={settings.showThinking}
                onChange={(v) => updateSettings({ showThinking: v })}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[hsl(260_18%_13%)]" />

          {/* Capabilities */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)] mb-1">
              Capabilities
            </div>
            <div className="divide-y divide-[hsl(260_18%_13%)]">
              <ToggleRow
                label="Enable thinking"
                description="Send reasoning instructions to the model (requires model support)"
                checked={settings.enableThinking}
                onChange={(v) => updateSettings({ enableThinking: v })}
              />
              <ToggleRow
                label="Enable tools"
                description="Let the model call built-in tools (calculator, time, search)"
                checked={settings.enableTools}
                onChange={(v) => updateSettings({ enableTools: v })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[hsl(260_18%_13%)] flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(265_15%_50%)] hover:text-white hover:border-[hsl(260_18%_26%)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-medium transition-colors"
          >
            <Save size={12} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
