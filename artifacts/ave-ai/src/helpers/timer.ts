export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exponentialBackoff(attempt: number, baseMs = 500, maxMs = 8000): number {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (attempt: number, error: Error) => void,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error("Aborted");

    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, lastError);
        const delay = exponentialBackoff(attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
