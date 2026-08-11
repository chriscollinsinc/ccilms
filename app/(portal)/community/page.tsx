"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MentionComposer, AttachmentPicker, timeAgo, initials, type Attachment } from "@/components/board";
import { tagById, THREAD_TAGS } from "@/lib/boardTags";

interface Channel {
  id: string;
  name: string;
  description: string;
}
interface ThreadSummary {
  id: string;
  channelId: string;
  title: string;
  authorName: string;
  createdAt: string;
  replyCount: number;
  lastActivity: string;
  pinned?: boolean;
  locked?: boolean;
  tag?: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [active, setActive] = useState("general");
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch("/api/board")
      .then(async (r) => {
        const data = await r.json();
        setChannels(data.channels ?? []);
        setThreads(data.threads ?? []);
        setMembers(data.members ?? []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const channelThreads = useMemo(() => threads.filter((t) => t.channelId === active), [threads, active]);
  const channel = channels.find((c) => c.id === active);

  async function createThread() {
    if (!title.trim() || (!body.trim() && attachments.length === 0)) return;
    setBusy(true);
    const r = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: active, title, body, attachments, tag: tag || undefined }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && data.threadId) router.push(`/community/${data.threadId}`);
  }

  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading the board…</div>;
  if (state === "error") return <div className="p-10 text-sm text-red-400">Couldn&apos;t load the board. Refresh to retry.</div>;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-2xl font-bold text-white">Community Board</h1>
      <p className="mt-1 text-sm text-slate-400">Ask questions, share wins, talk shop with fellow members.</p>

      {/* Channel tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActive(c.id);
              setComposing(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              c.id === active
                ? "bg-gold-500 text-ink-950"
                : "border border-ink-700 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {channel && <p className="mt-3 text-xs text-slate-500">{channel.description}</p>}

      {/* New thread */}
      <div className="mt-6">
        {composing ? (
          <div className="rounded-xl border border-gold-500/40 bg-ink-900 p-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title"
              maxLength={150}
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
            />
            <div className="mt-3">
              <MentionComposer value={body} onChange={setBody} members={members} rows={4} placeholder="Say something… (type @ to mention someone)" />
            </div>
            <AttachmentPicker attachments={attachments} onChange={setAttachments} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Tag (optional):</span>
              {THREAD_TAGS.map((tg) => (
                <button
                  key={tg.id}
                  type="button"
                  onClick={() => setTag(tag === tg.id ? "" : tg.id)}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition ${
                    tag === tg.id ? tg.badge : "border border-ink-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {tg.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setComposing(false)} className="rounded-md border border-ink-700 px-4 py-2 text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={createThread}
                disabled={busy || !title.trim() || (!body.trim() && attachments.length === 0)}
                className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
              >
                {busy ? "Posting…" : "Post thread"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setComposing(true)}
            className="w-full rounded-xl border border-dashed border-ink-700 px-5 py-4 text-left text-sm text-slate-500 transition hover:border-gold-500/50 hover:text-slate-300"
          >
            Start a new thread in {channel?.name ?? "this channel"}…
          </button>
        )}
      </div>

      {/* Threads */}
      <div className="mt-6 space-y-2">
        {channelThreads.map((t) => (
          <button
            key={t.id}
            onClick={() => router.push(`/community/${t.id}`)}
            className={`flex w-full items-center gap-4 rounded-xl border border-l-4 border-ink-700 bg-ink-900 px-5 py-4 text-left transition hover:border-gold-500/40 ${
              tagById(t.tag) ? tagById(t.tag)!.ring : "border-l-ink-700"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gold-400">
              {initials(t.authorName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                {tagById(t.tag) && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${tagById(t.tag)!.badge}`}>
                    {tagById(t.tag)!.label}
                  </span>
                )}
                {t.pinned && <span className="shrink-0 rounded bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">PINNED</span>}
                {t.locked && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-slate-500">
                    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                )}
                <span className="truncate text-sm font-semibold text-white">{t.title}</span>
              </span>
              <span className="block text-xs text-slate-500">
                {t.authorName} · {timeAgo(t.createdAt)}
              </span>
            </span>
            <span className="shrink-0 text-xs text-slate-500">
              {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
            </span>
          </button>
        ))}
        {channelThreads.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-800 px-5 py-10 text-center text-sm text-slate-600">
            No threads here yet — start the first one.
          </p>
        )}
      </div>
    </div>
  );
}
