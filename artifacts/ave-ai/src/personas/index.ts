import type { FlowPersona } from "../types";
import { avePrime } from "./ave-prime";
import { muse } from "./muse";
import { architect } from "./architect";
import { diplomat } from "./diplomat";
import { sage } from "./sage";
import { maverick } from "./maverick";
import { mentor } from "./mentor";

export type { FlowPersona as Persona };

export const ALL_PERSONAS: FlowPersona[] = [
  avePrime,
  muse,
  architect,
  diplomat,
  sage,
  maverick,
  mentor,
];

export function getPersona(id: string): FlowPersona {
  return ALL_PERSONAS.find((p) => p.id === id) ?? avePrime;
}

export {
  avePrime, muse, architect, diplomat, sage, maverick, mentor,
};
