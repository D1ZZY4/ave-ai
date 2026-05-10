/**
 * flow-18 diagrams 2-4: Feedback Analyzer.
 * Analyzes per-session feedback, produces actionable suggestions,
 * and adjusts memory fact confidence via IndexedDB.
 */
import type { FeedbackEntry } from "../store/chat";
import { saveFact, loadAllFacts, deleteFact } from "../../../agents/memory/store";

const THRESHOLD_COUNT = 20;
const NEGATIVE_PERCENT = 0.7;

export type SuggestionAction =
  | "switch-expert"
  | "enable-tools"
  | "clear-memory"
  | "reduce-verbosity";

export interface FeedbackSuggestion {
  id: SuggestionAction;
  message: string;
}

export interface FeedbackAnalysis {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  positivePercent: number;
  dominantReason: string | null;
  suggestions: FeedbackSuggestion[];
  shouldAutoAdjust: boolean;
}

/**
 * Analyze an array of FeedbackEntry items and return computed analysis.
 * Called after each new feedback entry is recorded.
 */
export function analyzeFeedback(entries: FeedbackEntry[]): FeedbackAnalysis {
  const total = entries.length;
  const pos = entries.filter((e) => e.rating === "positive").length;
  const neg = entries.filter((e) => e.rating === "negative").length;
  const posPercent = total > 0 ? pos / total : 0;

  const reasonCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.rating === "negative" && e.reason) {
      reasonCounts[e.reason] = (reasonCounts[e.reason] ?? 0) + 1;
    }
  }
  const dominantReason =
    Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const shouldAutoAdjust =
    total >= THRESHOLD_COUNT && neg / total > NEGATIVE_PERCENT;

  const suggestions: FeedbackSuggestion[] = [];
  if (shouldAutoAdjust) {
    if (dominantReason === "Too verbose") {
      suggestions.push({ id: "reduce-verbosity", message: "Responses are too verbose — a concise tone override has been applied." });
    } else if (dominantReason === "Not helpful") {
      suggestions.push({ id: "enable-tools", message: "Enable more tools for better results?" });
    } else if (dominantReason === "Incorrect") {
      suggestions.push({ id: "switch-expert", message: "Switch to Expert mode for improved accuracy?" });
    } else if (dominantReason === "Off-topic") {
      suggestions.push({ id: "clear-memory", message: "Clear old memory facts to improve focus?" });
    }
  }

  return { totalFeedback: total, positiveCount: pos, negativeCount: neg, positivePercent: posPercent, dominantReason, suggestions, shouldAutoAdjust };
}

/**
 * flow-18 diagram 4: Update memory fact confidence based on feedback rating.
 * Positive → boost by +0.2; Negative → reduce by -0.3, remove if < 0.3.
 */
export async function adjustMemoryOnFeedback(rating: "positive" | "negative"): Promise<void> {
  try {
    const facts = await loadAllFacts();
    if (!facts.length) return;

    const delta = rating === "positive" ? 0.2 : -0.3;

    for (const fact of facts) {
      const newConf = Math.max(0, Math.min(1, (fact.confidence ?? 0.5) + delta));
      if (rating === "negative" && newConf < 0.3) {
        await deleteFact(fact.key);
      } else {
        await saveFact({ ...fact, confidence: newConf });
      }
    }
  } catch {
    // Memory operations are best-effort; never break UI
  }
}
