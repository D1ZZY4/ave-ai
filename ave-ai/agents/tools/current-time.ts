import type { OllamaTool } from "../helpers/ollama";

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
    const tz = String(args.timezone ?? "UTC");
    const fmt = String(args.format ?? "full");
    const now = new Date();
    try {
      if (fmt === "short") {
        return now.toLocaleString("en-US", { timeZone: tz, dateStyle: "medium", timeStyle: "short" } as Intl.DateTimeFormatOptions);
      }
      return now.toLocaleString("en-US", {
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
    } catch {
      return `Current time (UTC): ${now.toISOString()}`;
    }
  },
};
