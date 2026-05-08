interface WindowEntry {
  timestamps: number[];
  maxPerMinute: number;
}

const windows = new Map<string, WindowEntry>();

export function initRateLimit(toolName: string, maxPerMinute: number): void {
  if (!windows.has(toolName)) {
    windows.set(toolName, { timestamps: [], maxPerMinute });
  }
}

export function checkRateLimit(toolName: string): boolean {
  const entry = windows.get(toolName);
  if (!entry) return true;

  const now = Date.now();
  const windowStart = now - 60000;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  return entry.timestamps.length < entry.maxPerMinute;
}

export function recordUsage(toolName: string): void {
  const entry = windows.get(toolName);
  if (!entry) return;
  entry.timestamps.push(Date.now());
}

export function getRemainingSlots(toolName: string): number {
  const entry = windows.get(toolName);
  if (!entry) return Infinity;
  const now = Date.now();
  const windowStart = now - 60000;
  const recent = entry.timestamps.filter((t) => t > windowStart);
  return Math.max(0, entry.maxPerMinute - recent.length);
}
