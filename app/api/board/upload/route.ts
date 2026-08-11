import { NextResponse } from "next/server";
import { getBoardUser } from "@/lib/boardAuth";
import { saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";

/** POST multipart form-data field "file" -> attachment metadata. */
export async function POST(req: Request) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const result = await saveUpload(file);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, attachment: result });
}
