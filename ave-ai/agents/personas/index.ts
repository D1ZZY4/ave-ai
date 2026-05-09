import { avePrime } from "./default";
import { muse } from "./creative";
import { architect } from "./developer";
import { diplomat } from "./casual";
import { sage } from "./wise";
import { maverick } from "./adaptive";
import { mentor } from "./planner";

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  systemPrompt: string;
  expertPrompt?: string;
  toneInstruction?: string;
  safetyRules?: string[];
}

export const ALL_PERSONAS: Persona[] = [
  avePrime,
  muse,
  architect,
  diplomat,
  sage,
  maverick,
  mentor,
];

export function getPersona(id: string): Persona {
  return ALL_PERSONAS.find((p) => p.id === id) ?? avePrime;
}

export {
  avePrime, muse, architect, diplomat, sage, maverick, mentor,
};
