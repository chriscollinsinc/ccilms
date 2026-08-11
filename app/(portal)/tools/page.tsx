import { readContent } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const { tools } = await readContent();
  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-2xl font-bold text-white">Tools</h1>
      <p className="mt-1 text-sm text-slate-400">
        Calculators and apps built for the service drive.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tools.map((t, i) =>
          t.ready ? (
            <a
              key={i}
              href={t.href}
              className="group rounded-xl border border-ink-700 bg-ink-900 p-6 transition hover:border-gold-500/50"
            >
              <h3 className="font-semibold text-white group-hover:text-gold-400">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{t.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-gold-400">Open →</span>
            </a>
          ) : (
            <div key={i} className="rounded-xl border border-ink-800 bg-ink-900/50 p-6 opacity-70">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-300">{t.title}</h3>
                <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-slate-400">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t.description}</p>
            </div>
          )
        )}
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Each tool is its own page under <code className="rounded bg-ink-800 px-1.5 py-0.5">app/(portal)/tools/</code> —
        we can build these one at a time.
      </p>
    </div>
  );
}
