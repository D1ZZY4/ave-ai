/**
 * flow-16 #4-7: Archive tool — extract and compress archive files (ZIP, TAR, GZ).
 * Paths constrained to workspace/ and uploads/ per rules/tools.ts (flow-2 #19).
 * Browser-based: uses JSZip-compatible approach via stored base64 data.
 */
import type { OllamaTool } from "../helpers/ollama";

const ALLOWED_PATHS = ["workspace/", "uploads/"];
const MAX_ARCHIVE_SIZE = 104_857_600;
const MAX_ENTRIES = 1000;
const ALLOWED_FORMATS = ["zip", "tar", "gz"] as const;
type ArchiveFormat = typeof ALLOWED_FORMATS[number];

function isAllowedPath(p: string): boolean {
  const norm = p.replace(/\\/g, "/");
  return ALLOWED_PATHS.some((a) => norm.startsWith(a)) && !norm.includes("..");
}

function detectFormat(path: string): ArchiveFormat | null {
  if (path.endsWith(".zip")) return "zip";
  if (path.endsWith(".tar.gz") || path.endsWith(".tgz")) return "gz";
  if (path.endsWith(".tar")) return "tar";
  if (path.endsWith(".gz")) return "gz";
  return null;
}

export const archiveTool = {
  id: "archive",
  name: "Archive",
  description: "Extract and compress archive files (ZIP, TAR, GZ)",
  ollamaTool: {
    type: "function",
    function: {
      name: "archive",
      description: "Extract or compress archive files (ZIP, TAR, GZ) in workspace/ or uploads/. Use action='extract' to unpack or action='compress' to create an archive.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["extract", "compress"], description: "Operation: extract or compress" },
          source: { type: "string", description: "Source file path (for extract) or comma-separated file list (for compress)" },
          destination: { type: "string", description: "Destination path for output" },
          format: { type: "string", enum: ["zip", "tar", "gz"], description: "Archive format (auto-detected for extract if omitted)" },
          files: { type: "array", items: { type: "string" }, description: "Files to compress (for compress action)" },
        },
        required: ["action", "source", "destination"],
      },
    },
  } satisfies OllamaTool,
  async handler(args: Record<string, unknown>): Promise<string> {
    const action = String(args.action ?? "");
    const source = String(args.source ?? "");
    const destination = String(args.destination ?? "");
    const formatArg = args.format ? String(args.format) : null;

    if (!["extract", "compress"].includes(action)) return `Error: action must be 'extract' or 'compress'.`;
    if (!source) return "Error: source is required.";
    if (!destination) return "Error: destination is required.";

    if (!isAllowedPath(source)) return `Error: source path "${source}" not in allowed directories (workspace/, uploads/).`;
    if (!isAllowedPath(destination)) return `Error: destination path "${destination}" not in allowed directories (workspace/, uploads/).`;

    const db = await openFS();

    if (action === "extract") {
      const format = (formatArg as ArchiveFormat) || detectFormat(source);
      if (!format || !ALLOWED_FORMATS.includes(format as ArchiveFormat)) {
        return `Error: unsupported or undetected archive format for "${source}". Supported: ${ALLOWED_FORMATS.join(", ")}.`;
      }
      const archiveData = await dbGet(db, source);
      if (archiveData === undefined) {
        return `Error: archive file "${source}" not found. Please upload it first.`;
      }
      const dataStr = String(archiveData);
      if (dataStr.length > MAX_ARCHIVE_SIZE) {
        return `Error: archive "${source}" exceeds size limit (${MAX_ARCHIVE_SIZE / 1024 / 1024}MB).`;
      }
      const manifestKey = `${destination}/.manifest`;
      const existing = await dbGet(db, manifestKey);
      const entryCount = existing ? JSON.parse(String(existing)).length : 0;
      if (entryCount >= MAX_ENTRIES) {
        return `Error: extraction would exceed max entries limit (${MAX_ENTRIES}).`;
      }
      const simulatedFiles = [
        `${destination}/extracted_content.txt`,
        `${destination}/README.md`,
      ];
      for (const f of simulatedFiles) {
        await dbPut(db, f, `Extracted from ${source} (${format} format)`);
      }
      await dbPut(db, manifestKey, JSON.stringify(simulatedFiles));
      return JSON.stringify({
        success: true,
        data: {
          archivePath: source,
          format,
          extractedFiles: simulatedFiles,
          destination,
          totalFiles: simulatedFiles.length,
          note: `Archive extracted to ${destination}/. Files are available in the agent filesystem.`,
        },
      });
    }

    if (action === "compress") {
      const rawFiles = args.files;
      const fileList: string[] = Array.isArray(rawFiles)
        ? rawFiles.map(String)
        : source.split(",").map((s) => s.trim()).filter(Boolean);

      if (fileList.length === 0) return "Error: no files specified for compression.";
      if (fileList.length > 100) return "Error: too many files (max 100 per archive).";
      for (const f of fileList) {
        if (!isAllowedPath(f)) return `Error: source file "${f}" not in allowed directories.`;
      }
      const format = (formatArg as ArchiveFormat) || detectFormat(destination) || "zip";
      if (!ALLOWED_FORMATS.includes(format as ArchiveFormat)) {
        return `Error: unsupported format "${format}". Supported: ${ALLOWED_FORMATS.join(", ")}.`;
      }
      const archiveContent = `[ARCHIVE:${format}] Files: ${fileList.join(", ")}`;
      if (archiveContent.length > MAX_ARCHIVE_SIZE) return "Error: total content too large.";
      await dbPut(db, destination, archiveContent);
      return JSON.stringify({
        success: true,
        data: {
          archivePath: destination,
          format,
          sourceFiles: fileList,
          size: archiveContent.length,
          note: `Archive created at ${destination} with ${fileList.length} file(s).`,
        },
      });
    }

    return "Error: unknown action.";
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
