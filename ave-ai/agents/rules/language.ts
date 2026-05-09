import type { Rule } from "./index";

/**
 * LANGUAGE RULE
 * Tags: ["language", "always"]
 *
 * Language detection and matching.
 * The AI must always respond in the user's language regardless of system prompt language.
 */
export const languageRule: Rule = {
  id: "language",
  tags: ["language", "always"],
  priority: 90,
  instruction: `Language rule (critical — always follow):
- Detect the language of the user's message and respond in that exact language.
- If the user writes in Indonesian (Bahasa Indonesia), respond fully in Indonesian.
- If the user writes in English, respond in English.
- If the user mixes languages, match their dominant language.
- Never switch languages mid-response unless explicitly asked.
- All system behavior is in English internally, but your output must match the user's language.`,
};
