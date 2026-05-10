/**
 * flow-3 #21: pdf tool — extract text from PDF files stored in agent filesystem.
 * Reads from uploads/ or data/; results reference workspace/.
 */
import type { OllamaTool } from "../helpers/ollama";

export const pdfTool = {
  id: "pdf",
  name: "PDF Reader",
  description: "Extract text content from PDF files in uploads/ or data/",
  ollamaTool: {
    type: "function",
    function: {
      name: "pdf",
      description: "Extract text from a PDF file stored in uploads/ or data/ folders.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path to the PDF file e.g. uploads/report.pdf" },
          pages: { type: "string", description: "Optional page range e.g. '1-5' or 'all' (default: all)" },
        },
        required: ["path"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const filePath = String(args.path ?? "");
    if (!filePath) return "Error: path is required.";
    const allowed = ["uploads/", "data/"];
    const normalized = filePath.replace(/\\/g, "/");
    if (!allowed.some((p) => normalized.startsWith(p)) || normalized.includes("..")) {
      return `Error: PDF path must be within uploads/ or data/.`;
    }
    if (!normalized.endsWith(".pdf")) {
      return `Error: file "${filePath}" is not a PDF.`;
    }
    try {
      const db = await openFS();
      const content = await dbGet(db, filePath);
      if (content === undefined) {
        return `Error: PDF file "${filePath}" not found. Upload it first via the chat interface.`;
      }
      const data = String(content);
      if (data.startsWith("data:application/pdf;base64,")) {
        return `PDF "${filePath}" loaded. Text extraction from base64 PDFs requires PDF.js library integration. File is available for processing. Size: ${Math.round(data.length * 0.75 / 1024)}KB.`;
      }
      return data;
    } catch (err) {
      return `Error reading PDF "${filePath}": ${err instanceof Error ? err.message : String(err)}`;
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
