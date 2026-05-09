/**
 * Diagram 27: Sliding Window Rate Limiter.
 * Tracks request timestamps per key within a rolling time window.
 */

interface RateLimitBucket {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  /**
   * Try to consume one request slot for the given key.
   * Returns true if allowed, false if rate limit exceeded.
   */
  tryConsume(key: string, limit = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(key, bucket);
    }

    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

    if (bucket.timestamps.length >= limit) return false;
    bucket.timestamps.push(now);
    return true;
  }

  /**
   * How many requests are left in the current window.
   */
  remaining(key: string, limit = 10, windowMs = 60_000): number {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket) return limit;
    const active = bucket.timestamps.filter((t) => now - t < windowMs);
    return Math.max(0, limit - active.length);
  }

  /**
   * Reset rate limit for a specific key.
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Reset all rate limits.
   */
  resetAll(): void {
    this.buckets.clear();
  }

  /**
   * Time in ms until the next slot is available.
   */
  retryAfterMs(key: string, limit = 10, windowMs = 60_000): number {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.timestamps.length < limit) return 0;
    const sorted = [...bucket.timestamps].sort();
    const oldest = sorted[sorted.length - limit];
    return Math.max(0, oldest + windowMs - now);
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

export const TOOL_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  calculator: { limit: 20, windowMs: 60_000 },
  current_time: { limit: 30, windowMs: 60_000 },
  web_search: { limit: 5, windowMs: 60_000 },
  default: { limit: 10, windowMs: 60_000 },
};
