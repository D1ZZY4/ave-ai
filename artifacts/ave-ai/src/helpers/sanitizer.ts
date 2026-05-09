/**
 * Diagram 1, 28: Sanitizer — strip dangerous content from text.
 * No DOMPurify dependency — pure regex-based sanitization.
 */

/**
 * Strip HTML tags and control characters from user input.
 * Truncates to maxLength characters.
 */
export function sanitizeInput(input: string, maxLength = 8192): string {
  return input
    .replace(/<[^>]{0,500}>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Escape HTML entities for safe display in the UI.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalize whitespace in a string.
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Truncate text to a maximum number of tokens (approximate).
 * ~4 chars per token.
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[... truncated for context window ...]";
}
