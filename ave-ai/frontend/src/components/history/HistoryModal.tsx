/**
 * flow-11 diagram 5: HistoryModal — browse, search, export, delete conversations.
 */
import { useState, useMemo } from "react";
import { X, Search, Download, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat, type ChatSession } from "../../store/chat";
import { jsPDF } from "jspdf";

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

function exportToPDF(session: ChatSession) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const maxW = pageW - margin * 2;
  let y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(session.title, margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 100, 160);
  doc.text(new Date(session.createdAt).toLocaleString(), margin, y);
  y += 24;

  for (const msg of session.messages) {
    if (y > 760) { doc.addPage(); y = 40; }
    const isUser = msg.role === "user";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(isUser ? 160 : 100, isUser ? 100 : 140, isUser ? 220 : 180);
    doc.text(isUser ? "You" : "Ave AI", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 55, 80);
    const lines = doc.splitTextToSize(msg.content.replace(/[*#`]/g, ""), maxW);
    for (const line of lines) {
      if (y > 760) { doc.addPage(); y = 40; }
      doc.text(line, margin, y);
      y += 12;
    }
    y += 8;
  }

  doc.save(`${session.title.replace(/[^a-z0-9]/gi, "-")}.pdf`);
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
}

export function HistoryModal({ isOpen, onClose, onSelect }: HistoryModalProps) {
  const { sessions, deleteSession, deleteAllSessions } = useChat();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ChatSession | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [exportMenu, setExportMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, search]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    deleteSession(id);
    if (selected?.id === id) setSelected(null);
    setConfirmDeleteId(null);
  };

  const handleDeleteAll = () => {
    deleteAllSessions();
    setSelected(null);
    setConfirmDeleteAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)] flex-shrink-0">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">History</h2>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="text-[10px] text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-[hsl(260_20%_13%)]"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-[hsl(260_18%_13%)] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[hsl(258_25%_10%)] rounded-xl px-3 py-2 border border-[hsl(260_18%_14%)]">
            <Search size={13} className="text-[hsl(265_15%_40%)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-[12px] text-[hsl(270_20%_88%)] placeholder:text-[hsl(265_15%_36%)] outline-none"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* List */}
          <div className="w-1/2 border-r border-[hsl(260_18%_13%)] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[hsl(265_15%_36%)]">
                <MessageSquare size={28} className="mb-2 opacity-40" />
                <p className="text-[11px]">No conversations found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filtered.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      selected?.id === s.id
                        ? "bg-[hsl(270_45%_16%/0.6)] border border-[hsl(270_35%_28%/0.4)]"
                        : "hover:bg-[hsl(258_25%_10%)] border border-transparent"
                    )}
                    onClick={() => setSelected(s)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-medium truncate",
                        selected?.id === s.id ? "text-purple-300" : "text-[hsl(270_20%_85%)]"
                      )}>
                        {s.title}
                      </p>
                      <p className="text-[9px] text-[hsl(265_15%_38%)] mt-0.5">
                        {s.messages.length} messages · {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExportMenu(exportMenu === s.id ? null : s.id);
                          }}
                          className="p-1 rounded-lg text-[hsl(265_15%_42%)] hover:text-purple-300 hover:bg-[hsl(260_20%_13%)] transition-colors"
                        >
                          <Download size={11} />
                        </button>
                        {exportMenu === s.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_16%)] rounded-xl shadow-xl overflow-hidden">
                            <button
                              onClick={(e) => { e.stopPropagation(); exportToJSON(s); setExportMenu(null); }}
                              className="block w-full text-left px-3 py-2 text-[10px] text-[hsl(270_20%_85%)] hover:bg-[hsl(260_20%_13%)] whitespace-nowrap"
                            >JSON</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); exportToMarkdown(s); setExportMenu(null); }}
                              className="block w-full text-left px-3 py-2 text-[10px] text-[hsl(270_20%_85%)] hover:bg-[hsl(260_20%_13%)] whitespace-nowrap"
                            >Markdown</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); exportToPDF(s); setExportMenu(null); }}
                              className="block w-full text-left px-3 py-2 text-[10px] text-[hsl(270_20%_85%)] hover:bg-[hsl(260_20%_13%)] whitespace-nowrap"
                            >PDF</button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                        className="p-1 rounded-lg text-[hsl(265_15%_42%)] hover:text-red-400 hover:bg-[hsl(260_20%_13%)] transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-[12px] font-semibold text-[hsl(270_20%_90%)]">{selected.title}</h3>
                  <p className="text-[10px] text-[hsl(265_15%_38%)] mt-0.5">
                    {new Date(selected.createdAt).toLocaleString()} · {selected.messages.length} messages
                    {selected.totalTokens ? ` · ${selected.totalTokens.toLocaleString()} tokens` : ""}
                  </p>
                </div>
                <button
                  onClick={() => { onSelect(selected.id); onClose(); }}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-colors"
                >
                  Open Conversation
                </button>
                <div className="space-y-2">
                  {selected.messages.slice(0, 6).map((m) => (
                    <div key={m.id} className={cn(
                      "px-3 py-2 rounded-xl text-[10px] leading-relaxed",
                      m.role === "user"
                        ? "bg-[hsl(258_25%_12%)] text-[hsl(270_20%_75%)]"
                        : "bg-[hsl(260_18%_10%)] text-[hsl(265_15%_60%)]"
                    )}>
                      <span className={cn("font-semibold mr-1", m.role === "user" ? "text-purple-400" : "text-[hsl(265_15%_48%)]")}>
                        {m.role === "user" ? "You" : "Ave AI"}:
                      </span>
                      {m.content.slice(0, 150)}{m.content.length > 150 ? "…" : ""}
                    </div>
                  ))}
                  {selected.messages.length > 6 && (
                    <p className="text-[9px] text-[hsl(265_15%_32%)] text-center">
                      +{selected.messages.length - 6} more messages
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[hsl(265_15%_36%)]">
                <p className="text-[11px]">Select a conversation to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirm delete single */}
        {confirmDeleteId && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
            <div className="bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_16%)] rounded-2xl p-5 mx-4 max-w-xs w-full">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-[12px] font-semibold text-[hsl(270_20%_90%)]">Delete conversation?</p>
              </div>
              <p className="text-[10px] text-[hsl(265_15%_42%)] mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-xl border border-[hsl(260_18%_16%)] text-[10px] text-[hsl(265_15%_48%)] hover:text-white transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete all */}
        {confirmDeleteAll && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
            <div className="bg-[hsl(258_28%_9%)] border border-[hsl(260_18%_16%)] rounded-2xl p-5 mx-4 max-w-xs w-full">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <p className="text-[12px] font-semibold text-[hsl(270_20%_90%)]">Clear all history?</p>
              </div>
              <p className="text-[10px] text-[hsl(265_15%_42%)] mb-4">This will permanently delete all {sessions.length} conversations.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteAll(false)} className="flex-1 py-2 rounded-xl border border-[hsl(260_18%_16%)] text-[10px] text-[hsl(265_15%_48%)] hover:text-white transition-colors">Cancel</button>
                <button onClick={handleDeleteAll} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors">Clear All</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
