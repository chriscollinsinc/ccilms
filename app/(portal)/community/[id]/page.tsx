"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MentionComposer, PostBody, AttachmentPicker, AttachmentList, timeAgo, initials, type Attachment } from "@/components/board";
import { THREAD_TAGS, tagById } from "@/lib/boardTags";

interface Post {
  id: string;
  authorKey: string;
  authorName: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  likes: string[];
  attachments?: Attachment[];
}
interface ThreadData {
  thread: { id: string; title: string; authorKey?: string; authorName: string; createdAt: string; pinned?: boolean; locked?: boolean; tag?: string };
  channel?: { id: string; name: string };
  posts: Post[];
  me: { key: string; name: string; staff: boolean };
  members?: string[];
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ThreadData | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editFiles, setEditFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  const load = useCallback(async () => {
    const r = await fetch(`/api/board/thread/${id}`);
    if (!r.ok) return setState("missing");
    setData(await r.json());
    setState("ready");
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/board")
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(() => {});
  }, [load]);

  async function sendReply() {
    if (!reply.trim() && replyFiles.length === 0) return;
    setBusy(true);
    const r = await fetch(`/api/board/thread/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply, attachments: replyFiles }),
    });
    setBusy(false);
    if (r.ok) {
      setReply("");
      setReplyFiles([]);
      load();
    }
  }

  async function moderate(action: string, tag?: string) {
    if (action === "delete" && !confirm("Delete this entire thread?")) return;
    const r = await fetch(`/api/board/moderate/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, tag }),
    });
    const data = await r.json().catch(() => ({}));
    if (data.deleted) return router.push("/community");
    if (r.ok) load();
  }

  function startEdit(p: Post) {
    setEditingId(p.id);
    setEditBody(p.body);
    setEditFiles(p.attachments ?? []);
  }
  async function saveEdit(postId: string) {
    if (!editBody.trim() && editFiles.length === 0) return;
    setBusy(true);
    const r = await fetch(`/api/board/post/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody, attachments: editFiles }),
    });
    setBusy(false);
    if (r.ok) {
      setEditingId(null);
      load();
    }
  }

  async function toggleLike(postId: string) {
    await fetch(`/api/board/post/${postId}`, { method: "POST" });
    load();
  }

  async function removePost(postId: string, isRoot: boolean) {
    if (!confirm(isRoot ? "Delete this entire thread?" : "Delete this post?")) return;
    const r = await fetch(`/api/board/post/${postId}`, { method: "DELETE" });
    if (r.ok) {
      if (isRoot) router.push("/community");
      else load();
    }
  }

  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading…</div>;
  if (state === "missing" || !data)
    return (
      <div className="p-10 text-sm text-slate-400">
        Thread not found. <Link href="/community" className="text-gold-400">Back to the board</Link>
      </div>
    );

  const { thread, channel, posts, me } = data;
  const isThreadAuthor = thread.authorKey === me.key;
  const canTag = me.staff || isThreadAuthor;

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link href="/community" className="text-xs text-slate-400 hover:text-white">
        ← Community Board {channel ? `· ${channel.name}` : ""}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tagById(thread.tag) && (
          <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${tagById(thread.tag)!.badge}`}>
            {tagById(thread.tag)!.label}
          </span>
        )}
        {thread.pinned && <span className="rounded bg-gold-500/15 px-2 py-0.5 text-[11px] font-bold text-gold-400">PINNED</span>}
        {thread.locked && <span className="rounded bg-ink-700 px-2 py-0.5 text-[11px] font-bold text-slate-400">LOCKED</span>}
      </div>
      <h1 className="mt-2 text-2xl font-bold leading-tight text-white">{thread.title}</h1>
      <p className="mt-1 text-xs text-slate-500">
        Started by {thread.authorName} · {timeAgo(thread.createdAt)}
      </p>

      {/* Moderator + author controls */}
      {canTag && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
          {me.staff && (
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Moderate</span>
              <button onClick={() => moderate(thread.pinned ? "unpin" : "pin")} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-300 hover:border-gold-500/50 hover:text-gold-400">
                {thread.pinned ? "Unpin" : "Pin"}
              </button>
              <button onClick={() => moderate(thread.locked ? "unlock" : "lock")} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white">
                {thread.locked ? "Unlock" : "Lock"}
              </button>
              <span className="mx-1 h-4 w-px bg-ink-700" />
            </>
          )}
          <span className="text-xs text-slate-500">Tag:</span>
          {THREAD_TAGS.map((t) => (
            <button
              key={t.id}
              onClick={() => moderate(thread.tag === t.id ? "clearTag" : "setTag", t.id)}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                thread.tag === t.id ? t.badge : "border border-ink-700 text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
          {me.staff && (
            <>
              <span className="mx-1 h-4 w-px bg-ink-700" />
              <button onClick={() => moderate("delete")} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-400 hover:border-red-800 hover:text-red-400">
                Delete thread
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {posts.map((p, i) => {
          const liked = p.likes.includes(me.key);
          const mine = p.authorKey === me.key || me.staff;
          const editing = editingId === p.id;
          return (
            <div key={p.id} className={`rounded-xl border bg-ink-900 p-5 ${i === 0 ? "border-gold-500/30" : "border-ink-700"}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gold-400">
                  {initials(p.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{p.authorName}</p>
                  <p className="text-xs text-slate-500">
                    {timeAgo(p.createdAt)}
                    {p.editedAt && <span className="text-slate-600"> · edited {timeAgo(p.editedAt)}</span>}
                  </p>
                </div>
                {mine && !editing && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded border border-ink-700 px-2 py-1 text-xs text-slate-500 hover:border-slate-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removePost(p.id, i === 0)}
                      className="rounded border border-ink-700 px-2 py-1 text-xs text-slate-500 hover:border-red-800 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {editing ? (
                <div className="mt-3">
                  <MentionComposer value={editBody} onChange={setEditBody} members={members} rows={3} placeholder="Edit your message…" />
                  <AttachmentPicker attachments={editFiles} onChange={setEditFiles} />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="rounded-md border border-ink-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(p.id)}
                      disabled={busy || (!editBody.trim() && editFiles.length === 0)}
                      className="rounded-md bg-gold-500 px-4 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-400 disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <PostBody body={p.body} />
                  <AttachmentList attachments={p.attachments} />
                </div>
              )}
              {!editing && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleLike(p.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      liked
                        ? "bg-gold-500/15 text-gold-400"
                        : "border border-ink-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                    }`}
                  >
                    ♥ {p.likes.length > 0 ? p.likes.length : "Like"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply */}
      {thread.locked && !me.staff ? (
        <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900 p-5 text-center text-sm text-slate-400">
          🔒 This thread is locked. New replies are turned off.
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reply as {me.name}
            {thread.locked && me.staff && <span className="ml-2 text-slate-600">(locked — staff can still post)</span>}
          </p>
          <MentionComposer value={reply} onChange={setReply} members={members} placeholder="Write a reply… (type @ to mention someone)" />
          <AttachmentPicker attachments={replyFiles} onChange={setReplyFiles} />
          <div className="mt-3 flex justify-end">
            <button
              onClick={sendReply}
              disabled={busy || (!reply.trim() && replyFiles.length === 0)}
              className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
            >
              {busy ? "Posting…" : "Post reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
