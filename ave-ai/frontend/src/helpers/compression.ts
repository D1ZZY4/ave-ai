/**
 * Diagram 15: Session Compression — trim oldest messages when token budget > 70%.
 * Keeps the system prompt and the most recent messages, removing oldest exchanges.
 */

import { estimateTokens, compressionTargetTokens } from "./tokenizer";
import type { OllamaMessage } from "./ollama";

export interface CompressionResult {
  messages: OllamaMessage[];
  wasCompressed: boolean;
  removedCount: number;
  tokensBefore: number;
  tokensAfter: number;
}

/**
 * Compress message history to stay within token budget.
 * Never removes the system message or the last 4 messages (2 exchanges).
 */
export function compressHistory(
  messages: OllamaMessage[],
  targetTokens?: number
): CompressionResult {
  const target = targetTokens ?? compressionTargetTokens();
  const tokensBefore = messages.reduce((t, m) => t + estimateTokens(m.content) + 4, 0);

  if (tokensBefore <= target) {
    return { messages, wasCompressed: false, removedCount: 0, tokensBefore, tokensAfter: tokensBefore };
  }

  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystem = messages.filter((m) => m.role !== "system");

  let compressed = [...nonSystem];
  let removedCount = 0;

  while (compressed.length > 4) {
    const systemTokens = systemMsg ? estimateTokens(systemMsg.content) + 4 : 0;
    const bodyTokens = compressed.reduce((t, m) => t + estimateTokens(m.content) + 4, 0);
    if (systemTokens + bodyTokens <= target) break;

    compressed = compressed.slice(2);
    removedCount += 2;
  }

  const finalMessages: OllamaMessage[] = systemMsg ? [systemMsg, ...compressed] : compressed;
  const tokensAfter = finalMessages.reduce((t, m) => t + estimateTokens(m.content) + 4, 0);

  return { messages: finalMessages, wasCompressed: removedCount > 0, removedCount, tokensBefore, tokensAfter };
}
