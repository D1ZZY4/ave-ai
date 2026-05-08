import type {
  OrchestratorOptions,
  OrchestratorResult,
  ThinkingStep,
  AgentMemory,
} from "../types";
import {
  MAX_ITERATIONS_EXPERT,
  MAX_TIME_MS,
  COMPRESS_THRESHOLD,
  LLMError,
} from "../types";
import { streamChat, type OllamaMessage } from "./ollama";
import { parseStreamingThinking } from "./thinking";
import { sanitizeForLLM, sanitizeToolResult } from "./sanitizer";
import {
  evaluateInput,
  preApproveTool,
  postCheckResult,
  evaluateOutput,
} from "./rulesEngine";
import {
  assembleFastPrompt,
  assembleExpertPrompt,
  buildToolSchemas,
} from "./promptAssembler";
import {
  createMemory,
  updateMemory,
  assembleMemoryPrompt,
  setTaskState,
  summarizeOldSteps,
} from "./memory";
import { executeToolWithLifecycle, getOllamaTools } from "../tools/index";
import { useSessionStore } from "../store/session";
import { registry } from "./registry";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function parseReActResponse(text: string): {
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  finalAnswer?: string;
} {
  const thoughtMatch = text.match(/Thought:\s*([\s\S]*?)(?=\nAction:|\nFinal Answer:|$)/i);
  const actionMatch = text.match(/Action:\s*([^\n]+)/i);
  const actionInputMatch = text.match(
    /Action Input:\s*([\s\S]*?)(?=\nObservation:|\nThought:|\nFinal Answer:|$)/i
  );
  const finalMatch = text.match(/Final Answer:\s*([\s\S]+)$/i);

  const thought = thoughtMatch?.[1]?.trim() ?? text.trim();
  const action = actionMatch?.[1]?.trim();

  let actionInput: Record<string, unknown> | undefined;
  if (actionInputMatch?.[1]) {
    try {
      actionInput = JSON.parse(actionInputMatch[1].trim());
    } catch {
      actionInput = { input: actionInputMatch[1].trim() };
    }
  }

  return { thought, action, actionInput, finalAnswer: finalMatch?.[1]?.trim() };
}

async function callLLMWithRecovery(
  baseUrl: string,
  model: string,
  messages: OllamaMessage[],
  tools: ReturnType<typeof getOllamaTools> | undefined,
  params: Record<string, unknown>,
  signal: AbortSignal | undefined,
  maxAttempts = 2
): Promise<{ rawContent: string; toolCalls: { name: string; arguments: Record<string, unknown> }[] }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let rawContent = "";
      const toolCalls: { name: string; arguments: Record<string, unknown> }[] = [];

      const gen = streamChat(baseUrl, model, messages, tools, params as never, signal);

      for await (const chunk of gen) {
        if (signal?.aborted) break;
        if (chunk.message?.tool_calls?.length) {
          for (const tc of chunk.message.tool_calls) {
            toolCalls.push({ name: tc.function.name, arguments: tc.function.arguments || {} });
          }
        }
        if (chunk.message?.content) rawContent += chunk.message.content;
        if (chunk.done) break;
      }

      return { rawContent, toolCalls };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        const correctionMsg: OllamaMessage = {
          role: "user",
          content: `[SYSTEM CORRECTION] Previous attempt failed: ${lastError.message}. Please try again with a simpler response.`,
        };
        messages = [...messages, correctionMsg];
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw new LLMError(lastError?.message ?? "LLM call failed after retries");
}

async function executeSkillOrTool(
  name: string,
  args: Record<string, unknown>,
  globalCtx: { iterationCount: number; elapsedMs: number; estimatedTokens: number }
): Promise<{ result: string; execType: "tool" | "skill" }> {
  const entityType = registry.isToolOrSkill(name);

  if (entityType === "skill") {
    const skill = registry.getSkill(name)!;
    const result = await skill.execute(
      JSON.stringify(args),
      registry.getToolMap(),
      registry.getSkillMap()
    );
    return { result, execType: "skill" };
  }

  const toolResult = await executeToolWithLifecycle(name, args, globalCtx);
  return { result: toolResult.result, execType: "tool" };
}

