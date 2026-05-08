import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useChat } from "../store/chat";
import { useSettings } from "../store/settings";
import { useAgent } from "../hooks/useAgent";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { Sidebar } from "../components/Sidebar";
import { SettingsModal } from "../components/SettingsModal";
import { SkillsModal } from "../components/SkillsModal";
import { ToolsModal } from "../components/ToolsModal";
import { ModelSelector } from "../components/ModelSelector";
import { PersonaSelector } from "../components/PersonaSelector";
import { ThinkingBox } from "../components/ThinkingBox";

interface ChatProps {
  onBack: () => void;
}

export function Chat({ onBack }: ChatProps) {
  const { activeSession, createSession, setActiveSession } = useChat();
  const { settings } = useSettings();
  const { sendMessage, stopGeneration } = useAgent();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(activeSession?.skill || "general");

  useEffect(() => {
    if (activeSession?.skill) setSelectedSkill(activeSession.skill);
  }, [activeSession?.skill]);

  const messages = activeSession?.messages || [];
  const isStreaming = messages.some((m) => m.isStreaming);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  const handleNewChat = () => {
    const sessionId = createSession(
      settings.selectedModel || "llama3",
      settings.selectedPersona,
      selectedSkill
    );
    setActiveSession(sessionId);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-[hsl(260_18%_13%)] bg-[hsl(258_30%_7%)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            onClick={onBack}
            className="font-logo text-xl text-purple-400 hover:text-purple-300 transition-colors"
          >
            ave ai
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <ModelSelector />
          <PersonaSelector />
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-xl text-[hsl(265_15%_45%)] hover:text-purple-300 hover:bg-[hsl(260_20%_13%)] transition-colors"
            title="New chat"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
      />

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="font-logo text-3xl text-purple-400/60 mb-2">ave ai</div>
            <p className="text-[10px] text-[hsl(265_15%_35%)] uppercase tracking-widest">
              Start typing below
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} onSend={handleSend} />
      )}

      <ThinkingBox />

      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        placeholder="Continue the conversation..."
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
