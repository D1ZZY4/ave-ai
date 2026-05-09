import {
  Plus, History, Wrench, Sparkles, Settings,
  Trash2, MoreHorizontal, X, Search, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat, type ChatSession } from "../store/chat";
import { useSettings } from "../store/settings";
import { useState, useMemo, useRef, useEffect } from "react";

function exportToMarkdown(session: ChatSession) {
  const lines = [`# ${session.title}`, `> ${new Date(session.createdAt).toLocaleString()}`, ""];
  for (const msg of session.messages) {
    lines.push(`**${msg.role === "user" ? "You" : "Ave AI"}**`, "", msg.content, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, "-")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(session: ChatSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenSkills: () => void;
  onOpenTools: () => void;
  onRegisterSearchFocus?: (fn: () => void) => void;
  onSelectWithMatch?: (sessionId: string, messageId?: string) => void;
}

export function Sidebar({
  isOpen, onClose, onNewChat, onOpenSettings, onOpenSkills, onOpenTools,
  onRegisterSearchFocus, onSelectWithMatch,
}: SidebarProps) {
  const { sessions, activeSessionId, setActiveSession, deleteSession } = useChat();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportMenu, setExportMenu] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!onRegisterSearchFocus) return;
    onRegisterSearchFocus(() => { searchInputRef.current?.focus(); });
  }, [onRegisterSearchFocus]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions.slice(0, 30).map((s) => ({ session: s, matchedMsgId: undefined as string | undefined }));
    return sessions
      .filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
      )
      .slice(0, 30)
      .map((s) => {
        const matchedMsg = s.messages.find((m) => m.content.toLowerCase().includes(q));
        return { session: s, matchedMsgId: matchedMsg?.id };
      });
  }, [sessions, searchQuery]);

  const handleSelectSession = (sessionId: string, matchedMsgId?: string) => {
    setActiveSession(sessionId);
    if (onSelectWithMatch) onSelectWithMatch(sessionId, matchedMsgId);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/65 z-40" onClick={() => { onClose(); setMenuOpen(null); setExportMenu(null); }} />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
          "bg-[hsl(258_30%_6%)] border-r border-[hsl(260_18%_13%)]",
          "rounded-r-3xl overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="font-logo text-2xl text-purple-400">ave ai</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-[hsl(270_45%_32%/0.5)] text-purple-300 hover:bg-[hsl(270_60%_18%/0.3)] transition-colors"
          >
            <Plus size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-widest">New Chat</span>
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[hsl(258_25%_8%)] border border-[hsl(260_18%_15%)]">
            <Search size={12} className="text-[hsl(265_15%_38%)] flex-shrink-0" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats… (Ctrl+K)"
              className="flex-1 bg-transparent text-[11px] text-[hsl(270_20%_82%)] placeholder:text-[hsl(265_15%_32%)] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[hsl(265_15%_38%)] hover:text-white">
                <X size={10} />
              </button>
            )}
          </div>
        </div>

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

        <div className="mx-3 my-2 border-t border-[hsl(260_18%_12%)]" />

        <div className="flex-1 overflow-y-auto px-3 scrollbar-hide">
          {filteredSessions.length > 0 ? (
            <>
              <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_35%)]">
                {searchQuery ? `Results (${filteredSessions.length})` : "Recent"}
              </div>
              <div className="space-y-0.5">
                {filteredSessions.map(({ session, matchedMsgId }) => (
                  <div key={session.id} className="relative group">
                    <button
                      onClick={() => handleSelectSession(session.id, matchedMsgId)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-[12px] transition-colors pr-7",
                        session.id === activeSessionId
                          ? "bg-[hsl(260_20%_13%)] text-[hsl(270_20%_90%)]"
                          : "text-[hsl(270_12%_60%)] hover:bg-[hsl(260_20%_11%)] hover:text-[hsl(270_20%_80%)]"
                      )}
                    >
                      <div className="truncate">{session.title}</div>
                      {matchedMsgId && searchQuery && (() => {
                        const msg = session.messages.find((m) => m.id === matchedMsgId);
                        if (!msg) return null;
                        const q = searchQuery.toLowerCase();
                        const idx = msg.content.toLowerCase().indexOf(q);
                        const snippet = msg.content.slice(Math.max(0, idx - 20), idx + 40);
                        return (
                          <div className="text-[9px] text-[hsl(265_15%_38%)] mt-0.5 truncate">…{snippet}…</div>
                        );
                      })()}
                      {session.totalTokens != null && session.totalTokens > 0 && (
                        <span className="ml-1.5 text-[9px] text-[hsl(265_15%_32%)]">
                          {(session.totalTokens / 1000).toFixed(1)}k
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === session.id ? null : session.id); setExportMenu(null); }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-[hsl(265_15%_40%)] hover:text-white transition-all"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                    {menuOpen === session.id && (
                      <div className="absolute right-1 top-full mt-0.5 w-36 rounded-xl border border-[hsl(260_18%_16%)] bg-[hsl(258_28%_8%)] shadow-xl z-50 overflow-hidden slide-up">
                        <button
                          onClick={() => { setExportMenu(session.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[hsl(270_20%_75%)] hover:bg-[hsl(260_20%_13%)] transition-colors"
                        >
                          <Download size={11} />
                          Export
                        </button>
                        <button
                          onClick={() => { deleteSession(session.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-[hsl(0_40%_18%/0.4)] transition-colors"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    )}
                    {exportMenu === session.id && (
                      <div className="absolute right-1 top-full mt-0.5 w-36 rounded-xl border border-[hsl(260_18%_16%)] bg-[hsl(258_28%_8%)] shadow-xl z-50 overflow-hidden slide-up">
                        <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-[hsl(265_15%_35%)] border-b border-[hsl(260_18%_12%)]">Export as</div>
                        <button
                          onClick={() => { exportToMarkdown(session); setExportMenu(null); }}
                          className="w-full text-left px-3 py-2 text-[11px] text-[hsl(270_20%_75%)] hover:bg-[hsl(260_20%_13%)] transition-colors"
                        >
                          Markdown (.md)
                        </button>
                        <button
                          onClick={() => { exportToJSON(session); setExportMenu(null); }}
                          className="w-full text-left px-3 py-2 text-[11px] text-[hsl(270_20%_75%)] hover:bg-[hsl(260_20%_13%)] transition-colors"
                        >
                          JSON (.json)
                        </button>
                        <button
                          onClick={() => setExportMenu(null)}
                          className="w-full text-left px-3 py-2 text-[11px] text-[hsl(265_15%_40%)] hover:bg-[hsl(260_20%_13%)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[11px] text-[hsl(265_15%_30%)]">
              {searchQuery ? "No results" : "No conversations yet"}
            </div>
          )}
        </div>

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
