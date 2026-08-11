import { getBoardUser } from "@/lib/boardAuth";
import { readUpload, isImage } from "@/lib/uploads";

export const runtime = "nodejs";

/** GET: serve an attachment. Members only. Forced download for non-images. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return new Response("Sign in required.", { status: 401 });

  const found = await readUpload(params.id);
  if (!found) return new Response("Not found.", { status: 404 });

  const { buffer, meta } = found;
  // Images can render inline; everything else is a forced download so the
  // browser never executes it. Safe headers on both.
  const disposition = isImage(meta.type) ? "inline" : "attachment";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": meta.type,
      "Content-Disposition": `${disposition}; filename="${meta.name.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
