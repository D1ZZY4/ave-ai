import {
  Plus, History, Wrench, Sparkles, Settings,
  Trash2, MoreHorizontal, X,
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

export function Sidebar({ isOpen, onClose, onNewChat, onOpenSettings, onOpenSkills, onOpenTools }: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession } = useChat();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const recentSessions = sessions.slice(0, 20);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/65 z-40" onClick={onClose} />
      )}

      {/* Sidebar panel — rounded on right side only */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
          "bg-[hsl(258_30%_6%)] border-r border-[hsl(260_18%_13%)]",
          "rounded-r-3xl overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="font-logo text-2xl text-purple-400">ave ai</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* New chat */}
        <div className="px-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-[hsl(270_45%_32%/0.5)] text-purple-300 hover:bg-[hsl(270_60%_18%/0.3)] transition-colors"
          >
            <Plus size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-widest">New Chat</span>
          </button>
        </div>

        {/* Nav */}
        <div className="px-3 py-1 space-y-0.5">
          {[
            { icon: <History size={14} />, label: "History", onClick: onClose },
            { icon: <Sparkles size={14} />, label: "Skills", onClick: () => { onOpenSkills(); onClose(); } },
            { icon: <Wrench size={14} />, label: "Tools", onClick: () => { onOpenTools(); onClose(); } },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[hsl(270_15%_65%)] hover:bg-[hsl(260_20%_11%)] hover:text-[hsl(270_20%_85%)] transition-colors text-[12px]"
            >
              <span className="text-[hsl(265_15%_42%)]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-2 border-t border-[hsl(260_18%_12%)]" />

        {/* Recent chats */}
        <div className="flex-1 overflow-y-auto px-3 scrollbar-hide">
          {recentSessions.length > 0 && (
            <>
              <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_35%)]">
                Recent
              </div>
              <div className="space-y-0.5">
                {recentSessions.map((session) => (
                  <div key={session.id} className="relative group">
                    <button
                      onClick={() => { setActiveSession(session.id); onClose(); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-[12px] transition-colors pr-7 truncate",
                        session.id === activeSessionId
                          ? "bg-[hsl(260_20%_13%)] text-[hsl(270_20%_90%)]"
                          : "text-[hsl(270_12%_60%)] hover:bg-[hsl(260_20%_11%)] hover:text-[hsl(270_20%_80%)]"
                      )}
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === session.id ? null : session.id); }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-[hsl(265_15%_40%)] hover:text-white transition-all"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    {menuOpen === session.id && (
                      <div className="absolute right-1 top-full mt-0.5 w-28 rounded-xl border border-[hsl(260_18%_16%)] bg-[hsl(258_28%_8%)] shadow-xl z-50 overflow-hidden slide-up">
                        <button
                          onClick={() => { deleteSession(session.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-[hsl(0_40%_18%/0.4)] transition-colors"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User profile */}
        <div className="px-3 py-3 border-t border-[hsl(260_18%_12%)]">
          <button
            onClick={() => { onOpenSettings(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-[hsl(260_20%_11%)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-[11px] font-bold text-purple-200 flex-shrink-0">
              {settings.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[12px] text-[hsl(270_20%_82%)] font-medium truncate">{settings.username}</div>
              <div className="text-[9px] text-[hsl(265_15%_38%)] uppercase tracking-wider">Local instance</div>
            </div>
            <Settings size={13} className="text-[hsl(265_15%_38%)] flex-shrink-0" />
          </button>
        </div>
      </div>
    </>
  );
}
