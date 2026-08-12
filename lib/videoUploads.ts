/**
 * Course trailer video uploads (Spotlight editor "upload a file" option).
 *
 * Stored under UPLOAD_BASE_DIR/videos on the Render persistent disk (see
 * render.yaml — the `uploads` disk mounted at UPLOAD_DIR), separate from
 * board attachments so a bad video upload can't collide with that index.
 *
 * Files are served by app/api/media/video/[id]/route.ts, which streams from
 * disk (not buffered in memory) and supports HTTP Range requests so large
 * trailers start playing quickly instead of waiting on a full download.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_BASE_DIR } from "@/lib/uploads";

export interface VideoMeta {
  id: string;
  name: string; // original filename (display only)
  size: number;
  type: string; // mime
  ext: string;
  storedName: string;
  courseId?: string;
  uploadedAt: string;
}

const DIR = path.join(UPLOAD_BASE_DIR, "videos");
const INDEX = path.join(DIR, "index.json");

// Trailers are short marketing clips, not full course recordings — 300MB
// comfortably covers a few minutes of 1080p while keeping the disk in check.
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
};

export function isAllowedVideo(type: string): boolean {
  return type in ALLOWED;
}

async function readIndex(): Promise<Record<string, VideoMeta>> {
  try {
    return JSON.parse(await fs.readFile(INDEX, "utf8"));
  } catch {
    return {};
  }
}
async function writeIndex(data: Record<string, VideoMeta>): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(INDEX, JSON.stringify(data, null, 2), "utf8");
}

export async function saveVideo(
  file: File,
  courseId?: string
): Promise<{ id: string; name: string; size: number; type: string; url: string } | { error: string }> {
  if (!isAllowedVideo(file.type)) {
    return { error: `Unsupported video type: ${file.type || "unknown"}. Use MP4, WebM, or MOV.` };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: `File is larger than ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB.` };
  }
  if (file.size === 0) return { error: "File is empty." };

  const id = randomUUID();
  const ext = ALLOWED[file.type];
  const storedName = `${id}.${ext}`;
  await fs.mkdir(DIR, { recursive: true });

  // Stream the upload straight to disk instead of holding the whole file in
  // memory — matters here since trailers can be tens of MB.
  const dest = path.join(DIR, storedName);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(arrayBuffer));

  const cleanName = (file.name || `trailer.${ext}`).replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  const meta: VideoMeta = {
    id,
    name: cleanName,
    size: file.size,
    type: file.type,
    ext,
    storedName,
    courseId,
    uploadedAt: new Date().toISOString(),
  };
  const index = await readIndex();
  index[id] = meta;
  await writeIndex(index);

  // isDirectVideo() (lib/video.ts) matches by file extension, so the served
  // URL needs to end in the real extension, not just the opaque id.
  return { id, name: cleanName, size: meta.size, type: meta.type, url: `/api/media/video/${id}.${ext}` };
}

export async function getVideoPath(id: string): Promise<{ path: string; meta: VideoMeta } | null> {
  const index = await readIndex();
  const meta = index[id];
  if (!meta) return null;
  const filePath = path.join(DIR, meta.storedName);
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }
  return { path: filePath, meta };
}
