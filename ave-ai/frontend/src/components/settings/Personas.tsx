/**
 * flow-9 diagram 12: Settings → Personas tab.
 * List all personas with descriptions; edit system prompt override per persona.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "../../store/settings";
import { ALL_PERSONAS } from "../../../../agents/personas/index";

export function Personas() {
  const { settings, updateSettings } = useSettings();
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [personaPromptDraft, setPersonaPromptDraft] = useState("");

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

  const resetOverride = (personaId: string) => {
    const overrides = { ...(settings.systemPromptOverrides ?? {}) };
    delete overrides[personaId];
    updateSettings({ systemPromptOverrides: overrides });
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-[hsl(265_15%_38%)] leading-snug">
        Override the system prompt for each persona. Leave blank to use the default.
      </p>
      {ALL_PERSONAS.map((persona) => {
        const override = settings.systemPromptOverrides?.[persona.id] ?? "";
        const hasOverride = !!override;
        const isEditing = editingPersonaId === persona.id;

        return (
          <div
            key={persona.id}
            className="rounded-xl border border-[hsl(260_18%_16%)] overflow-hidden"
          >
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2.5",
                hasOverride ? "bg-[hsl(268_30%_10%)]" : ""
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[hsl(270_20%_85%)]">
                  {persona.name}
                </span>
                {hasOverride && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-400 border border-purple-800/50">
                    custom
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {hasOverride && (
                  <button
                    onClick={() => resetOverride(persona.id)}
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
  );
}
