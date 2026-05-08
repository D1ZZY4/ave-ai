import { generalSkill } from "./general";
import { developerSkill } from "./developer";
import { summarySkill } from "./summary";
import { prdSkill } from "./prd";

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

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

export { generalSkill, developerSkill, summarySkill, prdSkill };
