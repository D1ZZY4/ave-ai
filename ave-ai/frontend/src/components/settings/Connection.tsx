/**
 * flow-9 diagram 12: Settings → Connection tab.
 * Ollama base URL, model selection, display name, max output tokens.
 */
import { useState } from "react";
import { RotateCcw, Plus, Trash2, CheckCircle, XCircle, Loader, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "../../store/settings";
import { useModels } from "../../hooks/useModels";

export function Connection() {
  const { settings, updateSettings } = useSettings();
  const { models, loading: modelsLoading, refetch } = useModels();

  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [username, setUsername] = useState(settings.username);
  const [newModel, setNewModel] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

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

  const handleSave = () => {
    updateSettings({
      baseUrl: baseUrl.trim() || "http://localhost:11434",
      username: username.trim() || "you",
    });
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

  return (
    <div className="space-y-4">
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
            {testStatus === "testing"
              ? "Testing..."
              : testStatus === "ok"
              ? "Connected"
              : testStatus === "fail"
              ? "Failed"
              : "Test connection"}
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
                onClick={() => updateSettings({ selectedModel: m.name })}
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
                    className={cn(
                      "flex-1 text-left font-mono text-[11px]",
                      settings.selectedModel === name ? "text-purple-300" : "text-[hsl(270_20%_70%)]"
                    )}
                  >
                    {name}
                    <span className="ml-2 text-[9px] text-[hsl(265_15%_35%)]">manual</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    {settings.selectedModel === name && <CheckCircle size={11} className="text-purple-400" />}
                    <button
                      onClick={() => removeCustomModel(name)}
                      className="p-1 text-[hsl(265_15%_35%)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(265_15%_42%)]">
          Display Name
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="you"
          className="w-full px-3 py-2 rounded-xl bg-[hsl(258_25%_6%)] border border-[hsl(260_18%_18%)] text-[12px] text-[hsl(270_20%_85%)] placeholder:text-[hsl(265_15%_32%)] outline-none focus:border-[hsl(270_45%_42%)] transition-colors"
        />
      </div>

      {/* Max Output Tokens */}
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
          <span className="text-[11px] text-purple-300 font-mono w-12 text-right">
            {settings.maxOutputTokens}
          </span>
        </div>
        <p className="text-[10px] text-[hsl(265_15%_35%)]">
          Controls num_predict sent to Ollama. Higher = longer responses.
        </p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-[12px] font-medium transition-colors"
      >
        <Save size={12} />
        Save connection settings
      </button>
    </div>
  );
}
