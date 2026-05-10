/**
 * parse-choose-option-to-ui — converts an Ollama tool-call "choose_option" response
 * into the UI payload consumed by ChoiceCards.
 */

export interface ChooseOptionPayload {
  question: string;
  options: { index: number; label: string; description?: string }[];
}

/**
 * Transform raw choose_option arguments from a tool call into a ChooseOptionPayload.
 * Falls back gracefully if the payload is malformed.
 */
export function parseChooseOptionToUi(
  args: Record<string, unknown>
): ChooseOptionPayload | null {
  const question = typeof args.question === "string" ? args.question : "";
  const raw = args.options;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const options = (raw as unknown[])
    .map((item, i) => {
      if (typeof item === "string") {
        return { index: i + 1, label: item };
      }
      if (typeof item === "object" && item !== null) {
        const o = item as Record<string, unknown>;
        return {
          index: typeof o.index === "number" ? o.index : i + 1,
          label: typeof o.label === "string" ? o.label : String(o.label ?? `Option ${i + 1}`),
          description: typeof o.description === "string" ? o.description : undefined,
        };
      }
      return { index: i + 1, label: String(item) };
    })
    .filter((o) => o.label.trim().length > 0);

  if (options.length === 0) return null;
  return { question, options };
}
