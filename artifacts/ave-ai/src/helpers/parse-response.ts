/**
 * Response Parser — finds interactive blocks anywhere in the AI response.
 *
 * Strategy: find the LAST contiguous list block in the response.
 * It doesn't have to be the very last line — models often add a closing
 * sentence after a list ("Which would you prefer?"). We handle that.
 *
 * Block types detected:
 *   "choices"   → numbered or bulleted options  → ChoiceCards
 *   "questions" → numbered questions (60%+ end with ?)  → QuestionForm
 *   "confirm"   → exactly 2 items (yes/no, lanjut/batal) → confirm buttons
 *   "none"      → no interactive block found
 */

export interface ParsedChoice {
  index: number;
  label: string;
  description?: string;
}

export interface ParsedQuestion {
  index: number;
  question: string;
}

export type ParsedBlockType = "choices" | "questions" | "confirm" | "none";

export interface ParsedResponse {
  prose: string;
  afterText: string;
  blockType: ParsedBlockType;
  choices: ParsedChoice[];
  questions: ParsedQuestion[];
}

const LIST_ITEM_RE = /^(?:(\d+)[.)]\s+|[-*•]\s+)(.+)$/;

function isListLine(line: string): boolean {
  return LIST_ITEM_RE.test(line.trim());
}

function extractLabel(line: string): string {
  return line.trim().replace(/^(?:\d+[.)]\s+|[-*•]\s+)/, "").trim();
}

/**
 * Find all contiguous list blocks in text.
 * Returns them as groups of line indices.
 */
function findListBlocks(lines: string[]): number[][] {
  const groups: number[][] = [];
  let current: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      // blank line — end current group if it has items
      if (current.length >= 1) {
        groups.push([...current]);
        current = [];
      }
      continue;
    }
    if (isListLine(trimmed)) {
      current.push(i);
    } else {
      if (current.length >= 1) {
        groups.push([...current]);
        current = [];
      }
    }
  }
  if (current.length >= 1) groups.push(current);

  return groups;
}

/**
 * Parse a list item label into { label, description }.
 * Handles: "**Bold** — desc", "Label: desc", "Label — desc", plain label.
 */
function parseLabel(raw: string): { label: string; description?: string } {
  // Remove leading "**" wrappers from bold-wrapped items
  const withoutBold = raw.replace(/\*\*/g, "");

  // "Label — description" or "Label – desc"
  const dashMatch = /^(.+?)\s+[—–]\s+(.+)$/.exec(withoutBold);
  if (dashMatch) return { label: dashMatch[1].trim(), description: dashMatch[2].trim() };

  // "Label: description" (label must be short)
  const colonMatch = /^(.{3,40}):\s+(.+)$/.exec(withoutBold);
  if (colonMatch) return { label: colonMatch[1].trim(), description: colonMatch[2].trim() };

  return { label: withoutBold.trim() };
}

function isQuestionList(items: string[]): boolean {
  const q = items.filter((it) => it.trimEnd().endsWith("?")).length;
  return q >= Math.ceil(items.length * 0.6);
}

function isConfirmList(items: string[]): boolean {
  if (items.length !== 2) return false;
  const joined = items.join(" ").toLowerCase();
  return /\byes\b|\bno\b|\bya\b|\btidak\b|\blanjut|\bbatal|\bconfirm|\bcancel|\bogay|\bok\b/.test(joined);
}

function allItemsShort(items: string[]): boolean {
  return items.every((it) => it.length <= 200);
}

/**
 * Main parser.
 * Returns a ParsedResponse — always safe to use, even if blockType === "none".
 */
export function parseResponse(content: string): ParsedResponse {
  const empty: ParsedResponse = {
    prose: content,
    afterText: "",
    blockType: "none",
    choices: [],
    questions: [],
  };

  if (!content || content.length < 5) return empty;

  const lines = content.split("\n");
  const groups = findListBlocks(lines);

  // We want the LAST group with 2+ items that are all reasonably short
  const lastGroup = [...groups].reverse().find((g) => g.length >= 2 && allItemsShort(g.map((i) => lines[i])));
  if (!lastGroup) return empty;

  const firstIdx = lastGroup[0];
  const lastIdx = lastGroup[lastGroup.length - 1];

  const rawItems = lastGroup.map((i) => extractLabel(lines[i]));

  // Text before the list block
  const beforeText = lines
    .slice(0, firstIdx)
    .join("\n")
    .trim();

  // Text after the list block (e.g. closing question from the model)
  const afterText = lines
    .slice(lastIdx + 1)
    .join("\n")
    .trim();

  // Determine block type
  let blockType: ParsedBlockType = "choices";
  if (isConfirmList(rawItems)) blockType = "confirm";
  else if (isQuestionList(rawItems)) blockType = "questions";

  if (blockType === "questions") {
    const questions: ParsedQuestion[] = rawItems.map((q, i) => ({
      index: i + 1,
      question: q,
    }));
    return { prose: beforeText, afterText, blockType: "questions", choices: [], questions };
  }

  const choices: ParsedChoice[] = rawItems.map((raw, i) => {
    const { label, description } = parseLabel(raw);
    return { index: i + 1, label, description };
  });

  return { prose: beforeText, afterText, blockType, choices, questions: [] };
}
