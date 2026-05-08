interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function hashParams(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}

export function cacheGet(toolName: string, params: Record<string, unknown>): string | null {
  const key = `${toolName}::${hashParams(params)}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(toolName: string, params: Record<string, unknown>, value: string, ttlMs = 60000): void {
  const key = `${toolName}::${hashParams(params)}`;
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheClear(): void {
  cache.clear();
}

export function cacheSize(): number {
  return cache.size;
}
