/**
 * flow-12 diagram 4: LLM-based fact extraction from assistant responses.
 */
import type { MemoryFact, FactExtractResult } from "./types";

export async function extractFacts(
  assistantMessage: string,
  existingFacts: MemoryFact[],
  baseUrl = "http://localhost:11434",
  model = "qwen3:latest"
): Promise<FactExtractResult> {
  const prompt = `Given the following assistant response, extract any new facts about the user.
Return a JSON array only (no other text): [{ "key": string, "value": string, "confidence": number }]
confidence is 0-1.
Existing facts: ${JSON.stringify(existingFacts)}
Assistant message: ${assistantMessage.slice(0, 1000)}`;

  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, temperature: 0.1 }),
    });
    if (!res.ok) throw new Error("LLM request failed");
    const data = await res.json();
    const text: string = data.response ?? "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { facts: existingFacts };

    const parsed: Array<{ key: string; value: string; confidence: number }> =
      JSON.parse(jsonMatch[0]);

    const now = Date.now();
    const merged = [...existingFacts];
    for (const newFact of parsed) {
      if (!newFact.key || !newFact.value) continue;
      const idx = merged.findIndex((f) => f.key === newFact.key);
      const fact: MemoryFact = {
        key: newFact.key,
        value: newFact.value,
        confidence: Math.min(1, Math.max(0, newFact.confidence ?? 0.5)),
        timestamp: now,
      };
      if (idx >= 0) {
        merged[idx] = fact;
      } else {
        merged.push(fact);
      }
    }
    return { facts: merged };
  } catch {
    return { facts: existingFacts, error: "Extraction failed" };
  }
}
