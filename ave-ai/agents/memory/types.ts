/**
 * flow-12 diagram 2: MemoryFact interface — the core memory unit.
 */
export interface MemoryFact {
  key: string;
  value: string;
  timestamp: number;
  confidence: number;
}

export interface FactExtractResult {
  facts: MemoryFact[];
  error?: string;
}
