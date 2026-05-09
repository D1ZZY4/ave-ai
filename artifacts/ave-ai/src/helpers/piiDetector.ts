/**
 * Diagram 18 — PII Detection (separate file per spec)
 * Detects personally identifiable information in text.
 */

const PII_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: "phone_id", regex: /\b(?:\+62|0)[0-9]{8,12}\b/g },
  { name: "credit_card", regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { name: "nik", regex: /\b[1-9]\d{15}\b/g },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: "ip_address", regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

export interface PIIDetectionResult {
  hasPII: boolean;
  types: string[];
}

export function detectPII(text: string): PIIDetectionResult {
  const types: string[] = [];
  for (const { name, regex } of PII_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text)) types.push(name);
  }
  return { hasPII: types.length > 0, types };
}

export function maskPII(text: string): string {
  let result = text;
  for (const { name, regex } of PII_PATTERNS) {
    regex.lastIndex = 0;
    result = result.replace(regex, `[${name.toUpperCase()}-REDACTED]`);
  }
  return result;
}
