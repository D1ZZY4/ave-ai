/**
 * Response Parser
 *
 * Scans AI output for structured patterns and extracts them
 * so the UI can render them as interactive elements instead of plain text.
 *
 * Patterns detected:
 * - CHOICES block: numbered list at end of response → clickable option cards
 * - QUESTIONS block: numbered questions → interactive input form
 * - CONFIRM block: yes/no or short confirmation → confirm buttons
 */

export interface ParsedChoice {
  index: number;
  label: string;
  description?: string;
}

export interface ParsedQuestion {
  index: number;
  question: string;
  hint?: string;
}

export type ParsedBlockType = "choices" | "questions" | "confirm" | "none";

export interface ParsedResponse {
  prose: string;
  blockType: ParsedBlockType;
  choices: ParsedChoice[];
  questions: ParsedQuestion[];
}

// Matches lines like: "1. **Label** — description" or "1. Label" or "- Label"
const NUMBERED_ITEM = /^(\d+)\.\s+(?:\*\*(.+?)\*\*(?:\s*[—–-]\s*(.+))?|(.+))$/;
const QUESTION_LINE = /^(\d+)\.\s+(.+\?)$/;

/**
 * Try to extract a numbered list block from the END of the text.
 * Returns { items, trimmedText } or null if no list found.
 */
function extractTrailingList(text: string): { items: string[]; trimmedText: string } | null {
  const lines = text.split("\n");
  const listLines: string[] = [];
  let listStart = -1;

  // Walk backwards collecting numbered list items
  let i = lines.length - 1;
  while (i >= 0) {
    const line = lines[i].trim();
    if (!line) { i--; continue; }

    // Check if it looks like a list item
    if (NUMBERED_ITEM.test(line) || /^[-•*]\s+.+/.test(line)) {
      listLines.unshift(line);
      listStart = i;
    } else if (listLines.length > 0) {
      // Non-list line after we found some list lines — stop
      break;
    } else {
      // Haven't found any list lines yet, this isn't a trailing list
      break;
    }
    i--;
  }

  if (listLines.length < 2) return null; // need at least 2 items

  // Items must be reasonably short (not paragraphs)
  const allShort = listLines.every((l) => l.length < 160);
  if (!allShort) return null;

  const trimmedText = lines.slice(0, listStart).join("\n").trim();
  return { items: listLines, trimmedText };
}

/**
 * Parse a list item line into label + optional description.
 */
function parseItem(line: string): { label: string; description?: string } {
  // Remove leading number/bullet
  const cleaned = line
    .replace(/^\d+\.\s+/, "")
    .replace(/^[-•*]\s+/, "")
    .trim();

  // Check for "**Label** — Description" pattern
  const boldMatch = /^\*\*(.+?)\*\*(?:\s*[—–:-]\s*(.+))?$/.exec(cleaned);
  if (boldMatch) {
    return { label: boldMatch[1].trim(), description: boldMatch[2]?.trim() };
  }

  // Check for "Label: Description" pattern
  const colonMatch = /^(.+?):\s+(.+)$/.exec(cleaned);
  if (colonMatch && colonMatch[1].length < 50) {
    return { label: colonMatch[1].trim(), description: colonMatch[2].trim() };
  }

  // Check for "Label — Description"
  const dashMatch = /^(.+?)\s+[—–]\s+(.+)$/.exec(cleaned);
  if (dashMatch) {
    return { label: dashMatch[1].trim(), description: dashMatch[2].trim() };
  }

  return { label: cleaned };
}

/**
 * Detect if a numbered list is actually questions (items end with ?)
 */
function isQuestionList(items: string[]): boolean {
  const questionCount = items.filter((item) => {
    const cleaned = item.replace(/^\d+\.\s+/, "").replace(/^[-•*]\s+/, "").trim();
    return cleaned.endsWith("?");
  }).length;
  return questionCount >= Math.ceil(items.length * 0.6); // 60%+ are questions
}

/**
 * Detect if the AI is asking the user to confirm (binary choice).
 * Look for yes/no, lanjut/batal, etc.
 */
function isConfirmList(items: string[]): boolean {
  if (items.length !== 2) return false;
  const joined = items.join(" ").toLowerCase();
  return (
    /\byes\b|\bno\b|\bya\b|\btidak\b|\blanjut|\bbatal|\bconfirm|\bcancel/.test(joined)
  );
}

/**
 * Main parse function.
 * Returns structured data that the UI can render.
 */
export function parseResponse(content: string): ParsedResponse {
  const empty: ParsedResponse = {
    prose: content,
    blockType: "none",
    choices: [],
    questions: [],
  };

  if (!content || content.length < 10) return empty;

  const extracted = extractTrailingList(content);
  if (!extracted) return empty;

  const { items, trimmedText } = extracted;

  if (isQuestionList(items)) {
    // Render as a question form
    const questions: ParsedQuestion[] = items.map((line, idx) => {
      const cleaned = line.replace(/^\d+\.\s+/, "").replace(/^[-•*]\s+/, "").trim();
      return { index: idx + 1, question: cleaned };
    });
    return { prose: trimmedText, blockType: "questions", choices: [], questions };
  }

  if (isConfirmList(items)) {
    const choices: ParsedChoice[] = items.map((line, idx) => {
      const { label, description } = parseItem(line);
      return { index: idx + 1, label, description };
    });
    return { prose: trimmedText, blockType: "confirm", choices, questions: [] };
  }

  // Default: render as choice cards
  const choices: ParsedChoice[] = items.map((line, idx) => {
    const { label, description } = parseItem(line);
    return { index: idx + 1, label, description };
  });

  return { prose: trimmedText, blockType: "choices", choices, questions: [] };
}
