import { NextResponse } from "next/server";
import { readBoard, mutateBoard, newId, summarizeThreads } from "@/lib/boardStore";
import { getBoardUser } from "@/lib/boardAuth";
import { getUsers } from "@/lib/talentlms";
import { cleanAttachments } from "@/lib/uploads";
import { tagById } from "@/lib/boardTags";

/** GET: channels + thread summaries + mentionable member names. */
export async function GET() {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [board, users] = await Promise.all([readBoard(), getUsers().catch(() => [])]);
  const threads = summarizeThreads(board);

  return NextResponse.json({
    channels: board.channels,
    threads,
    me: { key: me.key, name: me.name, staff: me.staff },
    members: users.map((u) => `${u.first_name} ${u.last_name}`.trim()).filter(Boolean),
  });
}

/** POST: create a thread. Body: { channelId, title, body } */
export async function POST(req: Request) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { channelId, title, body, attachments, tag } = await req.json().catch(() => ({}));
  const files = cleanAttachments(attachments);
  if (!channelId || !title?.trim() || (!body?.trim() && files.length === 0)) {
    return NextResponse.json({ error: "Channel, title, and a message or attachment are required." }, { status: 400 });
  }

  const threadId = await mutateBoard((data) => {
    if (!data.channels.some((c) => c.id === channelId)) throw new Error("bad channel");
    const id = newId();
    const now = new Date().toISOString();
    data.threads.push({
      id,
      channelId,
      title: String(title).slice(0, 150),
      authorKey: me.key,
      authorName: me.name,
      createdAt: now,
      ...(tagById(tag) ? { tag } : {}),
    });
    data.posts.push({
      id: newId(),
      threadId: id,
      authorKey: me.key,
      authorName: me.name,
      body: String(body ?? "").slice(0, 5000),
      createdAt: now,
      likes: [],
      attachments: files,
    });
    return id;
  }).catch(() => null);

  if (!threadId) return NextResponse.json({ error: "Couldn't create the thread." }, { status: 400 });
  return NextResponse.json({ ok: true, threadId });
}
