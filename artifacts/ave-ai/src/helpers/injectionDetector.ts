/**
 * Diagram 18 — Injection Detection (separate file per spec)
 * Detects prompt injection and jailbreak attempts.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+prompts/i,
  /forget\s+(everything|all)\s+(above|before|prior)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:DAN|jailbreak|unrestricted|evil|unfiltered)/i,
  /\[\[?(system|human|assistant)\]?\]/i,
  /<\|(?:system|human|assistant|im_start|im_end)\|>/i,
  /prompt\s+injection/i,
  /override\s+(your\s+)?(safety|rules|instructions|guidelines)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(?!Ave\s+AI)/i,
  /developer\s+note:/i,
  /system\s+prompt:/i,
  /jailbreak/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(training|instructions|rules)/i,
];

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function getInjectionPatterns(): string[] {
  return INJECTION_PATTERNS.map((p) => p.toString());
}
