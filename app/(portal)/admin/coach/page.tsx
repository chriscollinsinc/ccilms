"use client";

import { useAdminContent, SaveBar, Field, StatusNote } from "@/components/admin";

export default function CoachEditor() {
  const { content, setContent, state, save } = useAdminContent();
  if (!content) return <StatusNote state={state} />;
  const c = content.coach;
  const set = (patch: Partial<typeof c>) => setContent({ ...content, coach: { ...c, ...patch } });

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Ask Chris (AI)</h1>
          <p className="mt-1 text-sm text-slate-400">The Delphi chat embed.</p>
        </div>
        <SaveBar state={state} onSave={() => save(content)} />
      </div>

      <div className="mt-6 space-y-4">
        <Field label="Page title" value={c.title} onChange={(v) => set({ title: v })} />
        <Field label="Page description" value={c.description} onChange={(v) => set({ description: v })} />
        <Field
          label="Delphi embed URL"
          value={c.embedUrl}
          onChange={(v) => set({ embedUrl: v })}
          placeholder="https://www.delphi.ai/embed/… (add ?theme=dark to match the portal)"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={c.passUserEmail}
            onChange={(e) => set({ passUserEmail: e.target.checked })}
            className="h-4 w-4 accent-[#d9a233]"
          />
          Append the member&apos;s email to the embed URL
        </label>
        <p className="text-xs text-slate-500">
          Remember: your Delphi embed&apos;s Allowed Origins list must include this portal&apos;s domain
          (currently localhost:3001; add the production domain at launch).
        </p>
      </div>
    </div>
  );
}
