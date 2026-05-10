/**
 * flow-11 diagram 3: Header — token bar, persona/model selectors, statistics button.
 * Mode toggle and settings icon removed; settings is accessed via Sidebar.
 */
import { Menu, BarChart2 } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { PersonaSelector } from "./PersonaSelector";
import { useChat } from "../store/chat";
import { cn } from "@/lib/utils";

const TOKEN_BUDGET = 65536;

interface HeaderProps {
  onMenuOpen: () => void;
  onStatistics?: () => void;
}

export function Header({ onMenuOpen, onStatistics }: HeaderProps) {
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

      {/* Center: token usage bar */}
      <div className="flex flex-col items-center">
        {usedTokens > 0 && (
          <div
            title={`${usedTokens.toLocaleString()} / ${TOKEN_BUDGET.toLocaleString()} tokens used`}
            className="w-20 h-0.5 bg-[hsl(260_18%_14%)] rounded-full overflow-hidden"
          >
            <div
              className={cn("h-full rounded-full transition-all", tokenColor)}
              style={{ width: `${tokenPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Right: persona + statistics */}
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
      </div>
    </div>
  );
}
