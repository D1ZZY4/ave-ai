/**
 * flow-12 diagram 1: Barrel export for the memory subsystem.
 */
export type { MemoryFact, FactExtractResult } from "./types";
export { extractFacts } from "./extractor";
export { loadFacts, formatFactsForPrompt } from "./retriever";
export { saveFact, deleteFact, clearAllFacts, loadFact, loadAllFacts } from "./store";
