import type { RuleResult } from "../types";

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{16}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+62|0)[0-9]{8,12}\b/,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
];

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /forget\s+(everything|all)\s+(above|before)/i,
  /you\s+are\s+now\s+(?:a\s+)?(?:DAN|jailbreak|unrestricted)/i,
  /\[\[?(system|human|assistant)\]?\]/i,
  /<\|(?:system|human|assistant|im_start|im_end)\|>/i,
  /prompt\s+injection/i,
  /override\s+(your\s+)?(safety|rules|instructions)/i,
];

const TOXICITY_KEYWORDS = [
  "kill", "murder", "rape", "bomb", "explosive", "weapon", "drug synthesis",
  "child porn", "cp", "self-harm", "suicide method",
];

export interface SafetyCheckResult {
  safe: boolean;
  flags: string[];
  sanitized?: string;
}

export function detectPII(text: string): boolean {
  return PII_PATTERNS.some((p) => p.test(text));
}

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function detectToxicity(text: string, threshold = 0.8): boolean {
  const lower = text.toLowerCase();
  const hits = TOXICITY_KEYWORDS.filter((kw) => lower.includes(kw));
  const score = hits.length / TOXICITY_KEYWORDS.length;
  return score >= threshold || hits.length >= 2;
}

export function maskPII(text: string): string {
  let result = text;
  result = result.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN-REDACTED]");
  result = result.replace(/\b\d{16}\b/g, "[CARD-REDACTED]");
  result = result.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL-REDACTED]");
  result = result.replace(/\b(?:\+62|0)[0-9]{8,12}\b/g, "[PHONE-REDACTED]");
  result = result.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[IP-REDACTED]");
  return result;
}

export function runSafetyCheck(text: string): SafetyCheckResult {
  const flags: string[] = [];

  if (detectPII(text)) flags.push("pii");
  if (detectInjection(text)) flags.push("injection");
  if (detectToxicity(text)) flags.push("toxicity");

  return {
    safe: flags.length === 0,
    flags,
    sanitized: flags.includes("pii") ? maskPII(text) : text,
  };
}

export function evaluateInputSafety(input: string): RuleResult {
  const check = runSafetyCheck(input);

  if (check.flags.includes("injection")) {
    return { decision: "deny", reason: "Prompt injection detected", reasonCode: "INJECTION_DETECTED" };
  }
  if (check.flags.includes("toxicity")) {
    return { decision: "deny", reason: "Toxic content detected", reasonCode: "TOXICITY_DETECTED" };
  }
  if (check.flags.includes("pii")) {
    return { decision: "modify", reason: "PII detected and masked", modifiedValue: check.sanitized };
  }

  return { decision: "allow" };
}

export function evaluateOutputSafety(output: string): RuleResult {
  const check = runSafetyCheck(output);

  if (check.flags.includes("toxicity")) {
    return { decision: "modify", reason: "Toxic output sanitized", modifiedValue: "[Content filtered for safety]" };
  }
  if (check.flags.includes("pii")) {
    return { decision: "modify", reason: "PII in output masked", modifiedValue: check.sanitized };
  }

  return { decision: "allow" };
}
