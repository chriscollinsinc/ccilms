"use client";

/** Shared plumbing for admin console editor pages. */
import { useEffect, useState } from "react";
import type { PortalContent } from "@/lib/contentStore";

export type AdminState = "loading" | "ready" | "denied" | "error" | "saving" | "saved";

export function useAdminContent() {
  const [content, setContent] = useState<PortalContent | null>(null);
  const [state, setState] = useState<AdminState>("loading");

  useEffect(() => {
    fetch("/api/admin/content")
      .then(async (r) => {
        if (r.status === 403) return setState("denied");
        setContent(await r.json());
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  async function save(next: PortalContent) {
    setContent(next);
    setState("saving");
    const r = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setState(r.ok ? "saved" : "error");
    if (r.ok) setTimeout(() => setState("ready"), 1800);
  }

  return { content, setContent, state, save };
}

export function SaveBar({ state, onSave }: { state: AdminState; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {state === "saved" && <span className="text-sm text-emerald-400">Saved ✓</span>}
      {state === "error" && <span className="text-sm text-red-400">Save failed</span>}
      <button
        onClick={onSave}
        disabled={state === "saving"}
        className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
      >
        {state === "saving" ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
      />
    </label>
  );
}

export function RowControls({
  onUp,
  onDown,
  onRemove,
  first,
  last,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  first: boolean;
  last: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button onClick={onUp} disabled={first} aria-label="Move up" className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30">
        ↑
      </button>
      <button onClick={onDown} disabled={last} aria-label="Move down" className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:text-white disabled:opacity-30">
        ↓
      </button>
      <button onClick={onRemove} aria-label="Remove" className="rounded border border-ink-700 px-2 py-0.5 text-slate-400 hover:border-red-800 hover:text-red-400">
        ✕
      </button>
    </div>
  );
}

export function StatusNote({ state }: { state: AdminState }) {
  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading…</div>;
  if (state === "denied") return <div className="p-10 text-sm text-slate-400">This page is for portal admins only.</div>;
  if (state === "error") return <div className="p-10 text-sm text-red-400">Couldn&apos;t load. Refresh to retry.</div>;
  return null;
}

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
