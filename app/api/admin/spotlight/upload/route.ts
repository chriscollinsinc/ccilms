import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { canEditContent } from "@/lib/admin";
import { saveVideo } from "@/lib/videoUploads";

export const runtime = "nodejs";
// App Router parses multipart bodies itself via req.formData() below — no
// bodyParser config needed (that's a Pages Router concept).

/** POST multipart form-data field "file" (+ optional "courseId") -> { url }. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !(await canEditContent(session.userId))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const courseId = form?.get("courseId");
  const result = await saveVideo(file, typeof courseId === "string" ? courseId : undefined);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, ...result });
}
