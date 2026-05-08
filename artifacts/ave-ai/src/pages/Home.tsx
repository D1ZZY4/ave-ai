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

interface HomeProps {
  onChatStarted: () => void;
}

export function Home({ onChatStarted }: HomeProps) {
  const { settings, updateSettings } = useSettings();
  const { createSession, setActiveSession } = useChat();
  const { sendMessage } = useChatActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("general");

  const MODE_DESCRIPTIONS: Record<ChatMode, string> = {
    fast: "Optimized for everyday speed and instant responses.",
    expert: "Advanced reasoning for complex technical tasks.",
  };

  const handleSend = async (content: string) => {
    const sessionId = createSession(
      settings.selectedModel || "llama3",
      settings.selectedPersona,
      selectedSkill
    );
    setActiveSession(sessionId);
    onChatStarted();
    await sendMessage(content, sessionId);
  };

  const handleNewChat = () => {
    // Just stay on home
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <Header onMenuOpen={() => setSidebarOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="font-logo text-6xl text-purple-400 tracking-tight select-none">
            ave ai
          </h1>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center rounded-full bg-[hsl(258_25%_10%)] border border-[hsl(260_18%_18%)] p-1 mb-4 w-full max-w-xs">
          {(["fast", "expert"] as ChatMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ chatMode: mode })}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all",
                settings.chatMode === mode
                  ? "bg-[hsl(270_60%_20%/0.7)] text-purple-300 border border-[hsl(270_50%_40%/0.3)]"
                  : "text-[hsl(265_15%_45%)] hover:text-[hsl(265_15%_65%)]"
              )}
            >
              {mode === "fast" ? <Zap size={13} /> : <Diamond size={13} />}
              {mode}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(265_15%_45%)] text-center mb-8 px-4">
          {MODE_DESCRIPTIONS[settings.chatMode]}
        </p>
      </div>

      {/* Input area at bottom */}
      <ChatInput
        onSend={handleSend}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        placeholder="Describe your vision..."
      />

      {/* Modals */}
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
