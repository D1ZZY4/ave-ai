/**
 * Diagram 18 — Toxicity Analyzer (separate file per spec)
 * Lightweight keyword-based toxicity scoring.
 */

const TOXICITY_KEYWORDS = [
  "kill", "murder", "assassinate", "rape", "sexual assault",
  "bomb", "explosive", "terrorism", "mass shooting",
  "weapon synthesis", "drug synthesis", "meth recipe",
  "child porn", "csam", "self-harm", "suicide method",
  "how to make poison", "how to make drugs",
];

const HIGH_SEVERITY_KEYWORDS = [
  "child porn", "csam", "suicide method", "bomb making",
  "drug synthesis", "weapon synthesis",
];

export interface ToxicityResult {
  isToxic: boolean;
  score: number;
  matchedKeywords: string[];
  severity: "none" | "low" | "medium" | "high";
}

export function analyzeToxicity(text: string, threshold = 0.8): ToxicityResult {
  const lower = text.toLowerCase();
  const matched = TOXICITY_KEYWORDS.filter((kw) => lower.includes(kw));
  const highMatched = HIGH_SEVERITY_KEYWORDS.filter((kw) => lower.includes(kw));

  const score = matched.length / TOXICITY_KEYWORDS.length;
  const isToxic = score >= threshold || highMatched.length > 0 || matched.length >= 2;

  let severity: ToxicityResult["severity"] = "none";
  if (highMatched.length > 0) severity = "high";
  else if (matched.length >= 2) severity = "medium";
  else if (matched.length === 1) severity = "low";

  return { isToxic, score, matchedKeywords: matched, severity };
}
