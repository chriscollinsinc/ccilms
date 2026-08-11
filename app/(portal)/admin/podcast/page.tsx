"use client";

import { useState } from "react";
import { useAdminContent, SaveBar, Field, RowControls, StatusNote, move } from "@/components/admin";
import { youTubeId } from "@/lib/video";

function PlaylistSync() {
  const [url, setUrl] = useState("https://youtube.com/playlist?list=PLxE3XASkn8NtOgsH6rBRSWwUn8XFJWtoy");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/podcast-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistUrl: url }),
    });
    const data = await r.json().catch(() => ({}));
    setMsg(
      r.ok
        ? { ok: true, text: `Synced ${data.count} episodes — the podcast page is now live with them.` }
        : { ok: false, text: data.error ?? "Sync failed." }
    );
    setBusy(false);
  }

  return (
    <div className="mt-8 rounded-xl border border-gold-500/30 bg-ink-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-500">
        Episode sync — YouTube playlist
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Pulls every episode (title, thumbnail, publish date) into the Cover Flow browser.
        Requires <code className="rounded bg-ink-800 px-1 py-0.5">YOUTUBE_API_KEY</code> in .env.local.
      </p>
      <div className="mt-3 flex gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/playlist?list=…"
          className="min-w-0 flex-1 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
        />
        <button
          onClick={sync}
          disabled={busy}
          className="shrink-0 rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {busy ? "Syncing…" : "Sync now"}
        </button>
      </div>
      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}

export default function PodcastEditor() {
  const { content, setContent, state, save } = useAdminContent();
  if (!content) return <StatusNote state={state} />;
  const p = content.podcast;
  const set = (patch: Partial<typeof p>) => setContent({ ...content, podcast: { ...p, ...patch } });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">SDR Podcast page</h1>
          <p className="mt-1 text-sm text-slate-400">Live links and past episodes.</p>
        </div>
        <SaveBar state={state} onSave={() => save(content)} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Page title" value={p.title} onChange={(v) => set({ title: v })} />
        <Field label="YouTube channel URL" value={p.channelUrl} onChange={(v) => set({ channelUrl: v })} />
      </div>
      <div className="mt-4">
        <Field label="Page description" value={p.description} onChange={(v) => set({ description: v })} />
      </div>

      <PlaylistSync />

      {/* We're live switch */}
      <div className="mt-8 rounded-xl border border-red-800/50 bg-ink-900 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-300">On-air switch</h2>
        <p className="mt-1 text-xs text-slate-400">
          Flip this when you go live — the podcast page hero becomes the live player. Flip back to
          &quot;Off air&quot; afterwards to return to the latest episode + countdown.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-[220px,1fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Status</span>
            <select
              value={p.live.mode ?? "off"}
              onChange={(e) => set({ live: { ...p.live, mode: e.target.value as "off" | "youtube" | "zoom" } })}
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
            >
              <option value="off">Off air</option>
              <option value="youtube">Live on YouTube</option>
              <option value="zoom">Live on Zoom</option>
            </select>
          </label>
          <Field
            label="Live stream URL (YouTube watch link or Zoom join link)"
            value={p.live.liveUrl ?? ""}
            onChange={(v) => set({ live: { ...p.live, liveUrl: v } })}
            placeholder="https://www.youtube.com/watch?v=…  or  https://zoom.us/j/…"
          />
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">Live defaults</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <Field label="Live podcast stream URL (fallback)" value={p.live.podcastUrl} onChange={(v) => set({ live: { ...p.live, podcastUrl: v } })} />
        <Field label="Premium Zoom URL" value={p.live.zoomUrl} onChange={(v) => set({ live: { ...p.live, zoomUrl: v } })} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Premium session label" value={p.live.zoomLabel} onChange={(v) => set({ live: { ...p.live, zoomLabel: v } })} />
        <Field
          label="Schedule label"
          value={p.live.scheduleLabel ?? "Every Wednesday · 10:00 AM PST"}
          onChange={(v) => set({ live: { ...p.live, scheduleLabel: v } })}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Past episodes</h2>
        <button
          onClick={() => set({ episodes: [...p.episodes, { id: "", title: "" }] })}
          className="rounded-md border border-gold-500/60 px-3 py-1.5 text-sm font-semibold text-gold-400 hover:bg-gold-500 hover:text-ink-950"
        >
          + Add episode
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {p.episodes.map((ep, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
              <Field label="Episode title" value={ep.title} onChange={(v) => set({ episodes: p.episodes.map((e, x) => (x === i ? { ...e, title: v } : e)) })} />
              <Field
                label="YouTube URL or video ID"
                value={ep.id}
                onChange={(v) => set({ episodes: p.episodes.map((e, x) => (x === i ? { ...e, id: youTubeId(v) ?? v } : e)) })}
                placeholder="paste any YouTube link"
              />
            </div>
            <RowControls
              first={i === 0}
              last={i === p.episodes.length - 1}
              onUp={() => set({ episodes: move(p.episodes, i, -1) })}
              onDown={() => set({ episodes: move(p.episodes, i, 1) })}
              onRemove={() => set({ episodes: p.episodes.filter((_, x) => x !== i) })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
