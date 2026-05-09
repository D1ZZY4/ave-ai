/**
 * Diagram 1, 18, 28: Injection Detector — detect prompt injection attempts.
 * Protects against jailbreaks, persona hijacking, and system prompt overrides.
 */

interface InjectionPattern {
  source: string;
  pattern: RegExp;
  confidence: number;
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  { source: "ignore_previous", pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i, confidence: 0.9 },
  { source: "forget_everything", pattern: /forget\s+(everything|all|your)\s+(above|previous|prior)/i, confidence: 0.9 },
  { source: "you_are_now", pattern: /you\s+are\s+now\s+(a|an|the)\s+\w/i, confidence: 0.7 },
  { source: "system_prefix", pattern: /^(system|admin|root)\s*:/im, confidence: 0.85 },
  { source: "act_as", pattern: /\bact\s+as\s+(if\s+you('re|are)|a|an|the)\b/i, confidence: 0.65 },
  { source: "disregard", pattern: /disregard\s+(your|all|the|previous)/i, confidence: 0.8 },
  { source: "new_persona", pattern: /new\s+persona\b/i, confidence: 0.75 },
  { source: "jailbreak", pattern: /\bjailbreak\b/i, confidence: 0.95 },
  { source: "dan_mode", pattern: /\bdan\s+mode\b/i, confidence: 0.95 },
  { source: "developer_mode", pattern: /developer\s+mode\s+(enabled|on|activated)/i, confidence: 0.95 },
  { source: "system_bracket", pattern: /\[system\]/i, confidence: 0.85 },
  { source: "pretend", pattern: /pretend\s+(you\s+are|to\s+be|that\s+you)/i, confidence: 0.7 },
  { source: "override_rules", pattern: /override\s+(your\s+)?(safety|guidelines|rules|instructions)/i, confidence: 0.9 },
  { source: "token_manipulation", pattern: /<\|?(im_start|im_end|endoftext|system)\|?>/i, confidence: 1.0 },
];

export interface InjectionDetectionResult {
  hasInjection: boolean;
  patterns: string[];
  confidence: number;
}

export function detectInjection(text: string): InjectionDetectionResult {
  const matched: Array<{ source: string; confidence: number }> = [];

  for (const { source, pattern, confidence } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      matched.push({ source, confidence });
    }
  }

  const maxConfidence = matched.length > 0
    ? Math.min(matched.reduce((acc, m) => acc + m.confidence * 0.5, matched[0].confidence), 1)
    : 0;

  return {
    hasInjection: matched.length > 0,
    patterns: matched.map((m) => m.source),
    confidence: maxConfidence,
  };
}
