import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Bell, BellOff, Coins, AlertTriangle } from "lucide-react";
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
import { requestNotificationPermission } from "../helpers/notifications";
import { cn } from "@/lib/utils";

// Diagram 46: Approximate context window for warning calculation
const CONTEXT_WINDOW_ESTIMATE = 32768;

interface ChatProps {
  onBack: () => void;
}

export function Chat({ onBack }: ChatProps) {
  const {
    activeSession, createSession, setActiveSession,
    deleteMessage, updateMessage, addMessage, activeSessionId,
    setGreetingDone,
  } = useChat();
  const { settings, updateSettings } = useSettings();
  const { sendMessage, stopGeneration, sendGreeting } = useAgent();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(activeSession?.skill || "general");
  const [highlightMsgId, setHighlightMsgId] = useState<string | undefined>();
  const greetingTriggeredFor = useRef<string | null>(null);
  // Diagram 49: ref to sidebar's search focus function
  const sidebarSearchFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (activeSession?.skill) setSelectedSkill(activeSession.skill);
  }, [activeSession?.skill]);

  // ─── Diagram 41: Auto-greeting on new conversation ────────────────────────
  useEffect(() => {
    if (!activeSession) return;
    if (!settings.autoGreeting) return;
    if (activeSession.greetingDone) return;
    if (activeSession.messages.length > 0) return;
    if (greetingTriggeredFor.current === activeSession.id) return;
    greetingTriggeredFor.current = activeSession.id;
    setGreetingDone(activeSession.id);
    sendGreeting(activeSession.id);
  }, [activeSession?.id, activeSession?.greetingDone, activeSession?.messages.length, settings.autoGreeting, setGreetingDone, sendGreeting]);

  // ─── Diagram 49: Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const isStreaming = activeSession?.messages.some((m) => m.isStreaming);
        if (isStreaming) stopGeneration();
        if (sidebarOpen) setSidebarOpen(false);
        if (settingsOpen) setSettingsOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        handleNewChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((p) => !p);
      }
      // Diagram 49: Ctrl+K → open sidebar + focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        setTimeout(() => {
          sidebarSearchFocusRef.current?.();
        }, 320);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, sidebarOpen, settingsOpen]);

  const messages = activeSession?.messages || [];
  const isStreaming = messages.some((m) => m.isStreaming);
  const totalTokens = activeSession?.totalTokens ?? 0;
  // Diagram 46: token bar percentage + 80% warning
  const tokenPct = Math.min(100, (totalTokens / CONTEXT_WINDOW_ESTIMATE) * 100);
  const tokenWarning = tokenPct >= 80;

  const handleSend = async (content: string, images?: string[]) => {
    await sendMessage(content, undefined, images);
  };

  const handleNewChat = useCallback(() => {
    const sessionId = createSession(
      settings.selectedModel || "llama3",
      settings.selectedPersona,
      selectedSkill
    );
    setActiveSession(sessionId);
  }, [settings.selectedModel, settings.selectedPersona, selectedSkill, createSession, setActiveSession]);

  // ─── Diagram 38: Retry — delete last assistant + user, resend ─────────────
  const handleRetry = useCallback(async (lastUserContent: string) => {
    if (!activeSessionId || !activeSession) return;
    const msgs = activeSession.messages;
    const lastAssistIdx = msgs.map((m) => m.role).lastIndexOf("assistant");
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf("user");

    if (lastAssistIdx !== -1) deleteMessage(activeSessionId, msgs[lastAssistIdx].id);
    if (lastUserIdx !== -1) deleteMessage(activeSessionId, msgs[lastUserIdx].id);

    await sendMessage(lastUserContent);
  }, [activeSessionId, activeSession, deleteMessage, sendMessage]);

  // ─── Diagram 39: Edit — delete messages after edited, resend ─────────────
  const handleEdit = useCallback(async (msgId: string, newContent: string) => {
    if (!activeSessionId || !activeSession) return;
    const msgs = activeSession.messages;
    const editIdx = msgs.findIndex((m) => m.id === msgId);
    if (editIdx === -1) return;

    const toDelete = msgs.slice(editIdx);
    for (const m of toDelete) deleteMessage(activeSessionId, m.id);

    await sendMessage(newContent);
  }, [activeSessionId, activeSession, deleteMessage, sendMessage]);

  // ─── Diagram 51: Notifications toggle ────────────────────────────────────
  const handleNotificationToggle = async () => {
    if (!settings.enableNotifications) {
      const ok = await requestNotificationPermission();
      if (ok) updateSettings({ enableNotifications: true });
    } else {
      updateSettings({ enableNotifications: false });
    }
  };

  // ─── Diagram 47: Scroll to matched message after search select ────────────
  const handleSelectWithMatch = useCallback((_sessionId: string, messageId?: string) => {
    if (messageId) {
      setHighlightMsgId(messageId);
      setTimeout(() => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightMsgId(undefined), 2500);
      }, 100);
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-[hsl(260_18%_13%)] bg-[hsl(258_30%_7%)]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-xl text-[hsl(265_15%_48%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
            title="Menu (Ctrl+B)"
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
          {/* Diagram 46: Token bar with 80% warning */}
          {totalTokens > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[9px]",
                tokenWarning
                  ? "border-orange-700/60 bg-orange-950/30 text-orange-400"
                  : "border-[hsl(260_18%_15%)] bg-[hsl(260_18%_10%)] text-[hsl(265_15%_32%)]"
              )}
              title={`${totalTokens.toLocaleString()} tokens (~${tokenPct.toFixed(0)}% of ${(CONTEXT_WINDOW_ESTIMATE / 1024).toFixed(0)}k context)`}
            >
              {tokenWarning && <AlertTriangle size={9} className="flex-shrink-0" />}
              <Coins size={9} className="flex-shrink-0" />
              <div className="flex items-center gap-1">
                <span>{(totalTokens / 1000).toFixed(1)}k</span>
                <div className="w-12 h-1 rounded-full bg-[hsl(260_18%_18%)] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      tokenWarning ? "bg-orange-500" : "bg-purple-600"
                    )}
                    style={{ width: `${tokenPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <ModelSelector />
          <PersonaSelector />
          {/* Diagram 51: Notification toggle */}
          <button
            onClick={handleNotificationToggle}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-purple-300 hover:bg-[hsl(260_20%_13%)] transition-colors"
            title={settings.enableNotifications ? "Notifications on" : "Enable notifications"}
          >
            {settings.enableNotifications ? <Bell size={14} className="text-purple-400" /> : <BellOff size={14} />}
          </button>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-xl text-[hsl(265_15%_45%)] hover:text-purple-300 hover:bg-[hsl(260_20%_13%)] transition-colors"
            title="New chat (Ctrl+N)"
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
        onRegisterSearchFocus={(fn) => { sidebarSearchFocusRef.current = fn; }}
        onSelectWithMatch={handleSelectWithMatch}
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
        <MessageList
          messages={messages}
          onSend={handleSend}
          onRetry={handleRetry}
          onEdit={handleEdit}
          highlightMsgId={highlightMsgId}
        />
      )}

      <ThinkingBox />

      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        selectedSkill={selectedSkill}
        onSkillChange={setSelectedSkill}
        placeholder="Message Ave AI… (Enter, Shift+Enter for newline, Ctrl+K to search)"
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
