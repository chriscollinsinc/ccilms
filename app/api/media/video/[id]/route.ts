import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getSession } from "@/lib/session";
import { getVideoPath } from "@/lib/videoUploads";

export const runtime = "nodejs";

/**
 * GET: stream an uploaded trailer. Supports HTTP Range so the browser can
 * start playback before the whole file downloads, and so seeking works.
 * Members only, same as every other portal media route.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return new Response("Sign in required.", { status: 401 });

  const rawId = params.id.replace(/\.(mp4|webm|mov|m4v)$/i, "");
  const found = await getVideoPath(rawId);
  if (!found) return new Response("Not found.", { status: 404 });

  const { path: filePath, meta } = found;
  const { size } = await stat(filePath);

  const range = req.headers.get("range");
  const baseHeaders = {
    "Content-Type": meta.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  if (!range) {
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(size) },
    });
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) return new Response("Invalid range.", { status: 416 });

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (start >= size || end >= size || start > end) {
    return new Response("Invalid range.", {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
