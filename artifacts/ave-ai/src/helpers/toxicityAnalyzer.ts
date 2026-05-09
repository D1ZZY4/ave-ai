/**
 * Diagram 1, 18, 28: Toxicity Analyzer — keyword + pattern based toxicity scoring.
 * Returns a 0-1 score. isToxic = true when score >= 0.5.
 */

const HIGH_RISK_PATTERNS: RegExp[] = [
  /how\s+to\s+(make|build|create|synthesize|produce)\s+(a\s+)?(bomb|weapon|explosive|poison|virus|malware)/i,
  /how\s+to\s+(synthesize|produce|make|manufacture)\s+(meth|cocaine|heroin|fentanyl|drugs)/i,
  /step.{0,10}by.{0,10}step.{0,20}(kill|murder|attack|hack)/i,
  /\b(csam|child\s+pornography|loli)\b/i,
  /\b(bioweapon|chemical\s+weapon|nerve\s+agent)\b/i,
];

const MEDIUM_RISK_KEYWORDS = [
  "bomb", "explosive", "weapon", "kill", "murder", "suicide", "terrorist",
  "malware", "exploit", "ransomware", "phishing", "ddos",
  "drugs", "cocaine", "heroin", "methamphetamine",
];

const LOW_RISK_KEYWORDS = [
  "hack", "crack", "bypass", "injection", "vulnerability",
];

export interface ToxicityResult {
  score: number;
  isToxic: boolean;
  categories: string[];
}

export function analyzeToxicity(text: string): ToxicityResult {
  const lower = text.toLowerCase();
  const categories: string[] = [];
  let score = 0;

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(text)) {
      score += 0.7;
      categories.push("high_risk");
      break;
    }
  }

  const mediumHits = MEDIUM_RISK_KEYWORDS.filter((kw) => lower.includes(kw));
  if (mediumHits.length > 0) {
    score += Math.min(mediumHits.length * 0.08, 0.4);
    categories.push("keywords");
  }

  const lowHits = LOW_RISK_KEYWORDS.filter((kw) => lower.includes(kw));
  if (lowHits.length > 0) {
    score += Math.min(lowHits.length * 0.03, 0.15);
    categories.push("low_risk_keywords");
  }

  score = Math.min(score, 1);
  return { score, isToxic: score >= 0.5, categories };
}
