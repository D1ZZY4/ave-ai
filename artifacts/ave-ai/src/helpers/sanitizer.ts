import DOMPurify from "dompurify";

/**
 * Diagram 28 — Security Hardening
 * Sanitize HTML output dari LLM menggunakan DOMPurify (XSS prevention).
 * React auto-escape mencegah XSS rendering, DOMPurify sebagai layer tambahan.
 */
export function sanitizeHtml(input: string): string {
  if (typeof window === "undefined") {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "code", "pre", "br", "p", "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeForLLM(input: string): string {
  return input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 8000);
}

export function sanitizeToolResult(result: string): string {
  return result
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 4000);
}
