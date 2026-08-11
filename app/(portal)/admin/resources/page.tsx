"use client";

import { useAdminContent, SaveBar, Field, RowControls, StatusNote, move } from "@/components/admin";

export default function ResourcesEditor() {
  const { content, setContent, state, save } = useAdminContent();
  if (!content) return <StatusNote state={state} />;
  const rows = content.resources;
  const set = (resources: typeof rows) => setContent({ ...content, resources });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resources page</h1>
          <p className="mt-1 text-sm text-slate-400">Docs, scripts, and checklists members can open.</p>
        </div>
        <SaveBar state={state} onSave={() => save(content)} />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => set([...rows, { title: "", description: "", href: "" }])}
          className="rounded-md border border-gold-500/60 px-3 py-1.5 text-sm font-semibold text-gold-400 hover:bg-gold-500 hover:text-ink-950"
        >
          + Add resource
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="grid min-w-0 flex-1 gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title" value={r.title} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, title: v } : x)))} />
                <Field label="Link (PDF, Drive, page URL)" value={r.href} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, href: v } : x)))} />
              </div>
              <Field label="Description" value={r.description} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, description: v } : x)))} />
            </div>
            <RowControls
              first={i === 0}
              last={i === rows.length - 1}
              onUp={() => set(move(rows, i, -1))}
              onDown={() => set(move(rows, i, 1))}
              onRemove={() => set(rows.filter((_, y) => y !== i))}
            />
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-xl border border-dashed border-ink-700 p-8 text-center text-sm text-slate-500">No resources yet.</p>}
      </div>
    </div>
  );
}
