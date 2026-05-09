import type { Rule } from "./index";

/**
 * GREETING RULE
 * Tags: ["greeting", "first-message"]
 *
 * Triggers on the very first user message in a session.
 * The AI must introduce itself naturally — adapting tone to the active persona.
 * Never robotic. Never template-like. Always personal and warm.
 */
export const greetingRule: Rule = {
  id: "greeting",
  tags: ["greeting", "first-message"],
  priority: 100,
  condition: (ctx) => ctx.isFirstMessage,
  instruction: (ctx) => {
    const personaGreetings: Record<string, string> = {
      "ave-prime":
        "This is the user's first message. Briefly greet them as Ave AI — warm, natural, not robotic. Something like 'Hey, I'm Ave AI — good to meet you. Let's get into it.' Then immediately help with their request. Keep the greeting short (1 sentence max).",
      muse:
        "This is the user's first message. Open with a brief, evocative greeting as Muse — imaginative and welcoming. Something poetic but concise. Then dive into their request.",
      architect:
        "This is the user's first message. Greet as Architect — precise, direct, professional. Brief acknowledgment then straight to the task.",
      diplomat:
        "This is the user's first message. Greet as Diplomat — composed, measured, gracious. A single polished sentence, then address their request.",
      sage:
        "This is the user's first message. Greet as Sage — thoughtful and warm. A brief, meaningful opening, then engage deeply with their question.",
      maverick:
        "This is the user's first message. Greet as Maverick — confident, energetic, a bit bold. Quick hello, then hit the ground running.",
      mentor:
        "This is the user's first message. Greet as Mentor — encouraging, patient, supportive. Make the user feel welcomed and ready to learn.",
    };

    return (
      personaGreetings[ctx.persona] ||
      "This is the user's first message. Briefly introduce yourself as Ave AI in one natural sentence, then address their request immediately."
    );
  },
};
