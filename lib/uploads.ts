/**
 * Board file uploads.
 * DEV: stores files in data/uploads/ + metadata in data/uploads/index.json.
 * PROD: swap saveUpload/readUpload for Vercel Blob or S3 — nothing else changes.
 *
 * Security: strict type allowlist (no html/svg/js/executables), 20MB cap,
 * random stored names, served as forced downloads with safe headers.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface Attachment {
  id: string;
  name: string; // original filename (display only)
  size: number;
  type: string; // mime
}

interface StoredMeta extends Attachment {
  storedName: string;
}

const DIR = path.join(process.cwd(), "data", "uploads");
const INDEX = path.join(DIR, "index.json");

export const MAX_BYTES = 20 * 1024 * 1024;

// mime -> safe extension. Anything not here is rejected.
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/zip": "zip",
};

export function isAllowed(type: string): boolean {
  return type in ALLOWED;
}

export function isImage(type: string): boolean {
  return type.startsWith("image/");
}

async function readIndex(): Promise<Record<string, StoredMeta>> {
  try {
    return JSON.parse(await fs.readFile(INDEX, "utf8"));
  } catch {
    return {};
  }
}
async function writeIndex(data: Record<string, StoredMeta>): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(INDEX, JSON.stringify(data, null, 2), "utf8");
}

export async function saveUpload(file: File): Promise<Attachment | { error: string }> {
  if (!isAllowed(file.type)) return { error: `File type not allowed: ${file.type || "unknown"}` };
  if (file.size > MAX_BYTES) return { error: "File is larger than 20MB." };
  if (file.size === 0) return { error: "File is empty." };

  const id = randomUUID();
  const ext = ALLOWED[file.type];
  const storedName = `${id}.${ext}`;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, storedName), Buffer.from(await file.arrayBuffer()));

  const cleanName = (file.name || `file.${ext}`).replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  const meta: StoredMeta = { id, name: cleanName, size: file.size, type: file.type, storedName };
  const index = await readIndex();
  index[id] = meta;
  await writeIndex(index);

  return { id, name: cleanName, size: meta.size, type: meta.type };
}

export async function readUpload(id: string): Promise<{ buffer: Buffer; meta: StoredMeta } | null> {
  const index = await readIndex();
  const meta = index[id];
  if (!meta) return null;
  try {
    const buffer = await fs.readFile(path.join(DIR, meta.storedName));
    return { buffer, meta };
  } catch {
    return null;
  }
}

/** Trust only id/name/size/type from client refs (validated at upload). Cap 5. */
export function cleanAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && typeof a.id === "string" && typeof a.name === "string")
    .slice(0, 5)
    .map((a) => ({
      id: String(a.id),
      name: String(a.name).slice(0, 120),
      size: Number(a.size) || 0,
      type: String(a.type ?? ""),
    }));
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
