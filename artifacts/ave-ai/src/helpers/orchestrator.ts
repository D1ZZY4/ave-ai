import type {
  OrchestratorOptions,
  OrchestratorResult,
  ThinkingStep,
  AgentMemory,
} from "../types";
import { MAX_ITERATIONS_EXPERT, MAX_ITERATIONS_FAST, MAX_TIME_MS } from "../types";
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
} from "./memory";
import {
  executeToolWithLifecycle,
  getOllamaTools,
} from "../tools/index";
import { useSessionStore } from "../store/session";

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
  const actionInputMatch = text.match(/Action Input:\s*([\s\S]*?)(?=\nObservation:|\nThought:|\nFinal Answer:|$)/i);
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

  const finalAnswer = finalMatch?.[1]?.trim();

  return { thought, action, actionInput, finalAnswer };
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
  const gen = streamChat(
    opts.baseUrl,
    opts.model,
    request.ollamaMessages,
    undefined,
    { temperature: 0.7, num_predict: 1024, top_p: 0.9, repeat_penalty: 1.1 },
    opts.signal
  );

  for await (const chunk of gen) {
    if (opts.signal?.aborted) break;
    if (chunk.message?.content) rawContent += chunk.message.content;
    if (chunk.done) break;
  }

  const parsed = parseStreamingThinking(rawContent);
  const finalRaw = parsed.state === "done" ? parsed.responseContent : rawContent;

  const outputApproval = evaluateOutput(finalRaw);
  const finalAnswer = outputApproval.modified ?? finalRaw;

  store.setTokenCount(estimateTokens(request.systemPrompt) + estimateTokens(rawContent));

  return {
    finalAnswer: finalAnswer.trim(),
    thinkingSteps: parsed.thinkingContent
      ? [{ stepNumber: 1, thought: parsed.thinkingContent, timestamp: startedAt }]
      : [],
    iterationCount: 1,
    tokenCount: estimateTokens(request.systemPrompt) + estimateTokens(rawContent),
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

    const { historyPart } = assembleMemoryPrompt(memory, "");
    const request = assembleExpertPrompt(opts, [], sanitizedInput, historyPart, toolSchemas);

    const fullMessages: OllamaMessage[] = [
      { role: "system", content: request.systemPrompt },
      ...messages.slice(-10),
    ];

    let rawContent = "";
    const gen = streamChat(
      opts.baseUrl,
      opts.model,
      fullMessages,
      opts.enableTools ? getOllamaTools() : undefined,
      { temperature: 0.4, num_predict: 2048, top_p: 0.85, repeat_penalty: 1.15 },
      opts.signal
    );

    let toolCallsInChunk: { name: string; arguments: Record<string, unknown> }[] = [];

    for await (const chunk of gen) {
      if (opts.signal?.aborted) break;

      if (chunk.message?.tool_calls?.length) {
        toolCallsInChunk = chunk.message.tool_calls.map((tc) => ({
          name: tc.function.name,
          arguments: tc.function.arguments || {},
        }));
      }

      if (chunk.message?.content) rawContent += chunk.message.content;
      if (chunk.done) break;
    }

    store.setTokenCount(estimateTokens(request.systemPrompt) + estimateTokens(rawContent));

    const parsed = parseStreamingThinking(rawContent);
    const responseText = parsed.state === "done" ? parsed.responseContent : rawContent;

    if (toolCallsInChunk.length > 0) {
      for (const tc of toolCallsInChunk) {
        const currentStep: ThinkingStep = {
          stepNumber: iteration,
          thought: `Using tool: ${tc.name}`,
          action: tc.name,
          actionInput: tc.arguments,
          timestamp: Date.now(),
        };
        thinkingSteps.push(currentStep);
        onStep(currentStep);

        const approval = preApproveTool(tc.name, tc.arguments, "expert", currentStep.thought, globalCtx());
        if (!approval.allowed) {
          const obs = `Tool denied: ${approval.reason}. Reason code: ${approval.reasonCode}`;
          onStepUpdate({ observation: obs });
          thinkingSteps[thinkingSteps.length - 1].observation = obs;
          memory = updateMemory(memory, { ...currentStep, observation: obs });
          messages.push({ role: "assistant", content: rawContent });
          messages.push({ role: "tool", content: obs });
          continue;
        }

        const result = await executeToolWithLifecycle(tc.name, tc.arguments, globalCtx());
        const sanitized = sanitizeToolResult(result.result);

        const postApproval = postCheckResult(tc.name, sanitized, tc.arguments);
        const finalObs = postApproval.modified ?? sanitized;

        onStepUpdate({ observation: finalObs });
        thinkingSteps[thinkingSteps.length - 1].observation = finalObs;

        memory = updateMemory(memory, { ...currentStep, observation: finalObs });
        messages.push({ role: "assistant", content: rawContent });
        messages.push({ role: "tool", content: finalObs });
      }
      continue;
    }

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
      const currentStep: ThinkingStep = {
        stepNumber: iteration,
        thought: reactParsed.thought,
        action: reactParsed.action,
        actionInput: reactParsed.actionInput,
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
        const obs = `Tool denied: ${approval.reason}`;
        onStepUpdate({ observation: obs });
        thinkingSteps[thinkingSteps.length - 1].observation = obs;
        memory = updateMemory(memory, { ...currentStep, observation: obs });
        messages.push({
          role: "assistant",
          content: rawContent + `\nObservation: ${obs}`,
        });
        continue;
      }

      const result = await executeToolWithLifecycle(
        reactParsed.action,
        reactParsed.actionInput ?? {},
        globalCtx()
      );
      const sanitized = sanitizeToolResult(result.result);
      const postApproval = postCheckResult(reactParsed.action, sanitized, reactParsed.actionInput ?? {});
      const finalObs = postApproval.modified ?? sanitized;

      onStepUpdate({ observation: finalObs });
      thinkingSteps[thinkingSteps.length - 1].observation = finalObs;
      memory = updateMemory(memory, { ...currentStep, observation: finalObs });

      messages.push({
        role: "assistant",
        content: rawContent + `\nObservation: ${finalObs}`,
      });
      continue;
    }

    const currentStep: ThinkingStep = {
      stepNumber: iteration,
      thought: reactParsed.thought || rawContent,
      timestamp: Date.now(),
    };
    thinkingSteps.push(currentStep);
    onStep(currentStep);

    if (parsed.thinkingContent) {
      currentStep.thought = parsed.thinkingContent;
    }

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

  const fallback = "I've reached the maximum number of reasoning steps. Here's what I've found so far based on the information available.";
  return {
    finalAnswer: fallback,
    thinkingSteps,
    iterationCount: iteration,
    tokenCount: store.tokenCount,
  };
}
