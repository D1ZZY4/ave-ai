import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useChat } from "../store/chat";
import { useSettings } from "../store/settings";
import { useChatActions } from "../hooks/useChat";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { SettingsModal } from "../components/SettingsModal";
import { SkillsModal } from "../components/SkillsModal";
import { ToolsModal } from "../components/ToolsModal";

interface ChatProps {
  onBack: () => void;
}

export function Chat({ onBack }: ChatProps) {
  const { activeSession, createSession, setActiveSession } = useChat();
  const { settings } = useSettings();
  const { sendMessage, stopGeneration } = useChatActions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(activeSession?.skill || "general");

  useEffect(() => {
    if (activeSession?.skill) {
      setSelectedSkill(activeSession.skill);
    }
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

  const handleSessionSelect = (id: string) => {
    setActiveSession(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[hsl(260_18%_14%)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-[hsl(265_15%_55%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
          >
            {/* Hamburger */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Model indicator */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-[hsl(265_15%_50%)] hover:text-purple-300 transition-colors"
          >
            <ArrowLeft size={13} />
            <span className="font-logo text-lg text-purple-400">ave ai</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl text-[hsl(265_15%_50%)] hover:text-purple-300 hover:bg-[hsl(260_20%_14%)] transition-colors"
            title="New chat"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
      />

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="font-logo text-4xl text-purple-400 mb-3">ave ai</div>
            <p className="text-xs text-[hsl(265_15%_40%)] uppercase tracking-widest">
              Start a new conversation
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        placeholder="Continue the conversation..."
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
