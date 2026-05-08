import type { FlowSkill, FlowTool, SkillStep } from "../types";

const steps: SkillStep[] = [
  { type: "tool", id: "read_file", label: "Read file content" },
  { type: "tool", id: "summarize_text", label: "Summarize content" },
];

export const summarizeFileSkill: FlowSkill = {
  id: "summarize_file",
  name: "Summarize File",
  description: "Read a file and produce a concise summary",
  icon: "file-text",
  steps,
  async execute(input, toolRegistry): Promise<string> {
    const readTool = toolRegistry.get("read_file");
    const summarizeTool = toolRegistry.get("summarize_text");

    if (!readTool || !summarizeTool) {
      return "Required tools not available: read_file, summarize_text";
    }

    const pathMatch = input.match(/(?:file|path|read)\s+["']?([^\s"']+)/i);
    const filePath = pathMatch?.[1] ?? "docs/README.md";

    const readResult = await readTool.handler({ path: filePath, maxLines: 100 });
    if (!readResult.success) {
      return `Could not read file: ${readResult.result}`;
    }

    const summaryResult = await summarizeTool.handler({
      text: readResult.result,
      maxSentences: 5,
      style: "bullet",
    });

    return [
      `**File:** ${filePath}`,
      "",
      summaryResult.result,
    ].join("\n");
  },
};
