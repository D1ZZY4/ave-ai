import { z } from "zod";
import type { FlowTool, ToolExecutionResult } from "../types";
import type { OllamaTool } from "../helpers/ollama";

const schema = z.object({
  timezone: z.string().optional().describe("IANA timezone, e.g. 'Asia/Jakarta'. Default: UTC"),
  format: z.enum(["full", "short"]).optional().default("full"),
});

export const currentTimeFlowTool: FlowTool = {
  id: "current_time",
  name: "Current Time",
  description: "Get the current date and time, optionally in a specific timezone",
  schema,
  rateLimit: 60,
  cacheTtlMs: 5000,
  maxRetries: 1,
  async handler(args): Promise<ToolExecutionResult> {
    const parsed = schema.safeParse(args);
    const tz = parsed.success ? (parsed.data.timezone ?? "UTC") : "UTC";
    const fmt = parsed.success ? (parsed.data.format ?? "full") : "full";
    const now = new Date();
    try {
      if (fmt === "short") {
        const result = now.toLocaleString("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" });
        return { success: true, result };
      }
      const result = now.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
      return { success: true, result: `Current time (${tz}): ${result}` };
    } catch {
      return { success: true, result: `Current time (UTC): ${now.toISOString()}` };
    }
  },
};

export const currentTimeTool = {
  id: "current_time",
  name: "Current Time",
  description: "Get the current date and time",
  ollamaTool: {
    type: "function",
    function: {
      name: "current_time",
      description: "Return the current date and time, optionally in a specific timezone",
      parameters: {
        type: "object",
        properties: {
          timezone: { type: "string", description: "IANA timezone name, e.g. 'Asia/Jakarta'. Defaults to UTC." },
          format: { type: "string", description: "Either 'full' (default) or 'short'" },
        },
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const r = await currentTimeFlowTool.handler(args);
    return r.result;
  },
};
