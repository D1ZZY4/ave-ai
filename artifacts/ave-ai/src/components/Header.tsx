import { Menu } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { PersonaSelector } from "./PersonaSelector";

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-2.5 py-2 border-b border-[hsl(260_18%_13%)] bg-[hsl(258_30%_7%)]">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onMenuOpen}
          className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
        >
          <Menu size={17} />
        </button>
        <ModelSelector />
      </div>
      <PersonaSelector />
    </div>
  );
}
