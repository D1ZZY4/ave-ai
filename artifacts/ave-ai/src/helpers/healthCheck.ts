/**
 * Diagram 53 — Ollama Health Check & Reconnect
 * Quick health check before any Ollama API call.
 */

export interface HealthCheckResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
  availableModels?: string[];
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

function proxyBase(): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api`;
}

export async function checkOllamaHealth(baseUrl: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(
      `${proxyBase()}/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json() as { models?: { name: string }[] };
    const models = data.models?.map((m) => m.name) ?? [];
    return { ok: true, latencyMs: Date.now() - start, availableModels: models };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function checkHealthWithRetry(
  baseUrl: string,
  onRetry?: (attempt: number) => void
): Promise<HealthCheckResult> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await checkOllamaHealth(baseUrl);
    if (result.ok) return result;
    if (attempt < MAX_RETRIES) {
      onRetry?.(attempt);
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt - 1)));
    }
  }
  return { ok: false, error: `Ollama unreachable after ${MAX_RETRIES} attempts` };
}

export function isModelQwen(modelName: string): boolean {
  return modelName.toLowerCase().includes("qwen");
}

export function isModelVisionCapable(modelName: string): boolean {
  const visionModels = ["qwen3.5-opus", "llava", "bakllava", "moondream", "minicpm-v"];
  const lower = modelName.toLowerCase();
  return visionModels.some((v) => lower.includes(v));
}
