import { readContent } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const { resources } = await readContent();
  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-2xl font-bold text-white">Resources</h1>
      <p className="mt-1 text-sm text-slate-400">
        Scripts, checklists, and documents to run alongside your training.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {resources.map((r, i) => (
          <a
            key={i}
            href={r.href}
            target={r.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group rounded-xl border border-ink-700 bg-ink-900 p-6 transition hover:border-gold-500/50"
          >
            <div className="flex items-start gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 shrink-0 text-gold-500">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6" />
              </svg>
              <div>
                <h3 className="font-semibold text-white group-hover:text-gold-400">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{r.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-600">
        Add or edit resources in <code className="rounded bg-ink-800 px-1.5 py-0.5">config/portal.ts</code>.
      </p>
    </div>
  );
}
