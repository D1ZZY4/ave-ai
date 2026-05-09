/**
 * Diagram 43 — Model Warm-Up
 * Pre-loads a model into Ollama memory so the first user message
 * responds faster. Uses keep_alive param with a short payload.
 */

function proxyBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

let warmingModel: string | null = null;

export async function warmUpModel(
  baseUrl: string,
  modelName: string,
  signal?: AbortSignal
): Promise<void> {
  if (!modelName || !baseUrl) return;
  if (warmingModel === modelName) return;
  warmingModel = modelName;

  try {
    const res = await fetch(
      `${proxyBase()}/ollama/chat?baseUrl=${encodeURIComponent(baseUrl)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: "." }],
          keep_alive: "10m",
          stream: false,
          options: { num_predict: 1 },
        }),
        signal: signal ?? AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[warmUpModel] Warm-up failed for ${modelName}: HTTP ${res.status} ${body}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name !== "AbortError") {
      console.warn(`[warmUpModel] Could not warm up model ${modelName}:`, err.message);
    }
  } finally {
    warmingModel = null;
  }
}
