/**
 * flow-12 diagram 5: Load facts and format as prompt injection string.
 */
import { loadAllFacts } from "./store";
import type { MemoryFact } from "./types";

export async function loadFacts(): Promise<MemoryFact[]> {
  const all = await loadAllFacts();
  return all.filter((f) => f.confidence >= 0.3);
}

export function formatFactsForPrompt(facts: MemoryFact[]): string {
  if (facts.length === 0) return "";
  const lines = facts.map((f) => `- ${f.key}: ${f.value}`);
  return `Known user info:\n${lines.join("\n")}`;
}
