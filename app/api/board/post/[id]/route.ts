import { NextResponse } from "next/server";
import { mutateBoard } from "@/lib/boardStore";
import { getBoardUser } from "@/lib/boardAuth";
import { cleanAttachments } from "@/lib/uploads";

/** PATCH: edit a post (author or staff). Body: { body, attachments? } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { body, attachments } = await req.json().catch(() => ({}));
  const files = cleanAttachments(attachments);
  if (!body?.trim() && files.length === 0) {
    return NextResponse.json({ error: "Message or attachment required." }, { status: 400 });
  }

  const result = await mutateBoard((data) => {
    const post = data.posts.find((p) => p.id === params.id);
    if (!post) return "missing";
    if (post.authorKey !== me.key && !me.staff) return "forbidden";
    post.body = String(body ?? "").slice(0, 5000);
    post.attachments = files;
    post.editedAt = new Date().toISOString();
    return "ok";
  });

  if (result === "missing") return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });
  return NextResponse.json({ ok: true });
}

/** POST: toggle a like on a post. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const likes = await mutateBoard((data) => {
    const post = data.posts.find((p) => p.id === params.id);
    if (!post) return null;
    const i = post.likes.indexOf(me.key);
    if (i >= 0) post.likes.splice(i, 1);
    else post.likes.push(me.key);
    return post.likes.length;
  });

  if (likes === null) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ ok: true, likes });
}

/** DELETE: remove a post (author or staff). Deleting a thread's first post removes the thread. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getBoardUser();
  if (!me) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const result = await mutateBoard((data) => {
    const post = data.posts.find((p) => p.id === params.id);
    if (!post) return "missing";
    if (post.authorKey !== me.key && !me.staff) return "forbidden";

    const threadPosts = data.posts
      .filter((p) => p.threadId === post.threadId)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    const isRoot = threadPosts[0]?.id === post.id;

    if (isRoot) {
      data.posts = data.posts.filter((p) => p.threadId !== post.threadId);
      data.threads = data.threads.filter((t) => t.id !== post.threadId);
    } else {
      data.posts = data.posts.filter((p) => p.id !== post.id);
    }
    return "ok";
  });

  if (result === "missing") return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "You can only delete your own posts." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
