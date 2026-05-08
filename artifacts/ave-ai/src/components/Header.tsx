import { Menu } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { PersonaSelector } from "./PersonaSelector";

interface HeaderProps {
  onMenuOpen: () => void;
  onOpenSettings: () => void;
}

export function Header({ onMenuOpen, onOpenSettings }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[hsl(260_18%_14%)]">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuOpen}
          className="p-2 rounded-xl text-[hsl(265_15%_55%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
        >
          <Menu size={18} />
        </button>
        <ModelSelector onClose={onOpenSettings} />
      </div>
      <PersonaSelector />
    </div>
  );
}
