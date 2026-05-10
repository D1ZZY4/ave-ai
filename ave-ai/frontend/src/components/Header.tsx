/**
 * flow-11 diagram 3: Header — mode toggle, token bar, persona/model selectors, settings button.
 */
import { Menu, Settings, BarChart2 } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { PersonaSelector } from "./PersonaSelector";
import { useSettings } from "../store/settings";
import { useChat } from "../store/chat";
import { cn } from "@/lib/utils";

const TOKEN_BUDGET = 65536;

interface HeaderProps {
  onMenuOpen: () => void;
  onSettings: () => void;
  onStatistics?: () => void;
}

export function Header({ onMenuOpen, onSettings, onStatistics }: HeaderProps) {
  const { settings, updateSettings } = useSettings();
  const { activeSession } = useChat();

  const usedTokens = activeSession?.totalTokens ?? 0;
  const tokenPct = Math.min(100, (usedTokens / TOKEN_BUDGET) * 100);
  const tokenColor =
    tokenPct >= 80 ? "bg-red-500" : tokenPct >= 50 ? "bg-yellow-500" : "bg-purple-500";

  return (
    <div className="flex items-center justify-between px-2.5 py-2 border-b border-[hsl(260_18%_13%)] bg-[hsl(258_30%_7%)]">
      {/* Left: menu + model selector */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onMenuOpen}
          className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
        >
          <Menu size={17} />
        </button>
        <ModelSelector />
      </div>

      {/* Center: mode toggle + token bar */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-0.5 bg-[hsl(258_25%_10%)] rounded-full px-0.5 py-0.5 border border-[hsl(260_18%_14%)]">
          {(["fast", "expert"] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateSettings({ chatMode: m })}
              className={cn(
                "text-[9px] font-semibold px-2.5 py-1 rounded-full transition-all capitalize",
                settings.chatMode === m
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[hsl(265_15%_42%)] hover:text-purple-300"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Token usage bar */}
        {usedTokens > 0 && (
          <div className="w-20 h-0.5 bg-[hsl(260_18%_14%)] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", tokenColor)}
              style={{ width: `${tokenPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Right: persona + settings + statistics */}
      <div className="flex items-center gap-1">
        <PersonaSelector />
        {onStatistics && (
          <button
            onClick={onStatistics}
            title="Statistics"
            className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <BarChart2 size={15} />
          </button>
        )}
        <button
          onClick={onSettings}
          title="Settings"
          className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
