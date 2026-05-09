/**
 * Diagram 26: Tool Result Cache — in-memory Map with TTL and LRU eviction.
 * Used to cache tool results and avoid redundant calls.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class TTLCache<T = string> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(maxSize = 100, defaultTtlMs = 300_000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxSize) {
      this.evictExpired();
      if (this.store.size >= this.maxSize) {
        const firstKey = this.store.keys().next().value;
        if (firstKey) this.store.delete(firstKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      hits: 0,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  stats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }
}

export function makeCacheKey(toolName: string, args: Record<string, unknown>): string {
  return `${toolName}:${JSON.stringify(args)}`;
}

export const toolResultCache = new TTLCache<string>(200, 300_000);
