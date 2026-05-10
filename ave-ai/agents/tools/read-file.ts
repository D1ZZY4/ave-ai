/**
 * flow-3 #22: read-file tool — reads text files from agents/.agent-fs/
 * Access: workspace/, uploads/, data/ (see flow-13 #5).
 */
import type { OllamaTool } from "../helpers/ollama";

const ALLOWED_PATHS = ["workspace/", "uploads/", "data/"];
const MAX_FILE_SIZE = 1_000_000;

function isAllowedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return ALLOWED_PATHS.some((p) => normalized.startsWith(p)) && !normalized.includes("..");
}

export const readFileTool = {
  id: "read_file",
  name: "Read File",
  description: "Read the contents of a text file from the agent filesystem",
  ollamaTool: {
    type: "function",
    function: {
      name: "read_file",
      description: "Read text content from workspace/, uploads/, or data/ folders. Returns file content as string.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path e.g. workspace/notes.txt or uploads/data.csv" },
          encoding: { type: "string", description: "Encoding: utf-8 (default) or base64" },
        },
        required: ["path"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const filePath = String(args.path ?? "");
    if (!filePath) return "Error: path is required.";
    if (!isAllowedPath(filePath)) {
      return `Error: path "${filePath}" is not within allowed directories (workspace/, uploads/, data/).`;
    }
    try {
      const db = await openFS();
      const content = await dbGet(db, filePath);
      if (content === undefined) return `Error: file "${filePath}" does not exist.`;
      if (typeof content === "string" && content.length > MAX_FILE_SIZE) {
        return `Error: file "${filePath}" exceeds size limit (${MAX_FILE_SIZE} bytes).`;
      }
      const enc = String(args.encoding ?? "utf-8");
      if (enc === "base64") {
        return btoa(unescape(encodeURIComponent(String(content))));
      }
      return String(content);
    } catch (err) {
      return `Error reading "${filePath}": ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

function openFS(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ave-agent-fs", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
