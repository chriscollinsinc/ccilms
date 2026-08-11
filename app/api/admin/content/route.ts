import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { canEditContent } from "@/lib/admin";
import { readContent, writeContent, type PortalContent } from "@/lib/contentStore";

async function guard() {
  const session = await getSession();
  if (!session) return false;
  return canEditContent(session.userId);
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  return NextResponse.json(await readContent());
}

export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = (await req.json().catch(() => null)) as PortalContent | null;
  if (!body || !body.podcast || !body.coach || !Array.isArray(body.resources) || !Array.isArray(body.tools)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  await writeContent(body);
  return NextResponse.json({ ok: true });
}
