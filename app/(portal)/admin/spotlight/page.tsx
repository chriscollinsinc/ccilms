"use client";

import { useEffect, useMemo, useState } from "react";

interface Feat {
  courseId: string;
  tagline?: string;
  previewVideo?: string;
  previewDuration?: number;
  image?: string;
}
interface CatalogCourse {
  id: string;
  name: string;
  image: string;
}

export default function SpotlightEditor() {
  const [featured, setFeatured] = useState<Feat[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "denied" | "saving" | "saved" | "error">("loading");
  // Per-row upload progress: courseId -> "uploading" | error message.
  const [uploadState, setUploadState] = useState<Record<string, "uploading" | string>>({});

  useEffect(() => {
    fetch("/api/admin/home")
      .then(async (r) => {
        if (r.status === 403) return setState("denied");
        const data = await r.json();
        setFeatured(data.featured ?? []);
        setCatalog(data.catalog ?? []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const available = useMemo(
    () =>
      catalog.filter(
        (c) => !featured.some((f) => f.courseId === c.id) && c.name.toLowerCase().includes(q.toLowerCase())
      ),
    [catalog, featured, q]
  );

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= featured.length) return;
    const next = [...featured];
    [next[i], next[j]] = [next[j], next[i]];
    setFeatured(next);
  }
  function patch(i: number, p: Partial<Feat>) {
    setFeatured(featured.map((f, x) => (x === i ? { ...f, ...p } : f)));
  }

  async function uploadVideo(i: number, courseId: string, file: File) {
    if (file.size > 300 * 1024 * 1024) {
      setUploadState((s) => ({ ...s, [courseId]: "File is larger than 300MB." }));
      return;
    }
    setUploadState((s) => ({ ...s, [courseId]: "uploading" }));
    const form = new FormData();
    form.append("file", file);
    form.append("courseId", courseId);
    try {
      const r = await fetch("/api/admin/spotlight/upload", { method: "POST", body: form });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setUploadState((s) => ({ ...s, [courseId]: data.error ?? "Upload failed." }));
        return;
      }
      patch(i, { previewVideo: data.url });
      setUploadState((s) => {
        const next = { ...s };
        delete next[courseId];
        return next;
      });
    } catch {
      setUploadState((s) => ({ ...s, [courseId]: "Upload failed — check your connection and try again." }));
    }
  }

  async function save() {
    setState("saving");
    const r = await fetch("/api/admin/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    setState(r.ok ? "saved" : "error");
    if (r.ok) setTimeout(() => setState("ready"), 2000);
  }

  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading…</div>;
  if (state === "denied")
    return <div className="p-10 text-sm text-slate-400">This page is for portal admins only.</div>;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Spotlight Editor</h1>
          <p className="mt-1 text-sm text-slate-400">
            Curate the Home page. The first course is the hero banner.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {state === "saved" && <span className="text-sm text-emerald-400">Saved ✓</span>}
          {state === "error" && <span className="text-sm text-red-400">Save failed</span>}
          <a href="/home" className="rounded-md border border-ink-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white">
            View Home
          </a>
          <button
            onClick={save}
            disabled={state === "saving"}
            className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {state === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,320px]">
        {/* Featured list */}
        <div className="space-y-3">
          {featured.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink-700 p-8 text-center text-sm text-slate-500">
              Nothing featured yet — add courses from the right.
            </p>
          )}
          {featured.map((f, i) => {
            const c = byId.get(f.courseId);
            return (
              <div key={f.courseId} className="rounded-xl border border-ink-700 bg-ink-900 p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md bg-ink-700">
                    {(f.image || c?.image) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={f.image || c?.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-white">{c?.name ?? `Course ${f.courseId}`}</p>
                      {i === 0 && (
                        <span className="shrink-0 rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-semibold text-gold-400">
                          HERO
                        </span>
                      )}
                    </div>
                    <input
                      value={f.tagline ?? ""}
                      onChange={(e) => patch(i, { tagline: e.target.value })}
                      placeholder="Tagline — one-line hook shown on the card and hero"
                      className="mt-2 w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
                    />
                    <div className="mt-2 flex gap-2">
                      <input
                        value={f.previewVideo ?? ""}
                        onChange={(e) => patch(i, { previewVideo: e.target.value })}
                        placeholder="Preview video — MP4 or YouTube link (t= start time honored)"
                        className="min-w-0 flex-1 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
                      />
                      <div className="flex shrink-0 items-center gap-1.5">
                        <input
                          type="number"
                          min={5}
                          max={600}
                          value={f.previewDuration ?? ""}
                          onChange={(e) =>
                            patch(i, {
                              previewDuration: e.target.value === "" ? undefined : Number(e.target.value),
                            })
                          }
                          placeholder="auto"
                          title="Preview length in seconds — blank plays to the end (max 120s)"
                          className="w-20 rounded-md border border-ink-700 bg-ink-800 px-2 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
                        />
                        <span className="text-xs text-slate-500">sec</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-gold-500 hover:text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                          <path d="M12 16V4M12 4l4 4M12 4 8 8" />
                          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                        </svg>
                        Upload video file
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) uploadVideo(i, f.courseId, file);
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-slate-500">MP4/WebM/MOV, up to 300MB — or paste a link above</span>
                      {uploadState[f.courseId] === "uploading" && (
                        <span className="text-xs text-gold-400">Uploading…</span>
                      )}
                      {uploadState[f.courseId] && uploadState[f.courseId] !== "uploading" && (
                        <span className="text-xs text-red-400">{uploadState[f.courseId]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30">
                      ↑
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === featured.length - 1} aria-label="Move down" className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30">
                      ↓
                    </button>
                    <button
                      onClick={() => setFeatured(featured.filter((_, x) => x !== i))}
                      aria-label="Remove"
                      className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:border-red-800 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Course picker */}
        <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
          <p className="text-sm font-semibold text-white">Add courses</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search catalog…"
            className="mt-3 w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
          />
          <div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto pr-1">
            {available.map((c) => (
              <button
                key={c.id}
                onClick={() => setFeatured([...featured, { courseId: c.id, tagline: "", previewVideo: "" }])}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-ink-800"
              >
                <div className="h-8 w-14 shrink-0 overflow-hidden rounded bg-ink-700">
                  {c.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{c.name}</span>
                <span className="shrink-0 text-gold-400">+</span>
              </button>
            ))}
            {available.length === 0 && <p className="px-2 py-4 text-sm text-slate-600">No matches.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
