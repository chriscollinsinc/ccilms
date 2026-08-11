import { NextResponse } from "next/server";
import { getBoardUser } from "@/lib/boardAuth";
import { mutateBoard } from "@/lib/boardStore";
import { tagById } from "@/lib/boardTags";

/**
 * POST /api/board/moderate/:threadId  — inline moderation for staff
 * (admins + managers). Body: { action: "pin"|"unpin"|"lock"|"unlock"|
 * "setTag"|"clearTag"|"delete", tag? }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { action, tag } = await req.json().catch(() => ({}));
  // Tagging is allowed for the thread author too; pin/lock/delete are staff-only.
  const staffOnly = action !== "setTag" && action !== "clearTag";

  const result = await mutateBoard((data) => {
    const t = data.threads.find((x) => x.id === params.id);
    if (!t && action !== "delete") return "missing";
    const isAuthor = t?.authorKey === me.key;
    if (staffOnly && !me.staff) return "forbidden";
    if (!staffOnly && !me.staff && !isAuthor) return "forbidden";
    switch (action) {
      case "pin":
      case "unpin":
        t!.pinned = action === "pin";
        return "ok";
      case "lock":
      case "unlock":
        t!.locked = action === "lock";
        return "ok";
      case "setTag":
        if (!tagById(tag)) return "bad";
        t!.tag = tag;
        return "ok";
      case "clearTag":
        delete t!.tag;
        return "ok";
      case "delete":
        if (!data.threads.some((x) => x.id === params.id)) return "missing";
        data.threads = data.threads.filter((x) => x.id !== params.id);
        data.posts = data.posts.filter((p) => p.threadId !== params.id);
        return "deleted";
      default:
        return "bad";
    }
  });

  if (result === "ok") return NextResponse.json({ ok: true });
  if (result === "deleted") return NextResponse.json({ ok: true, deleted: true });
  if (result === "forbidden") return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  return NextResponse.json({ error: result === "missing" ? "Not found." : "Invalid request." }, { status: 400 });
}
