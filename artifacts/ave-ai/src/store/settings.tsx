import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ChatMode = "fast" | "expert";

interface Settings {
  baseUrl: string;
  selectedModel: string;
  selectedPersona: string;
  chatMode: ChatMode;
  enableThinking: boolean;
  enableSearch: boolean;
  enableTools: boolean;
  username: string;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  baseUrl: "http://localhost:11434",
  selectedModel: "",
  selectedPersona: "ave-prime",
  chatMode: "fast",
  enableThinking: false,
  enableSearch: false,
  enableTools: true,
  username: "user_ave_ai",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem("ave-ai-settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("ave-ai-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
