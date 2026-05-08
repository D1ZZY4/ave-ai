import { useState } from "react";
import { Zap, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, type ChatMode } from "../store/settings";
import { ChatInput } from "../components/ChatInput";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SettingsModal } from "../components/SettingsModal";
import { SkillsModal } from "../components/SkillsModal";
import { ToolsModal } from "../components/ToolsModal";
import { useChat } from "../store/chat";
import { useChatActions } from "../hooks/useChat";
import { detectSkill } from "../skills/index";

interface HomeProps {
  onChatStarted: () => void;
}

const MODE_DESC: Record<ChatMode, string> = {
  fast: "Optimized for everyday speed and instant responses.",
  expert: "Advanced reasoning for complex technical tasks.",
};

export function Home({ onChatStarted }: HomeProps) {
  const { settings, updateSettings } = useSettings();
  const { createSession, setActiveSession } = useChat();
  const { sendMessage } = useChatActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("general");

  const handleSend = async (content: string) => {
    const autoSkill = detectSkill(content);
    const skill = selectedSkill !== "general" ? selectedSkill : autoSkill;

    const sessionId = createSession(
      settings.selectedModel || "llama3",
      settings.selectedPersona,
      skill
    );
    setActiveSession(sessionId);
    onChatStarted();
    await sendMessage(content, sessionId);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <Header onMenuOpen={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => {}}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-2">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="font-logo text-5xl text-purple-400 tracking-tight select-none">
            ave ai
          </h1>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center rounded-full bg-[hsl(258_25%_9%)] border border-[hsl(260_18%_17%)] p-0.5 mb-3 w-full max-w-[240px]">
          {(["fast", "expert"] as ChatMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ chatMode: mode })}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all",
                settings.chatMode === mode
                  ? "bg-[hsl(270_55%_18%/0.8)] text-purple-300 border border-[hsl(270_45%_38%/0.3)]"
                  : "text-[hsl(265_15%_40%)] hover:text-[hsl(265_15%_60%)]"
              )}
            >
              {mode === "fast" ? <Zap size={11} /> : <Diamond size={11} />}
              {mode}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_38%)] text-center px-4">
          {MODE_DESC[settings.chatMode]}
        </p>
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        placeholder="Describe your vision..."
      />

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SkillsModal
        isOpen={skillsOpen}
        onClose={() => setSkillsOpen(false)}
        selectedSkill={selectedSkill}
        onSelect={setSelectedSkill}
      />
      <ToolsModal isOpen={toolsOpen} onClose={() => setToolsOpen(false)} />
    </div>
  );
}
