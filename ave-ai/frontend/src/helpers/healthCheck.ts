/**
 * Diagram 53: Ollama Health Check & Reconnect.
 * Caches last known status for 30s to avoid hammering the proxy.
 */

export type HealthStatus = "ok" | "fail" | "unknown";

let lastStatus: HealthStatus = "unknown";
let lastCheckAt = 0;
const CACHE_MS = 30_000;

function proxyBase(): string {
  const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/api`;
}

export async function checkOllamaHealth(
  baseUrl: string,
  signal?: AbortSignal
): Promise<HealthStatus> {
  const now = Date.now();
  if (lastStatus === "ok" && now - lastCheckAt < CACHE_MS) return "ok";

  try {
    const url = `${proxyBase()}/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}`;
    const res = await fetch(url, {
      signal: signal ?? AbortSignal.timeout(8_000),
    });
    lastStatus = res.ok ? "ok" : "fail";
  } catch {
    if (!signal?.aborted) lastStatus = "fail";
  }

  lastCheckAt = Date.now();
  return lastStatus;
}

export function getLastHealthStatus(): HealthStatus {
  return lastStatus;
}

export function invalidateHealthCache(): void {
  lastCheckAt = 0;
  lastStatus = "unknown";
}

export function setHealthStatus(status: HealthStatus): void {
  lastStatus = status;
  lastCheckAt = Date.now();
}
