export type ThinkingState = "idle" | "streaming" | "done";

export interface ThinkingParseResult {
  state: ThinkingState;
  thinkingContent: string;
  responseContent: string;
}

/**
 * Parse streaming content that may contain <think>...</think> blocks.
 * Handles partial/incomplete tags during streaming.
 */
export function parseStreamingThinking(raw: string): ThinkingParseResult {
  const openTag = "<think>";
  const closeTag = "</think>";

  const openIdx = raw.indexOf(openTag);
  const closeIdx = raw.indexOf(closeTag);

  // No thinking tag at all
  if (openIdx === -1) {
    return {
      state: "idle",
      thinkingContent: "",
      responseContent: raw,
    };
  }

  // Has open tag but no close tag yet — still thinking
  if (closeIdx === -1) {
    return {
      state: "streaming",
      thinkingContent: raw.slice(openIdx + openTag.length).trimStart(),
      responseContent: "",
    };
  }

  // Has both open and close — thinking is done
  const thinkingContent = raw.slice(openIdx + openTag.length, closeIdx).trim();
  const responseContent = raw.slice(closeIdx + closeTag.length).trimStart();

  return {
    state: "done",
    thinkingContent,
    responseContent,
  };
}

/**
 * Strip think tags from final content for display.
 */
export function stripThinkTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trimStart();
}
