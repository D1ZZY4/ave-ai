import type { FlowTool } from "../types";
import { calculatorFlowTool } from "./calculator";
import { currentTimeFlowTool } from "./current-time";
import { webSearchFlowTool } from "./web-search";
import { readFileFlowTool } from "./read-file";
import { summarizeTextFlowTool } from "./summarize-text";

export const allFlowTools: FlowTool[] = [
  calculatorFlowTool,
  currentTimeFlowTool,
  webSearchFlowTool,
  readFileFlowTool,
  summarizeTextFlowTool,
];
