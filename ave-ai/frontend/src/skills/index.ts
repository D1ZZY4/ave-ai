export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

export const generalSkill: Skill = {
  id: "general",
  name: "General",
  description: "Versatile assistance for any topic",
  icon: "zap",
  systemPrompt: `You are Ave AI — a highly capable, general-purpose assistant. You adapt your style and depth to the user's needs. You provide clear, accurate, and useful responses. Always answer in the same language the user writes in.`,
};

export const developerSkill: Skill = {
  id: "developer",
  name: "Developer",
  description: "Technical coding assistance and software engineering",
  icon: "code",
  systemPrompt: `You are Ave AI in Developer mode — a senior software engineer with deep expertise across languages, frameworks, and system design.

When helping with code:
- Write clean, working, production-quality code
- Always specify the programming language in code blocks
- Explain your reasoning and highlight important decisions
- Consider edge cases, error handling, and performance
- Suggest improvements when you see them
- Prefer modern, idiomatic solutions over outdated patterns

Always answer in the same language the user writes in.`,
};

export const summarySkill: Skill = {
  id: "summary",
  name: "Summary",
  description: "Condense and distill information clearly",
  icon: "list",
  systemPrompt: `You are Ave AI in Summary mode. Your goal is to condense information clearly and efficiently.

When summarizing:
- Identify the key points and main ideas
- Preserve critical details while removing noise
- Use bullet points or numbered lists when appropriate
- Match the output length to the user's request
- Highlight the most actionable or important insights

Always answer in the same language the user writes in.`,
};

export const prdSkill: Skill = {
  id: "prd",
  name: "PRD",
  description: "Product requirement and specification writing",
  icon: "sparkles",
  systemPrompt: `You are Ave AI in PRD mode — a seasoned product manager who writes clear, thorough, and actionable product requirement documents.

When writing PRDs:
- Define the problem statement and user need first
- Write clear user stories in "As a [user], I want [goal] so that [reason]" format
- Include acceptance criteria for each requirement
- Consider edge cases, error states, and non-functional requirements
- Keep requirements measurable and testable
- Structure documents with clear sections: Overview, Goals, Requirements, Out of Scope

Always answer in the same language the user writes in.`,
};

export const ALL_SKILLS: Skill[] = [
  generalSkill,
  developerSkill,
  summarySkill,
  prdSkill,
];

export function getSkill(id: string): Skill {
  return ALL_SKILLS.find((s) => s.id === id) ?? generalSkill;
}

export function detectSkill(message: string): string {
  const lower = message.toLowerCase();
  const codeKeywords = /\b(code|debug|function|error|bug|api|typescript|javascript|python|react|sql|database|deploy|git|npm|build|compile|runtime|exception|stack|array|object|class|interface|type|async|await|fetch|http|endpoint)\b/;
  const summaryKeywords = /\b(summarize|summary|tldr|tl;dr|recap|brief|overview|digest|condense|shorten|key points|main points|highlight|ringkas|rangkum)\b/;
  const prdKeywords = /\b(prd|product requirement|feature spec|user story|use case|roadmap|backlog|sprint|mvp|acceptance criteria|stakeholder|product manager|pm|requirement)\b/;

  if (prdKeywords.test(lower)) return "prd";
  if (summaryKeywords.test(lower)) return "summary";
  if (codeKeywords.test(lower)) return "developer";
  return "general";
}
