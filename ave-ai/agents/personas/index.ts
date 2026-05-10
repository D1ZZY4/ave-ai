import { defaultPersona } from "./default";
import { creative } from "./creative";
import { developer } from "./developer";
import { casual } from "./casual";
import { wise } from "./wise";
import { adaptive } from "./adaptive";
import { planner } from "./planner";

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
  defaultPersona,
  creative,
  developer,
  casual,
  wise,
  adaptive,
  planner,
];

export function getPersona(id: string): Persona {
  return ALL_PERSONAS.find((p) => p.id === id) ?? defaultPersona;
}

export {
  defaultPersona, creative, developer, casual, wise, adaptive, planner,
};
