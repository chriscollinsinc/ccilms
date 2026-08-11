import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { readBoard, mutateBoard, newId } from "@/lib/boardStore";

async function guard() {
  const session = await getSession();
  if (!session) return false;
  return isAdmin(session.userId);
}

/** GET: full board with per-thread reply counts for the moderation table. */
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const board = await readBoard();
  const threads = board.threads
    .map((t) => ({
      ...t,
      channelName: board.channels.find((c) => c.id === t.channelId)?.name ?? t.channelId,
      replyCount: Math.max(board.posts.filter((p) => p.threadId === t.id).length - 1, 0),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ channels: board.channels, threads });
}

/**
 * POST: moderation actions.
 *  { action:"pin"|"unpin"|"lock"|"unlock"|"deleteThread", threadId }
 *  { action:"addChannel", name, description }
 *  { action:"editChannel", channelId, name, description }
 *  { action:"deleteChannel", channelId }   (only if empty)
 */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  const result = await mutateBoard((data) => {
    switch (action) {
      case "pin":
      case "unpin": {
        const t = data.threads.find((x) => x.id === body.threadId);
        if (!t) return "missing";
        t.pinned = action === "pin";
        return "ok";
      }
      case "lock":
      case "unlock": {
        const t = data.threads.find((x) => x.id === body.threadId);
        if (!t) return "missing";
        t.locked = action === "lock";
        return "ok";
      }
      case "deleteThread": {
        if (!data.threads.some((x) => x.id === body.threadId)) return "missing";
        data.threads = data.threads.filter((x) => x.id !== body.threadId);
        data.posts = data.posts.filter((p) => p.threadId !== body.threadId);
        return "ok";
      }
      case "addChannel": {
        const name = String(body.name ?? "").trim();
        if (!name) return "bad";
        data.channels.push({ id: newId(), name: name.slice(0, 40), description: String(body.description ?? "").slice(0, 120) });
        return "ok";
      }
      case "editChannel": {
        const c = data.channels.find((x) => x.id === body.channelId);
        if (!c) return "missing";
        if (typeof body.name === "string" && body.name.trim()) c.name = body.name.trim().slice(0, 40);
        if (typeof body.description === "string") c.description = body.description.slice(0, 120);
        return "ok";
      }
      case "deleteChannel": {
        const hasThreads = data.threads.some((t) => t.channelId === body.channelId);
        if (hasThreads) return "notempty";
        if (data.channels.length <= 1) return "last";
        data.channels = data.channels.filter((c) => c.id !== body.channelId);
        return "ok";
      }
      default:
        return "bad";
    }
  });

  if (result === "ok") return NextResponse.json({ ok: true });
  const msg =
    result === "notempty"
      ? "Move or delete this channel's threads first."
      : result === "last"
        ? "You need at least one channel."
        : result === "missing"
          ? "Not found."
          : "Invalid request.";
  return NextResponse.json({ error: msg }, { status: 400 });
}
