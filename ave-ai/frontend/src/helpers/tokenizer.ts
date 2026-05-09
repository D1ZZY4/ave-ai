/**
 * Diagram 15, 22: Approximate token counter.
 * Uses a blend of character-based and word-based estimates (~4 chars/token average).
 * No tokenizer library needed — this is a fast approximation sufficient for budget tracking.
 */

export const TOKEN_BUDGET = 65536;
export const COMPRESSION_THRESHOLD = 0.70;
export const COMPRESSION_TARGET = 0.50;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil((charCount / 4 + wordCount * 1.3) / 2);
}

export function estimateMessagesTokens(
  messages: Array<{ role: string; content: string }>
): number {
  return messages.reduce((total, m) => total + estimateTokens(m.content) + 4, 0);
}

export function shouldCompress(totalTokens: number, budget = TOKEN_BUDGET): boolean {
  return totalTokens / budget >= COMPRESSION_THRESHOLD;
}

export function compressionTargetTokens(budget = TOKEN_BUDGET): number {
  return Math.floor(budget * COMPRESSION_TARGET);
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${tokens}`;
}
