"use client";

import { useAdminContent, SaveBar, Field, RowControls, StatusNote, move } from "@/components/admin";

export default function ToolsEditor() {
  const { content, setContent, state, save } = useAdminContent();
  if (!content) return <StatusNote state={state} />;
  const rows = content.tools;
  const set = (tools: typeof rows) => setContent({ ...content, tools });

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tools page</h1>
          <p className="mt-1 text-sm text-slate-400">
            Custom apps. Mark a tool &quot;live&quot; once its page exists under /tools/.
          </p>
        </div>
        <SaveBar state={state} onSave={() => save(content)} />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => set([...rows, { title: "", description: "", href: "/tools/", ready: false }])}
          className="rounded-md border border-gold-500/60 px-3 py-1.5 text-sm font-semibold text-gold-400 hover:bg-gold-500 hover:text-ink-950"
        >
          + Add tool
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((t, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="grid min-w-0 flex-1 gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title" value={t.title} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, title: v } : x)))} />
                <Field label="Route" value={t.href} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, href: v } : x)))} placeholder="/tools/labor-rate-calculator" />
              </div>
              <Field label="Description" value={t.description} onChange={(v) => set(rows.map((x, y) => (y === i ? { ...x, description: v } : x)))} />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={t.ready}
                  onChange={(e) => set(rows.map((x, y) => (y === i ? { ...x, ready: e.target.checked } : x)))}
                  className="h-4 w-4 accent-[#d9a233]"
                />
                Live (unchecked shows &quot;Coming soon&quot;)
              </label>
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
      </div>
    </div>
  );
}
