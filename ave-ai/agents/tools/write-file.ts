/**
 * flow-3 #23: write-file tool — writes text files to agents/.agent-fs/
 * Access: workspace/, uploads/ only (see flow-13 #5).
 */
import type { OllamaTool } from "../helpers/ollama";

const WRITE_ALLOWED_PATHS = ["workspace/", "uploads/"];
const MAX_FILE_SIZE = 10_485_760;

function isWritablePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return WRITE_ALLOWED_PATHS.some((p) => normalized.startsWith(p)) && !normalized.includes("..");
}

export const writeFileTool = {
  id: "write_file",
  name: "Write File",
  description: "Write or append text content to a file in the agent filesystem",
  ollamaTool: {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or append text to workspace/ or uploads/ folders.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path e.g. workspace/output.txt" },
          content: { type: "string", description: "Text content to write" },
          mode: { type: "string", enum: ["write", "append"], description: "write (overwrite, default) or append" },
        },
        required: ["path", "content"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const filePath = String(args.path ?? "");
    const content = String(args.content ?? "");
    const mode = String(args.mode ?? "write");
    if (!filePath) return "Error: path is required.";
    if (!isWritablePath(filePath)) {
      return `Error: path "${filePath}" is not writable (only workspace/ and uploads/ are allowed).`;
    }
    if (content.length > MAX_FILE_SIZE) {
      return `Error: content too large (${content.length} bytes, max ${MAX_FILE_SIZE}).`;
    }
    try {
      const db = await openFS();
      let finalContent = content;
      if (mode === "append") {
        const existing = await dbGet(db, filePath);
        finalContent = existing ? String(existing) + content : content;
      }
      await dbPut(db, filePath, finalContent);
      return `Successfully ${mode === "append" ? "appended to" : "wrote"} "${filePath}" (${finalContent.length} bytes).`;
    } catch (err) {
      return `Error writing "${filePath}": ${err instanceof Error ? err.message : String(err)}`;
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

function dbPut(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
