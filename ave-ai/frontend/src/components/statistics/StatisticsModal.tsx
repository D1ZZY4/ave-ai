/**
 * flow-17: StatisticsModal — 6-tab analytics dashboard.
 * Tabs: Overview, Tokens, Tools, Skills, Conversations, Feedback (flow-18 #6).
 */
import { useState, useMemo, useEffect } from "react";
import { X, Download, BarChart2, Zap, Wrench, Sparkles, MessageSquare, Activity, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "../../store/chat";
import { useSettings } from "../../store/settings";

type Tab = "overview" | "tokens" | "tools" | "skills" | "conversations" | "feedback";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[hsl(258_25%_9%)] border border-[hsl(260_18%_14%)] rounded-2xl px-4 py-3">
      <div className="text-[10px] text-[hsl(265_15%_40%)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[18px] font-bold text-[hsl(270_20%_90%)]">{value}</div>
      {sub && <div className="text-[9px] text-[hsl(265_15%_36%)] mt-0.5">{sub}</div>}
    </div>
  );
}

function SimpleBar({ label, value, max, color = "bg-purple-600" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[hsl(270_20%_78%)]">{label}</span>
        <span className="text-[10px] text-[hsl(265_15%_40%)]">{value}</span>
      </div>
      <div className="h-1.5 bg-[hsl(260_18%_14%)] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatisticsModal({ isOpen, onClose }: StatisticsModalProps) {
  const { sessions } = useChat();
  const { settings } = useSettings();
  const [tab, setTab] = useState<Tab>("overview");
  const [sessionStart] = useState(Date.now());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const iv = setInterval(() => setUptime(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [isOpen, sessionStart]);

  const stats = useMemo(() => {
    const totalConvs = sessions.length;
    const allMessages = sessions.flatMap((s) => s.messages);
    const totalMessages = allMessages.length;
    const assistantMessages = allMessages.filter((m) => m.role === "assistant");
    const totalTokens = sessions.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0);
    const avgTokensPerMsg = assistantMessages.length > 0 ? Math.round(totalTokens / assistantMessages.length) : 0;
    const tokenBudget = 65536;
    const budgetPct = Math.round((totalTokens / (tokenBudget * Math.max(1, totalConvs))) * 100);

    const toolCalls = sessions.flatMap((s) =>
      s.messages.flatMap((m) =>
        (m.steps ?? []).filter((st) => st.type === "tool-call")
      )
    );
    const toolMap: Record<string, { calls: number }> = {};
    for (const t of toolCalls) {
      const name = t.label || "unknown";
      toolMap[name] = { calls: (toolMap[name]?.calls ?? 0) + 1 };
    }

    const skillCalls = sessions.flatMap((s) =>
      s.messages.flatMap((m) =>
        (m.steps ?? []).filter((st) => st.type === "skill")
      )
    );
    const skillMap: Record<string, number> = {};
    for (const sk of skillCalls) {
      const name = sk.label || "unknown";
      skillMap[name] = (skillMap[name] ?? 0) + 1;
    }

    const allFeedback = sessions.flatMap((s) => s.feedback ?? []);
    const positiveFeedback = allFeedback.filter((f) => f.rating === "positive").length;
    const negativeFeedback = allFeedback.filter((f) => f.rating === "negative").length;
    const feedbackTotal = allFeedback.length;
    const positivePct = feedbackTotal > 0 ? Math.round((positiveFeedback / feedbackTotal) * 100) : 0;

    const personaMap: Record<string, number> = {};
    for (const s of sessions) {
      personaMap[s.persona] = (personaMap[s.persona] ?? 0) + 1;
    }

    const modeMap: Record<string, number> = { fast: 0, expert: 0 };
    for (const s of sessions) {
      modeMap[s.mode ?? "fast"] = (modeMap[s.mode ?? "fast"] ?? 0) + 1;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeToday = sessions.filter((s) => s.updatedAt >= todayStart.getTime()).length;
    const avgLength = totalConvs > 0 ? Math.round(totalMessages / totalConvs) : 0;

    return {
      totalConvs, totalMessages, totalTokens, avgTokensPerMsg, budgetPct,
      toolCalls: toolCalls.length, toolMap, skillMap,
      positiveFeedback, negativeFeedback, feedbackTotal, positivePct,
      personaMap, modeMap, activeToday, avgLength, allFeedback,
    };
  }, [sessions]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const exportJSON = () => {
    const data = { stats, sessions: sessions.length, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ave-ai-statistics.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Conversations", stats.totalConvs],
      ["Total Messages", stats.totalMessages],
      ["Total Tokens", stats.totalTokens],
      ["Avg Tokens/Message", stats.avgTokensPerMsg],
      ["Tool Calls", stats.toolCalls],
      ["Positive Feedback", stats.positiveFeedback],
      ["Negative Feedback", stats.negativeFeedback],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ave-ai-statistics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={12} /> },
    { id: "tokens", label: "Tokens", icon: <Zap size={12} /> },
    { id: "tools", label: "Tools", icon: <Wrench size={12} /> },
    { id: "skills", label: "Skills", icon: <Sparkles size={12} /> },
    { id: "conversations", label: "Conversations", icon: <MessageSquare size={12} /> },
    { id: "feedback", label: "Feedback", icon: <ThumbsUp size={12} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-purple-400" />
            <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Statistics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 text-[9px] text-[hsl(265_15%_42%)] hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-[hsl(260_20%_13%)] transition-colors"
            >
              <Download size={10} /> CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1 text-[9px] text-[hsl(265_15%_42%)] hover:text-purple-300 px-2 py-1 rounded-lg hover:bg-[hsl(260_20%_13%)] transition-colors"
            >
              <Download size={10} /> JSON
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 py-2 border-b border-[hsl(260_18%_13%)] overflow-x-auto flex-shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-semibold whitespace-nowrap transition-all",
                tab === t.id
                  ? "bg-purple-600 text-white"
                  : "text-[hsl(265_15%_42%)] hover:text-purple-300 hover:bg-[hsl(260_20%_13%)]"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Conversations" value={stats.totalConvs} />
                <MetricCard label="Messages" value={stats.totalMessages} />
                <MetricCard label="Active Model" value={settings.selectedModel || "None"} />
                <MetricCard label="Session Uptime" value={formatUptime(uptime)} />
                <MetricCard label="Tool Calls" value={stats.toolCalls} />
                <MetricCard label="Feedback Given" value={stats.feedbackTotal} sub={stats.feedbackTotal > 0 ? `${stats.positivePct}% positive` : undefined} />
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-[hsl(265_15%_36%)]">
                  <Activity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">Start chatting to see analytics</p>
                </div>
              ) : (
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-2">Recent Conversations</div>
                  <div className="space-y-1.5">
                    {sessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[hsl(258_25%_9%)] border border-[hsl(260_18%_14%)]">
                        <span className="text-[11px] text-[hsl(270_20%_80%)] truncate flex-1">{s.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-[9px] text-[hsl(265_15%_36%)]">{s.messages.length} msgs</span>
                          {s.totalTokens != null && s.totalTokens > 0 && (
                            <span className="text-[9px] text-[hsl(265_15%_36%)]">{(s.totalTokens / 1000).toFixed(1)}k tokens</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tokens Tab */}
          {tab === "tokens" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Tokens" value={stats.totalTokens.toLocaleString()} />
                <MetricCard label="Avg / Response" value={stats.avgTokensPerMsg.toLocaleString()} />
                <MetricCard label="Budget Usage" value={`${stats.budgetPct}%`} sub={`of ${(65536 / 1024).toFixed(0)}k per conversation`} />
                <MetricCard label="Conversations" value={stats.totalConvs} sub="with token data" />
              </div>

              {sessions.length > 0 && (
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-3">Per Conversation</div>
                  <div className="space-y-2">
                    {sessions.slice(0, 10).map((s) => (
                      <SimpleBar
                        key={s.id}
                        label={s.title.slice(0, 30)}
                        value={s.totalTokens ?? 0}
                        max={Math.max(...sessions.map((x) => x.totalTokens ?? 0), 1)}
                        color={
                          (s.totalTokens ?? 0) / 65536 > 0.8 ? "bg-red-500" :
                          (s.totalTokens ?? 0) / 65536 > 0.5 ? "bg-yellow-500" : "bg-purple-600"
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {tab === "tools" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Calls" value={stats.toolCalls} />
                <MetricCard label="Unique Tools" value={Object.keys(stats.toolMap).length} />
              </div>

              {Object.keys(stats.toolMap).length > 0 ? (
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-3">Usage by Tool</div>
                  <div className="space-y-2">
                    {Object.entries(stats.toolMap)
                      .sort((a, b) => b[1].calls - a[1].calls)
                      .map(([name, data]) => (
                        <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[hsl(258_25%_9%)] border border-[hsl(260_18%_14%)]">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-[11px] text-[hsl(270_20%_80%)] flex-1">{name}</span>
                          <span className="text-[10px] font-semibold text-purple-400">{data.calls}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[hsl(265_15%_36%)]">
                  <Wrench size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">No tool calls recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {tab === "skills" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Skill Executions" value={Object.values(stats.skillMap).reduce((a, b) => a + b, 0)} />
                <MetricCard label="Unique Skills" value={Object.keys(stats.skillMap).length} />
              </div>

              {Object.keys(stats.skillMap).length > 0 ? (
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-3">Skill Usage</div>
                  <div className="space-y-2">
                    {Object.entries(stats.skillMap)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => (
                        <SimpleBar
                          key={name}
                          label={name}
                          value={count}
                          max={Math.max(...Object.values(stats.skillMap))}
                        />
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[hsl(265_15%_36%)]">
                  <Sparkles size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">No skill executions recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Conversations Tab */}
          {tab === "conversations" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total" value={stats.totalConvs} />
                <MetricCard label="Active Today" value={stats.activeToday} />
                <MetricCard label="Avg Messages" value={stats.avgLength} sub="per conversation" />
                <MetricCard label="Total Messages" value={stats.totalMessages} />
              </div>

              {/* Persona distribution */}
              {Object.keys(stats.personaMap).length > 0 && (
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-3">By Persona</div>
                  <div className="space-y-2">
                    {Object.entries(stats.personaMap)
                      .sort((a, b) => b[1] - a[1])
                      .map(([persona, count]) => (
                        <SimpleBar
                          key={persona}
                          label={persona}
                          value={count}
                          max={Math.max(...Object.values(stats.personaMap))}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Mode distribution */}
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-3">Fast vs Expert Mode</div>
                <div className="space-y-2">
                  <SimpleBar label="Fast" value={stats.modeMap["fast"] ?? 0} max={stats.totalConvs} color="bg-blue-500" />
                  <SimpleBar label="Expert" value={stats.modeMap["expert"] ?? 0} max={stats.totalConvs} color="bg-purple-600" />
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab (flow-18 #6) */}
          {tab === "feedback" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Total Feedback" value={stats.feedbackTotal} />
                <MetricCard
                  label="Positive Rate"
                  value={stats.feedbackTotal > 0 ? `${stats.positivePct}%` : "—"}
                  sub={`${stats.positiveFeedback} positive / ${stats.negativeFeedback} negative`}
                />
              </div>

              {stats.feedbackTotal === 0 ? (
                <div className="text-center py-8 text-[hsl(265_15%_36%)]">
                  <ThumbsUp size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">No feedback given yet</p>
                  <p className="text-[9px] mt-1 text-[hsl(265_15%_28%)]">Use thumbs-up/down on assistant messages</p>
                </div>
              ) : (
                <>
                  {/* Feedback bars */}
                  <div className="space-y-2">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-2">Rating Overview</div>
                    <SimpleBar label="Positive" value={stats.positiveFeedback} max={stats.feedbackTotal} color="bg-green-500" />
                    <SimpleBar label="Negative" value={stats.negativeFeedback} max={stats.feedbackTotal} color="bg-red-500" />
                  </div>

                  {/* Negative reasons breakdown */}
                  {stats.allFeedback.some((f) => f.reason) && (
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-2">Negative Reasons</div>
                      {(() => {
                        const reasonMap: Record<string, number> = {};
                        for (const f of stats.allFeedback) {
                          if (f.rating === "negative" && f.reason) {
                            reasonMap[f.reason] = (reasonMap[f.reason] ?? 0) + 1;
                          }
                        }
                        const maxR = Math.max(...Object.values(reasonMap), 1);
                        return (
                          <div className="space-y-1.5">
                            {Object.entries(reasonMap)
                              .sort((a, b) => b[1] - a[1])
                              .map(([reason, count]) => (
                                <SimpleBar key={reason} label={reason} value={count} max={maxR} color="bg-orange-500" />
                              ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Recent feedback */}
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(265_15%_35%)] mb-2">Recent Feedback</div>
                    <div className="space-y-1.5">
                      {stats.allFeedback.slice(-5).reverse().map((f, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[hsl(258_25%_9%)] border border-[hsl(260_18%_14%)]">
                          {f.rating === "positive"
                            ? <ThumbsUp size={11} className="text-green-500 flex-shrink-0 mt-0.5" />
                            : <ThumbsDown size={11} className="text-red-400 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            {f.reason && <span className="text-[10px] text-[hsl(270_20%_75%)]">{f.reason}</span>}
                            {f.comment && <p className="text-[9px] text-[hsl(265_15%_40%)] mt-0.5 truncate">{f.comment}</p>}
                            {!f.reason && !f.comment && (
                              <span className="text-[10px] text-[hsl(265_15%_40%)]">
                                {f.rating === "positive" ? "Helpful response" : "Not helpful"}
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] text-[hsl(265_15%_30%)] flex-shrink-0">
                            {new Date(f.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
