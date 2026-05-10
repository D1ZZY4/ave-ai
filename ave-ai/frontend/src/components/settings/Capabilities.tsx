/**
 * flow-9 diagram 12: Settings → Capabilities tab.
 * Toggles: Enable Thinking, Enable Tools, Web Enabled, Memory Enabled,
 * Show Thinking, Show Process Log.
 */
import { Bell, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, type AppTheme } from "../../store/settings";
import { Switch } from "@/components/ui/switch";

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

const THEMES: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun size={13} /> },
  { id: "system", label: "System", icon: <Monitor size={13} /> },
  { id: "dark", label: "Dark", icon: <Moon size={13} /> },
];

export function Capabilities() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-1">
      {/* AI Capabilities section */}
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_35%)] pb-1 pt-0.5">
        AI Capabilities
      </div>
      <div className="divide-y divide-[hsl(260_18%_13%)]">
        <ToggleRow
          label="Enable thinking"
          description="Send reasoning instructions (requires qwen3, deepseek-r1, etc.)"
          checked={settings.enableThinking}
          onChange={(v) => updateSettings({ enableThinking: v })}
        />
        <ToggleRow
          label="Enable tools"
          description="Let the model call built-in tools (calculator, time)"
          checked={settings.enableTools}
          onChange={(v) => updateSettings({ enableTools: v })}
        />
        <ToggleRow
          label="Web search"
          description="Expose web_search to the model when tools are enabled"
          checked={settings.enableWebSearch}
          onChange={(v) => updateSettings({ enableWebSearch: v })}
        />
        <ToggleRow
          label="Long-term memory"
          description="Extract and inject user facts across conversations via IndexedDB"
          checked={settings.memoryEnabled}
          onChange={(v) => updateSettings({ memoryEnabled: v })}
        />
      </div>

      {/* Display section */}
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_35%)] pb-1 pt-3">
        Display
      </div>

      {/* Theme selector */}
      <div className="pb-2">
        <div className="text-[10px] text-[hsl(265_15%_40%)] mb-2">
          Choose dark, light, or follow system preference
        </div>
        <div className="flex gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSettings({ theme: t.id })}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-medium transition-all",
                settings.theme === t.id
                  ? "border-purple-600 bg-[hsl(270_60%_18%/0.5)] text-purple-300"
                  : "border-[hsl(260_18%_18%)] text-[hsl(265_15%_45%)] hover:border-[hsl(260_18%_26%)] hover:text-white"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[hsl(260_18%_13%)]">
        <ToggleRow
          label="Show thinking"
          description="Real-time reasoning display while the model thinks"
          checked={settings.showThinking}
          onChange={(v) => updateSettings({ showThinking: v })}
        />
        <ToggleRow
          label="Show process log"
          description="Skill, persona, rules, and mode info shown with each response"
          checked={settings.showProcessLog}
          onChange={(v) => updateSettings({ showProcessLog: v })}
        />
        <ToggleRow
          label="Auto-greeting"
          description="Ave AI sends a brief greeting at the start of each new conversation"
          checked={settings.autoGreeting}
          onChange={(v) => updateSettings({ autoGreeting: v })}
        />
        <div className="flex items-center justify-between py-2.5">
          <div className="flex-1 pr-4 min-w-0">
            <div className="text-[12px] font-medium text-[hsl(270_20%_85%)] flex items-center gap-1.5">
              <Bell size={12} className="text-[hsl(265_15%_45%)]" />
              Response notifications
            </div>
            <div className="text-[10px] text-[hsl(265_15%_40%)] mt-0.5 leading-snug">
              Browser notification + vibration when AI finishes
            </div>
          </div>
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={(v) => updateSettings({ enableNotifications: v })}
            className="data-[state=checked]:bg-purple-600 flex-shrink-0 scale-90"
          />
        </div>
      </div>
    </div>
  );
}
