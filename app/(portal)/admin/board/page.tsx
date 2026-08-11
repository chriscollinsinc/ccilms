"use client";

import { useEffect, useState } from "react";

interface Channel {
  id: string;
  name: string;
  description: string;
}
interface ModThread {
  id: string;
  channelId: string;
  channelName: string;
  title: string;
  authorName: string;
  createdAt: string;
  replyCount: number;
  pinned?: boolean;
  locked?: boolean;
}

export default function BoardModeration() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [threads, setThreads] = useState<ModThread[]>([]);
  const [filter, setFilter] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [newChannel, setNewChannel] = useState({ name: "", description: "" });
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/admin/board");
    if (r.status === 403) return setState("denied");
    if (!r.ok) return setState("error");
    const data = await r.json();
    setChannels(data.channels ?? []);
    setThreads(data.threads ?? []);
    setState("ready");
  }
  useEffect(() => {
    load();
  }, []);

  async function act(payload: Record<string, unknown>) {
    setNote(null);
    const r = await fetch("/api/admin/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) setNote(data.error ?? "Action failed.");
    await load();
  }

  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading…</div>;
  if (state === "denied") return <div className="p-10 text-sm text-slate-400">Board moderation is admin-only.</div>;
  if (state === "error") return <div className="p-10 text-sm text-red-400">Couldn&apos;t load. Refresh to retry.</div>;

  const shown = threads.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <h1 className="text-xl font-bold text-white">Board Moderation</h1>
      <p className="mt-1 text-sm text-slate-400">Pin announcements, lock heated threads, remove posts, manage channels.</p>
      {note && <p className="mt-3 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">{note}</p>}

      {/* Channels */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Channels</h2>
        <div className="mt-3 space-y-2">
          {channels.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
              <div className="min-w-0 flex-1">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && act({ action: "editChannel", channelId: c.id, name: e.target.value })}
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none focus:text-gold-400"
                />
                <input
                  defaultValue={c.description}
                  onBlur={(e) => e.target.value !== c.description && act({ action: "editChannel", channelId: c.id, description: e.target.value })}
                  placeholder="Description"
                  className="w-full bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-700"
                />
              </div>
              <button
                onClick={() => confirm(`Delete channel "${c.name}"?`) && act({ action: "deleteChannel", channelId: c.id })}
                className="shrink-0 rounded border border-ink-700 px-3 py-1 text-xs text-slate-500 hover:border-red-800 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newChannel.name}
            onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
            placeholder="New channel name"
            className="w-52 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
          />
          <input
            value={newChannel.description}
            onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
            placeholder="Description (optional)"
            className="min-w-0 flex-1 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
          />
          <button
            onClick={() => {
              if (!newChannel.name.trim()) return;
              act({ action: "addChannel", ...newChannel });
              setNewChannel({ name: "", description: "" });
            }}
            className="shrink-0 rounded-md border border-gold-500/60 px-4 py-2 text-sm font-semibold text-gold-400 hover:bg-gold-500 hover:text-ink-950"
          >
            Add channel
          </button>
        </div>
      </section>

      {/* Threads */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Threads ({threads.length})</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter threads…"
            className="w-56 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
          />
        </div>
        <ul className="divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
          {shown.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {t.pinned && <span className="rounded bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">PINNED</span>}
                  {t.locked && <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">LOCKED</span>}
                  <a href={`/community/${t.id}`} className="truncate text-sm font-medium text-white hover:text-gold-400">{t.title}</a>
                </div>
                <p className="text-xs text-slate-500">
                  {t.channelName} · {t.authorName} · {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => act({ action: t.pinned ? "unpin" : "pin", threadId: t.id })} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-400 hover:border-gold-500/50 hover:text-gold-400">
                  {t.pinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => act({ action: t.locked ? "unlock" : "lock", threadId: t.id })} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-white">
                  {t.locked ? "Unlock" : "Lock"}
                </button>
                <button onClick={() => confirm("Delete this thread and all replies?") && act({ action: "deleteThread", threadId: t.id })} className="rounded border border-ink-700 px-2.5 py-1 text-xs text-slate-400 hover:border-red-800 hover:text-red-400">
                  Delete
                </button>
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-600">No threads.</li>}
        </ul>
      </section>
    </div>
  );
}
