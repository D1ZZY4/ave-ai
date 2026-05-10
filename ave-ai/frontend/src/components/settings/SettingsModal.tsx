/**
 * flow-9 diagram 12: SettingsModal — tabbed settings shell.
 * Tabs: Connection, Capabilities, Personas, Skills.
 * Each tab delegates to its own sub-component.
 */
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Connection } from "./Connection";
import { Capabilities } from "./Capabilities";
import { Personas } from "./Personas";
import { Skills } from "./Skills";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "connection" | "capabilities" | "personas" | "skills";

const TABS: { id: Tab; label: string }[] = [
  { id: "connection", label: "Connection" },
  { id: "capabilities", label: "Capabilities" },
  { id: "personas", label: "Personas" },
  { id: "skills", label: "Skills" },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("connection");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[92vh] overflow-y-auto scrollbar-hide">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)] sticky top-0 bg-[hsl(258_28%_8%)] z-10">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[hsl(260_18%_13%)] px-4 gap-1 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "pb-2 px-1.5 text-[10px] font-semibold uppercase tracking-wider border-b-2 transition-colors",
                activeTab === t.id
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-[hsl(265_15%_42%)] hover:text-[hsl(270_20%_70%)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 py-3">
          {activeTab === "connection" && <Connection />}
          {activeTab === "capabilities" && <Capabilities />}
          {activeTab === "personas" && <Personas />}
          {activeTab === "skills" && <Skills />}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[hsl(260_18%_13%)] sticky bottom-0 bg-[hsl(258_28%_8%)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(265_15%_50%)] hover:text-white hover:border-[hsl(260_18%_26%)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
