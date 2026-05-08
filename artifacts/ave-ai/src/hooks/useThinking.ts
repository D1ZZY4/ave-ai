import { useSessionStore } from "../store/session";
import type { ThinkingStep } from "../types";

export interface UseThinkingReturn {
  thinkingSteps: ThinkingStep[];
  isThinking: boolean;
  iterationCount: number;
  tokenCount: number;
  status: string;
}

export function useThinking(): UseThinkingReturn {
  const thinkingSteps = useSessionStore((s) => s.thinkingSteps);
  const status = useSessionStore((s) => s.status);
  const iterationCount = useSessionStore((s) => s.iterationCount);
  const tokenCount = useSessionStore((s) => s.tokenCount);

  const isThinking = status === "active" || status === "compressing";

  return { thinkingSteps, isThinking, iterationCount, tokenCount, status };
}