export async function runFastSession(
  userInput: string,
  chatHistory: OllamaMessage[],
  opts: OrchestratorOptions
): Promise<OrchestratorResult> {
  const store = useSessionStore.getState();
  const startedAt = Date.now();

  const globalCtx = {
    iterationCount: 0,
    elapsedMs: 0,
    estimatedTokens: estimateTokens(userInput),
  };

  const inputApproval = evaluateInput(sanitizeForLLM(userInput), "fast", globalCtx);
  if (!inputApproval.allowed) {
    return {
      finalAnswer: `I can't process that request: ${inputApproval.reason ?? "Request denied."}`,
      thinkingSteps: [],
      iterationCount: 0,
      tokenCount: 0,
      denied: true,
      denialReason: inputApproval.reasonCode,
    };
  }

  const sanitizedInput = inputApproval.modified ?? sanitizeForLLM(userInput);
  const memory = setTaskState(createMemory(), sanitizedInput);
  const { historyPart } = assembleMemoryPrompt(memory, "");
  const request = assembleFastPrompt(opts, chatHistory, sanitizedInput, historyPart);

  store.incrementIteration();

  let rawContent = "";
  let toolCalls: { name: string; arguments: Record<string, unknown> }[] = [];

  try {
    const result = await callLLMWithRecovery(
      opts.baseUrl,
      opts.model,
      request.ollamaMessages,
      undefined,
      { temperature: 0.7, num_predict: 1024, top_p: 0.9, repeat_penalty: 1.1 },
      opts.signal
    );
    rawContent = result.rawContent;
    toolCalls = result.toolCalls;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      finalAnswer: `Connection error: ${msg}`,
      thinkingSteps: [],
      iterationCount: 1,
      tokenCount: 0,
      denied: false,
    };
  }

  const parsed = parseStreamingThinking(rawContent);
  const finalRaw = parsed.state === "done" ? parsed.responseContent : rawContent;

  const outputApproval = evaluateOutput(finalRaw);
  const finalAnswer = outputApproval.modified ?? finalRaw;

  const tokenCount = estimateTokens(request.systemPrompt) + estimateTokens(rawContent);
  store.setTokenCount(tokenCount);

  const thinkingSteps: ThinkingStep[] = [];
  if (parsed.thinkingContent) {
    thinkingSteps.push({
      stepNumber: 1,
      thought: parsed.thinkingContent,
      timestamp: startedAt,
    });
  }
  void toolCalls;

  return {
    finalAnswer: finalAnswer.trim(),
    thinkingSteps,
    iterationCount: 1,
    tokenCount,
  };
}

