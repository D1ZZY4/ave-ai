/**
 * Diagram 1, 18, 28: PII Detector — regex-based personal information detection.
 * Detects emails, phone numbers, SSNs, credit cards, IPs, and Indonesian NIKs.
 */

interface PiiPattern {
  name: string;
  pattern: RegExp;
  severity: "high" | "medium" | "low";
}

const PII_PATTERNS: PiiPattern[] = [
  { name: "email", pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, severity: "medium" },
  { name: "phone", pattern: /(\+?\d[\d\s\-().]{7,}\d)/g, severity: "medium" },
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: "high" },
  { name: "credit_card", pattern: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g, severity: "high" },
  { name: "ip_address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, severity: "low" },
  { name: "nik", pattern: /\b[1-9]\d{15}\b/g, severity: "high" },
  { name: "passport", pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, severity: "high" },
];

export interface PiiDetectionResult {
  hasPii: boolean;
  types: string[];
  highSeverityTypes: string[];
  redacted: string;
}

export function detectPii(text: string): PiiDetectionResult {
  const types: string[] = [];
  const highSeverityTypes: string[] = [];
  let redacted = text;

  for (const { name, pattern, severity } of PII_PATTERNS) {
    const cloned = new RegExp(pattern.source, pattern.flags);
    if (cloned.test(text)) {
      types.push(name);
      if (severity === "high") highSeverityTypes.push(name);
    }
    const replacePattern = new RegExp(pattern.source, pattern.flags);
    redacted = redacted.replace(replacePattern, `[${name.toUpperCase()}_REDACTED]`);
  }

  return { hasPii: types.length > 0, types, highSeverityTypes, redacted };
}
