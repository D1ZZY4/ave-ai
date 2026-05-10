/**
 * parse-diagram-to-ui — detects Mermaid / PlantUML code fences in AI output
 * and extracts them for rendering in the DiagramBlock component.
 */

export type DiagramLanguage = "mermaid" | "plantuml" | "graphviz";

export interface DiagramBlock {
  language: DiagramLanguage;
  code: string;
  startIndex: number;
  endIndex: number;
}

const DIAGRAM_FENCE_RE = /```(mermaid|plantuml|graphviz)\n([\s\S]*?)```/gi;

/**
 * Extract all diagram code fences from a markdown string.
 * Returns an array of DiagramBlock (may be empty if none found).
 */
export function parseDiagramsFromText(text: string): DiagramBlock[] {
  const blocks: DiagramBlock[] = [];
  let match: RegExpExecArray | null;

  DIAGRAM_FENCE_RE.lastIndex = 0;
  while ((match = DIAGRAM_FENCE_RE.exec(text)) !== null) {
    const language = match[1].toLowerCase() as DiagramLanguage;
    const code = match[2].trim();
    if (code.length > 0) {
      blocks.push({
        language,
        code,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return blocks;
}

/**
 * Strip diagram fences from text (for rendering prose without the raw code fence).
 */
export function stripDiagramFences(text: string): string {
  return text.replace(DIAGRAM_FENCE_RE, "").trim();
}
