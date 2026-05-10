import { useState } from "react";
import { X, Save, RotateCcw, Plus, Trash2, CheckCircle, XCircle, Loader, Bell, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, type AppTheme } from "../../store/settings";
import { useModels } from "../../hooks/useModels";
import { Switch } from "@/components/ui/switch";
import { ALL_PERSONAS } from "../../../../agents/personas/index";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1 pr-4 min-w-0">
        <div className="text-[12px] font-medium text-[hsl(270_20%_85%)]">{label}</div>
        <div className="text-[10px] text-[hsl(265_15%_40%)] mt-0.5 leading-snug">{description}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-purple-600 flex-shrink-0 scale-90"
      />
    </div>
  );
}

type Tab = "connection" | "display" | "capabilities" | "personas";

const THEMES: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun size={13} /> },
  { id: "system", label: "System", icon: <Monitor size={13} /> },
  { id: "dark", label: "Dark", icon: <Moon size={13} /> },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [username, setUsername] = useState(settings.username);
  const [newModel, setNewModel] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [activeTab, setActiveTab] = useState<Tab>("connection");
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [personaPromptDraft, setPersonaPromptDraft] = useState("");

  const { models, loading: modelsLoading, refetch } = useModels();

  const handleSave = () => {
    updateSettings({
      baseUrl: baseUrl.trim() || "http://localhost:11434",
      username: username.trim() || "you",
    });
    onClose();
  };

  const handleTest = async () => {
    setTestStatus("testing");
    try {
      const res = await fetch(
        `/api/ollama/models?baseUrl=${encodeURIComponent(baseUrl.trim() || "http://localhost:11434")}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        updateSettings({ baseUrl: baseUrl.trim() || "http://localhost:11434" });
        refetch();
        setTestStatus("ok");
      } else {
        setTestStatus("fail");
      }
    } catch {
      setTestStatus("fail");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  const addCustomModel = () => {
    const name = newModel.trim();
    if (!name) return;
    const existing = settings.customModels ?? [];
    if (!existing.includes(name)) {
      updateSettings({ customModels: [...existing, name] });
    }
    setNewModel("");
  };

  const removeCustomModel = (name: string) => {
    updateSettings({
      customModels: (settings.customModels ?? []).filter((m) => m !== name),
    });
    if (settings.selectedModel === name) {
      updateSettings({ selectedModel: "" });
    }
  };

  const savePersonaOverride = (personaId: string) => {
    const overrides = { ...(settings.systemPromptOverrides ?? {}) };
    if (personaPromptDraft.trim()) {
      overrides[personaId] = personaPromptDraft.trim();
    } else {
      delete overrides[personaId];
    }
    updateSettings({ systemPromptOverrides: overrides });
    setEditingPersonaId(null);
  };

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "connection", label: "Connection" },
    { id: "display", label: "Display" },
    { id: "capabilities", label: "Capabilities" },
    { id: "personas", label: "Personas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[hsl(258_28%_8%)] border border-[hsl(260_18%_16%)] rounded-t-3xl sm:rounded-3xl shadow-2xl slide-up max-h-[92vh] overflow-y-auto scrollbar-hide">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[hsl(260_18%_13%)] sticky top-0 bg-[hsl(258_28%_8%)] z-10">
          <h2 className="text-[13px] font-semibold text-[hsl(270_20%_90%)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[hsl(265_15%_40%)] hover:text-white hover:bg-[hsl(260_20%_13%)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[hsl(260_18%_13%)] px-4 gap-1 pt-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "pb-2 px-1.5 text-[10px] font-semibold uppercase tracking-wider border-b-2 transition-colors",
                activeTab === t.id
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-[hsl(265_15%_42%)] hover:text-[hsl(270_20%_70%)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 space-y-4">

          {/* ── CONNECTION TAB ── */}
          {activeTab === "connection" && (
            <>
              {/* Ollama Base URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
                    Ollama Base URL
                  </label>
                  <button
                    onClick={handleTest}
                    disabled={testStatus === "testing"}
                    className={cn(
                      "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border transition-colors",
                      testStatus === "ok"
                        ? "border-green-700 text-green-400"
                        : testStatus === "fail"
                        ? "border-red-700 text-red-400"
                        : "border-[hsl(260_18%_20%)] text-[hsl(265_15%_42%)] hover:text-purple-300 hover:border-purple-700"
                    )}
                  >
                    {testStatus === "testing" && <Loader size={9} className="animate-spin" />}
                    {testStatus === "ok" && <CheckCircle size={9} />}
                    {testStatus === "fail" && <XCircle size={9} />}
                    {testStatus === "testing" ? "Testing..." : testStatus === "ok" ? "Connected" : testStatus === "fail" ? "Failed" : "Test connection"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl(e.target.value); setTestStatus("idle"); }}
                    placeholder="http://localhost:11434"
                    className="flex-1 px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_32%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors font-mono"
                  />
                  <button
                    onClick={() => setBaseUrl("http://localhost:11434")}
                    className="p-2 rounded-xl border border-[hsl(260_18%_18%)] text-[hsl(265_15%_40%)] hover:text-purple-300 hover:border-[hsl(270_45%_32%)] transition-colors"
                    title="Reset to default"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-[hsl(265_15%_35%)] leading-snug">
                  Supports local Ollama, VPS, Cloudflare tunnels, and ngrok/Kaggle URLs.
                </p>
              </div>

              {/* Models */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
                    Models
                  </label>
                  <button
                    onClick={() => { refetch(); updateSettings({ baseUrl: baseUrl.trim() || "http://localhost:11434" }); }}
                    disabled={modelsLoading}
                    className="text-[10px] text-[hsl(265_15%_42%)] hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    {modelsLoading
                      ? <><Loader size={9} className="animate-spin" /> Fetching...</>
                      : `${models.length} found — refresh`}
                  </button>
                </div>

                {models.filter((m) => !m.isCustom).length > 0 && (
                  <div className="rounded-xl border border-[hsl(260_18%_16%)] divide-y divide-[hsl(260_18%_13%)] overflow-hidden">
                    {models.filter((m) => !m.isCustom).map((m) => (
                      <button
                        key={m.name}
                        onClick={() => { updateSettings({ selectedModel: m.name }); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-left transition-colors text-[11px]",
                          settings.selectedModel === m.name
                            ? "bg-[hsl(268_30%_13%)] text-purple-300"
                            : "text-[hsl(270_20%_75%)] hover:bg-[hsl(260_20%_11%)]"
                        )}
                      >
                        <span className="font-mono">{m.name}</span>
                        <div className="flex items-center gap-2">
                          {m.paramSize && <span className="text-[9px] text-[hsl(265_15%_38%)]">{m.paramSize}</span>}
                          {settings.selectedModel === m.name && <CheckCircle size={11} className="text-purple-400" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!modelsLoading && models.filter((m) => !m.isCustom).length === 0 && (
                  <div className="rounded-xl border border-dashed border-[hsl(260_18%_16%)] px-3 py-3 text-center">
                    <p className="text-[10px] text-[hsl(265_15%_38%)]">
                      No models detected. Check your URL or add a model name manually.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-[10px] text-[hsl(265_15%_38%)]">Add model by name</div>
                  <div className="flex gap-2">
                    <input
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomModel()}
                      placeholder="e.g. llama3.2, qwen3:8b, mistral"
                      className="flex-1 px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_30%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors font-mono"
                    />
                    <button
                      onClick={addCustomModel}
                      disabled={!newModel.trim()}
                      className="p-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  {(settings.customModels ?? []).length > 0 && (
                    <div className="rounded-xl border border-[hsl(260_18%_16%)] divide-y divide-[hsl(260_18%_13%)] overflow-hidden">
                      {(settings.customModels ?? []).map((name) => (
                        <div key={name} className="flex items-center justify-between px-3 py-2">
                          <button
                            onClick={() => updateSettings({ selectedModel: name })}
                            className={cn("flex-1 text-left font-mono text-[11px]", settings.selectedModel === name ? "text-purple-300" : "text-[hsl(270_20%_70%)]")}
                          >
                            {name}
                            <span className="ml-2 text-[9px] text-[hsl(265_15%_35%)]">manual</span>
                          </button>
                          <div className="flex items-center gap-1.5">
                            {settings.selectedModel === name && <CheckCircle size={11} className="text-purple-400" />}
                            <button onClick={() => removeCustomModel(name)} className="p-1 text-[hsl(265_15%_35%)] hover:text-red-400 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">Display Name</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you"
                  className="w-full px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_32%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors"
                />
              </div>

              {/* Max output tokens — Diagram 54 */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
                  Max Output Tokens
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={256}
                    max={8192}
                    step={256}
                    value={settings.maxOutputTokens}
                    onChange={(e) => updateSettings({ maxOutputTokens: Number(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                  <span className="text-[11px] text-purple-300 font-mono w-12 text-right">{settings.maxOutputTokens}</span>
                </div>
                <p className="text-[10px] text-[hsl(265_15%_35%)]">Controls num_predict sent to Ollama. Higher = longer responses.</p>
              </div>
            </>
          )}

          {/* ── DISPLAY TAB ── */}
          {activeTab === "display" && (
            <div className="divide-y divide-[hsl(260_18%_13%)]">

              {/* Diagram 50: Theme selector */}
              <div className="py-2.5">
                <div className="text-[12px] font-medium text-[hsl(270_20%_85%)] mb-1">Theme</div>
                <div className="text-[10px] text-[hsl(265_15%_40%)] mb-2">Choose dark, light, or follow system preference</div>
                <div className="flex gap-1.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSettings({ theme: t.id })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-medium transition-all",
                        settings.theme === t.id
                          ? "border-purple-600 bg-[hsl(270_60%_18%/0.5)] text-purple-300"
                          : "border-[hsl(260_18%_18%)] text-[hsl(265_15%_45%)] hover:border-[hsl(260_18%_26%)] hover:text-white"
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow
                label="Show process log"
                description="Skill, persona, rules, and mode info shown with each response"
                checked={settings.showProcessLog}
                onChange={(v) => updateSettings({ showProcessLog: v })}
              />
              <ToggleRow
                label="Show thinking"
                description="Real-time reasoning display while the model thinks"
                checked={settings.showThinking}
                onChange={(v) => updateSettings({ showThinking: v })}
              />
              <ToggleRow
                label="Auto-greeting"
                description="Ave AI sends a brief greeting at the start of each new conversation"
                checked={settings.autoGreeting}
                onChange={(v) => updateSettings({ autoGreeting: v })}
              />
              <div className="py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4 min-w-0">
                    <div className="text-[12px] font-medium text-[hsl(270_20%_85%)] flex items-center gap-1.5">
                      <Bell size={12} className="text-[hsl(265_15%_45%)]" />
                      Response notifications
                    </div>
                    <div className="text-[10px] text-[hsl(265_15%_40%)] mt-0.5 leading-snug">
                      Browser notification + vibration when AI finishes
                    </div>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(v) => updateSettings({ enableNotifications: v })}
                    className="data-[state=checked]:bg-purple-600 flex-shrink-0 scale-90"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── CAPABILITIES TAB ── */}
          {activeTab === "capabilities" && (
            <div className="divide-y divide-[hsl(260_18%_13%)]">
              <ToggleRow
                label="Enable thinking"
                description="Send reasoning instructions (requires qwen3, deepseek-r1, etc.)"
                checked={settings.enableThinking}
                onChange={(v) => updateSettings({ enableThinking: v })}
              />
              <ToggleRow
                label="Enable tools"
                description="Let the model call built-in tools (calculator, time)"
                checked={settings.enableTools}
                onChange={(v) => updateSettings({ enableTools: v })}
              />
              <ToggleRow
                label="Web search tool"
                description="Expose web_search to the model when Expert mode tools are enabled"
                checked={settings.enableWebSearch}
                onChange={(v) => updateSettings({ enableWebSearch: v })}
              />
              <ToggleRow
                label="Long-term memory"
                description="Extract and inject user facts across conversations via IndexedDB"
                checked={settings.memoryEnabled}
                onChange={(v) => updateSettings({ memoryEnabled: v })}
              />
            </div>
          )}

          {/* ── PERSONAS TAB — Diagram 52: System prompt customization ── */}
          {activeTab === "personas" && (
            <div className="space-y-3">
              <p className="text-[10px] text-[hsl(265_15%_38%)] leading-snug">
                Override the system prompt for each persona. Leave blank to use the default.
              </p>
              {ALL_PERSONAS.map((persona) => {
                const override = settings.systemPromptOverrides?.[persona.id] ?? "";
                const hasOverride = !!override;
                const isEditing = editingPersonaId === persona.id;

                return (
                  <div key={persona.id} className="rounded-xl border border-[hsl(260_18%_16%)] overflow-hidden">
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5",
                        hasOverride ? "bg-[hsl(268_30%_10%)]" : ""
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[hsl(270_20%_85%)]">{persona.name}</span>
                        {hasOverride && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-400 border border-purple-800/50">
                            custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasOverride && (
                          <button
                            onClick={() => {
                              const overrides = { ...(settings.systemPromptOverrides ?? {}) };
                              delete overrides[persona.id];
                              updateSettings({ systemPromptOverrides: overrides });
                            }}
                            className="text-[10px] text-[hsl(265_15%_38%)] hover:text-red-400 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingPersonaId(isEditing ? null : persona.id);
                            setPersonaPromptDraft(override || persona.systemPrompt);
                          }}
                          className="text-[10px] text-[hsl(265_15%_42%)] hover:text-purple-300 transition-colors px-2 py-0.5 rounded-lg border border-[hsl(260_18%_18%)] hover:border-purple-700"
                        >
                          {isEditing ? "Cancel" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="px-3 pb-2.5">
                        <p className="text-[10px] text-[hsl(265_15%_38%)] line-clamp-2 leading-snug">
                          {override || persona.systemPrompt}
                        </p>
                      </div>
                    )}

                    {isEditing && (
                      <div className="px-3 pb-3 space-y-2 border-t border-[hsl(260_18%_13%)]">
                        <textarea
                          value={personaPromptDraft}
                          onChange={(e) => setPersonaPromptDraft(e.target.value)}
                          rows={5}
                          className="w-full mt-2 px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[11px] text-[hsl(270_20%_85%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors resize-none leading-relaxed"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPersonaId(null)}
                            className="flex-1 py-1.5 rounded-lg border border-[hsl(260_18%_18%)] text-[11px] text-[hsl(265_15%_45%)] hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => savePersonaOverride(persona.id)}
                            className="flex-1 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-[11px] transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[hsl(260_18%_13%)] flex gap-2 sticky bottom-0 bg-[hsl(258_28%_8%)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(265_15%_50%)] hover:text-white hover:border-[hsl(260_18%_26%)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-medium transition-colors"
          >
            <Save size={12} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
