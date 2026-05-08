import {
  Plus,
  History,
  Wrench,
  Sparkles,
  Settings,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "../store/chat";
import { useSettings } from "../store/settings";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenSkills: () => void;
  onOpenTools: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onOpenSettings,
  onOpenSkills,
  onOpenTools,
}: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession } = useChat();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const recentSessions = sessions.slice(0, 20);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 z-50 flex flex-col",
          "bg-[hsl(258_30%_6%)] border-r border-[hsl(260_18%_14%)]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <span className="font-logo text-3xl text-purple-400">ave ai</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[hsl(265_15%_45%)] hover:text-white hover:bg-[hsl(260_20%_14%)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-4 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(270_50%_35%/0.5)] text-purple-300 hover:bg-[hsl(270_60%_22%/0.3)] transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">New Chat</span>
          </button>
        </div>

        {/* Nav items */}
        <div className="px-4 py-2 space-y-1">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[hsl(270_20%_80%)] hover:bg-[hsl(260_20%_12%)] transition-colors text-sm"
          >
            <History size={16} className="text-[hsl(265_15%_50%)]" />
            History
          </button>
          <button
            onClick={() => { onOpenSkills(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[hsl(270_20%_80%)] hover:bg-[hsl(260_20%_12%)] transition-colors text-sm"
          >
            <Sparkles size={16} className="text-[hsl(265_15%_50%)]" />
            Skills
          </button>
          <button
            onClick={() => { onOpenTools(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[hsl(270_20%_80%)] hover:bg-[hsl(260_20%_12%)] transition-colors text-sm"
          >
            <Wrench size={16} className="text-[hsl(265_15%_50%)]" />
            Tools
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-[hsl(260_18%_14%)]" />

        {/* Recent chats */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
          {recentSessions.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_40%)]">
                Recent
              </div>
              <div className="space-y-0.5">
                {recentSessions.map((session) => (
                  <div key={session.id} className="relative group">
                    <button
                      onClick={() => {
                        setActiveSession(session.id);
                        onClose();
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors truncate pr-8",
                        session.id === activeSessionId
                          ? "bg-[hsl(260_20%_14%)] text-[hsl(270_20%_92%)]"
                          : "text-[hsl(270_15%_65%)] hover:bg-[hsl(260_20%_12%)]"
                      )}
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === session.id ? null : session.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-[hsl(265_15%_45%)] hover:text-white transition-all"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {menuOpen === session.id && (
                      <div className="absolute right-2 top-full mt-1 w-32 rounded-xl border border-[hsl(260_18%_18%)] bg-[hsl(258_28%_9%)] shadow-xl z-50 overflow-hidden slide-up">
                        <button
                          onClick={() => {
                            deleteSession(session.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[hsl(0_50%_20%/0.3)] transition-colors"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-[hsl(260_18%_14%)]">
          <button
            onClick={() => { onOpenSettings(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[hsl(260_20%_12%)] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(260_20%_18%)] flex items-center justify-center text-sm font-bold text-purple-300 flex-shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm text-[hsl(270_20%_88%)] font-medium truncate">
                {settings.username}
              </div>
              <div className="text-[10px] text-[hsl(265_15%_45%)] uppercase tracking-wider">
                Premium Node
              </div>
            </div>
            <Settings size={15} className="text-[hsl(265_15%_45%)] flex-shrink-0" />
          </button>
        </div>
      </div>
    </>
  );
}
