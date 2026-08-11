import { NextResponse } from "next/server";
import { readBoard, mutateBoard, newId } from "@/lib/boardStore";
import { getBoardUser } from "@/lib/boardAuth";
import { cleanAttachments } from "@/lib/uploads";

/** GET: a thread with its posts. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const board = await readBoard();
  const thread = board.threads.find((t) => t.id === params.id);
  if (!thread) return NextResponse.json({ error: "Thread not found." }, { status: 404 });

  const channel = board.channels.find((c) => c.id === thread.channelId);
  const posts = board.posts
    .filter((p) => p.threadId === thread.id)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  return NextResponse.json({
    thread,
    channel,
    posts,
    me: { key: me.key, name: me.name, staff: me.staff },
  });
}

/** POST: reply to the thread. Body: { body } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { body, attachments } = await req.json().catch(() => ({}));
  const files = cleanAttachments(attachments);
  if (!body?.trim() && files.length === 0) return NextResponse.json({ error: "Message or attachment required." }, { status: 400 });

  const ok = await mutateBoard((data) => {
    const thread = data.threads.find((t) => t.id === params.id);
    if (!thread) return false;
    if (thread.locked && !me.staff) return "locked";
    data.posts.push({
      id: newId(),
      threadId: params.id,
      authorKey: me.key,
      authorName: me.name,
      body: String(body ?? "").slice(0, 5000),
      createdAt: new Date().toISOString(),
      likes: [],
      attachments: files,
    });
    return true;
  });

  if (ok === "locked") return NextResponse.json({ error: "This thread is locked." }, { status: 403 });
  if (!ok) return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
