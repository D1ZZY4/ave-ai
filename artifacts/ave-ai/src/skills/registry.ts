import type { FlowSkill } from "../types";
import { summarizeFileSkill } from "./summarize-file";
import { createReportSkill } from "./create-report";

export const allFlowSkills: FlowSkill[] = [
  summarizeFileSkill,
  createReportSkill,
];