export async function runExpertSession(
  userInput: string,
  chatHistory: OllamaMessage[],
  opts: OrchestratorOptions,
  onStep: (step: ThinkingStep) => void,
  onStepUpdate: (patch: Partial<ThinkingStep>) => void
): Promise<OrchestratorResult> {
  const store = useSessionStore.getState();
  const startedAt = Date.now();
  let memory: AgentMemory = setTaskState(createMemory(), userInput);
  let iteration = 0;
  const thinkingSteps: ThinkingStep[] = [];
  const maxIter = MAX_ITERATIONS_EXPERT;

  const globalCtx = () => ({
    iterationCount: iteration,
    elapsedMs: Date.now() - startedAt,
    estimatedTokens: estimateTokens(userInput) + store.tokenCount,
  });

  const inputApproval = evaluateInput(sanitizeForLLM(userInput), "expert", globalCtx());
  if (!inputApproval.allowed) {
    return {
      finalAnswer: `I can't process that request: ${inputApproval.reason ?? "Request denied."}`,
      thinkingSteps: [],
      iterationCount: 0,
      tokenCount: 0,
      denied: true,
      denialReason: inputApproval.reasonCode,
    };
  }

  const sanitizedInput = inputApproval.modified ?? sanitizeForLLM(userInput);
  const toolSchemas = buildToolSchemas("expert", opts.enableTools);
  const messages: OllamaMessage[] = [...chatHistory, { role: "user", content: sanitizedInput }];

  while (iteration < maxIter) {
    if (opts.signal?.aborted) break;
    if (Date.now() - startedAt > MAX_TIME_MS) break;

    iteration++;
    store.incrementIteration();

    // Compressing: trigger if token budget exceeded
    if (store.tokenCount >= COMPRESS_THRESHOLD) {
      store.setStatus("compressing");
      memory = { ...memory, actionHistory: summarizeOldSteps(memory.actionHistory) };
      await new Promise((r) => setTimeout(r, 300));
      store.setStatus("active");
    }

    const { historyPart } = assembleMemoryPrompt(memory, "");
    const request = assembleExpertPrompt(opts, [], sanitizedInput, historyPart, toolSchemas);

    const fullMessages: OllamaMessage[] = [
      { role: "system", content: request.systemPrompt },
      ...messages.slice(-10),
    ];

    let rawContent: string;
    let toolCallsInChunk: { name: string; arguments: Record<string, unknown> }[];

    try {
      const llmResult = await callLLMWithRecovery(
        opts.baseUrl,
        opts.model,
        fullMessages,
        opts.enableTools ? getOllamaTools() : undefined,
        { temperature: 0.4, num_predict: 2048, top_p: 0.85, repeat_penalty: 1.15 },
        opts.signal
      );
      rawContent = llmResult.rawContent;
      toolCallsInChunk = llmResult.toolCalls;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errorStep: ThinkingStep = {
        stepNumber: iteration,
        thought: `LLM error: ${msg}. Sending correction prompt...`,
        timestamp: Date.now(),
      };
      thinkingSteps.push(errorStep);
      onStep(errorStep);
      messages.push({
        role: "user",
        content: `[SYSTEM] Previous request failed. Summarize what you know so far and give a Final Answer with what you have.`,
      });
      continue;
    }

    store.setTokenCount(estimateTokens(request.systemPrompt) + estimateTokens(rawContent));

    const parsed = parseStreamingThinking(rawContent);
    const responseText = parsed.state === "done" ? parsed.responseContent : rawContent;

    // ─── Tool/Skill calls from Ollama native tool calling ───────────────────
    if (toolCallsInChunk.length > 0) {
      for (const tc of toolCallsInChunk) {
        const execType = registry.isToolOrSkill(tc.name) ?? "tool";
        const currentStep: ThinkingStep = {
          stepNumber: iteration,
          thought: `Using ${execType}: ${tc.name}`,
          action: tc.name,
          actionInput: tc.arguments,
          execType,
          timestamp: Date.now(),
        };
        thinkingSteps.push(currentStep);
        onStep(currentStep);

        const approval = preApproveTool(tc.name, tc.arguments, "expert", currentStep.thought, globalCtx());
        if (!approval.allowed) {
          const obs = `${execType} denied: ${approval.reason}. Reason code: ${approval.reasonCode}`;
          onStepUpdate({ observation: obs });
          thinkingSteps[thinkingSteps.length - 1].observation = obs;
          memory = updateMemory(memory, { ...currentStep, observation: obs });
          messages.push({ role: "assistant", content: rawContent });
          messages.push({ role: "tool", content: obs });
          continue;
        }

        const { result, execType: resolvedExecType } = await executeSkillOrTool(tc.name, tc.arguments, globalCtx());
        const sanitized = sanitizeToolResult(result);
        const postApproval = postCheckResult(tc.name, sanitized, tc.arguments);
        const finalObs = postApproval.modified ?? sanitized;

        thinkingSteps[thinkingSteps.length - 1].execType = resolvedExecType;
        onStepUpdate({ observation: finalObs, execType: resolvedExecType });
        thinkingSteps[thinkingSteps.length - 1].observation = finalObs;
        memory = updateMemory(memory, { ...currentStep, observation: finalObs });
        messages.push({ role: "assistant", content: rawContent });
        messages.push({ role: "tool", content: finalObs });
      }
      continue;
    }

    // ─── ReAct text parsing ──────────────────────────────────────────────────
    const reactParsed = parseReActResponse(responseText);

    if (reactParsed.finalAnswer) {
      const outputApproval = evaluateOutput(reactParsed.finalAnswer);
      const finalAnswer = outputApproval.modified ?? reactParsed.finalAnswer;

      const finalStep: ThinkingStep = {
        stepNumber: iteration,
        thought: reactParsed.thought,
        timestamp: Date.now(),
      };
      thinkingSteps.push(finalStep);
      onStep(finalStep);

      return {
        finalAnswer: finalAnswer.trim(),
        thinkingSteps,
        iterationCount: iteration,
        tokenCount: store.tokenCount,
      };
    }

    if (reactParsed.action) {
      const execType = registry.isToolOrSkill(reactParsed.action) ?? "tool";
      const currentStep: ThinkingStep = {
        stepNumber: iteration,
        thought: reactParsed.thought,
        action: reactParsed.action,
        actionInput: reactParsed.actionInput,
        execType,
        timestamp: Date.now(),
      };
      thinkingSteps.push(currentStep);
      onStep(currentStep);

      const approval = preApproveTool(
        reactParsed.action,
        reactParsed.actionInput ?? {},
        "expert",
        reactParsed.thought,
        globalCtx()
      );

      if (!approval.allowed) {
        const obs = `${execType} denied: ${approval.reason}`;
        onStepUpdate({ observation: obs });
        thinkingSteps[thinkingSteps.length - 1].observation = obs;
        memory = updateMemory(memory, { ...currentStep, observation: obs });
        messages.push({ role: "assistant", content: rawContent + `\nObservation: ${obs}` });
        continue;
      }

      const { result, execType: resolvedExecType } = await executeSkillOrTool(
        reactParsed.action,
        reactParsed.actionInput ?? {},
        globalCtx()
      );
      const sanitized = sanitizeToolResult(result);
      const postApproval = postCheckResult(reactParsed.action, sanitized, reactParsed.actionInput ?? {});
      const finalObs = postApproval.modified ?? sanitized;

      thinkingSteps[thinkingSteps.length - 1].execType = resolvedExecType;
      onStepUpdate({ observation: finalObs, execType: resolvedExecType });
      thinkingSteps[thinkingSteps.length - 1].observation = finalObs;
      memory = updateMemory(memory, { ...currentStep, observation: finalObs });
      messages.push({ role: "assistant", content: rawContent + `\nObservation: ${finalObs}` });
      continue;
    }

    // ─── Pure thought / partial response ────────────────────────────────────
    const currentStep: ThinkingStep = {
      stepNumber: iteration,
      thought: parsed.thinkingContent || reactParsed.thought || rawContent,
      timestamp: Date.now(),
    };
    thinkingSteps.push(currentStep);
    onStep(currentStep);

    if (responseText.trim()) {
      const outputApproval = evaluateOutput(responseText);
      const finalAnswer = outputApproval.modified ?? responseText;
      return {
        finalAnswer: finalAnswer.trim(),
        thinkingSteps,
        iterationCount: iteration,
        tokenCount: store.tokenCount,
      };
    }

    messages.push({ role: "assistant", content: rawContent });
  }

  return {
    finalAnswer:
      "I've reached the maximum number of reasoning steps. Here's what I've found so far based on the information available.",
    thinkingSteps,
    iterationCount: iteration,
    tokenCount: store.tokenCount,
  };
}
