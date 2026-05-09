/**
 * Diagram 5, 22: Global rules — iteration limits, token budget, accuracy.
 * Applied unconditionally to every request.
 */
import type { Rule } from "./index";

export const globalRules: Rule[] = [
  {
    id: "max-iterations",
    tags: ["global", "loop", "safety"],
    priority: 190,
    instruction:
      "Maximum 20 reasoning steps per response. If you have been thinking for more than 20 steps, emit a final answer immediately.",
  },
  {
    id: "token-budget",
    tags: ["global", "performance"],
    priority: 185,
    instruction:
      "Keep responses focused and within context limits. Avoid repeating information already stated in the conversation.",
  },
  {
    id: "no-hallucination",
    tags: ["global", "accuracy"],
    priority: 180,
    instruction:
      "Only state facts you are confident about. If uncertain, say so explicitly. Never invent URLs, citations, statistics, or code that you have not verified.",
  },
  {
    id: "structured-output",
    tags: ["global", "format"],
    priority: 170,
    condition: (ctx) => ctx.mode === "expert",
    instruction:
      "In Expert mode: use clear section headers, numbered steps for procedures, and fenced code blocks for all code snippets.",
  },
  {
    id: "self-correction",
    tags: ["global", "quality"],
    priority: 155,
    condition: (ctx) => ctx.mode === "expert",
    instruction:
      "Before giving a final answer, silently verify your reasoning for internal consistency. If you find an error, correct it before responding.",
  },
];
