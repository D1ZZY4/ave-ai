import { avePrime } from "./ave-prime";
import { muse } from "./muse";
import { architect } from "./architect";
import { diplomat } from "./diplomat";
import { sage } from "./sage";
import { maverick } from "./maverick";
import { mentor } from "./mentor";

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
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
