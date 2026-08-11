import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/talentlms";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { completed?: string; error?: string; mock_launched?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserById(session.userId);
  const courses = user.courses ?? [];
  const certs = user.certifications ?? [];

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {searchParams.completed && (
        <div className="mb-6 rounded-md border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
          Nice work — course completed! Your progress and certificate are updated below.
        </div>
      )}
      {searchParams.mock_launched && (
        <div className="mb-6 rounded-md border border-sky-800 bg-sky-950/50 px-4 py-3 text-sm text-sky-300">
          Mock mode: course {searchParams.mock_launched} would have launched in TalentLMS here.
        </div>
      )}
      {searchParams.error === "launch" && (
        <div className="mb-6 rounded-md border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          Couldn&apos;t launch that course. Try again in a moment.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user.first_name}.</h1>
          <p className="mt-1 text-sm text-slate-400">Pick up where you left off.</p>
        </div>
        <a
          href="/leaderboard"
          className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 transition hover:border-gold-500/50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 text-base">🏆</span>
          <span>
            <span className="block text-sm font-bold text-gold-400">
              {Number(user.points ?? 0).toLocaleString()} pts
            </span>
            <span className="block text-xs text-slate-500">Level {user.level ?? 1}</span>
          </span>
        </a>
      </div>

      {(user.badges ?? []).length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {(user.badges ?? []).slice(0, 12).map((b, i) => (
            <span
              key={i}
              title={b.criteria ?? b.name ?? ""}
              className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-slate-300"
            >
              {b.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={b.image_url} alt="" className="h-5 w-5" />
              ) : (
                <span className="text-gold-400">★</span>
              )}
              {b.name ?? b.type ?? "Badge"}
            </span>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Your Training
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const pct = Number(c.completion_percentage ?? 0);
            const done = c.completion_status === "Completed";
            return (
              <div key={c.id} className="rounded-xl border border-ink-700 bg-ink-900 p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  {done && (
                    <span className="shrink-0 rounded-full bg-emerald-900/60 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      Completed
                    </span>
                  )}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-700">
                  <div
                    className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-gold-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{pct}% complete</span>
                  <a
                    href={`/launch?course=${c.id}`}
                    className="rounded-md bg-gold-500 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
                  >
                    {done ? "Review" : pct > 0 ? "Continue" : "Start"}
                  </a>
                </div>
              </div>
            );
          })}
          {courses.length === 0 && (
            <p className="text-sm text-slate-500">
              No courses yet — browse the <a href="/library" className="text-gold-400">Course Library</a>.
            </p>
          )}
        </div>
      </section>

      {certs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Certificates
          </h2>
          <ul className="divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
            {certs.map((cert) => (
              <li key={cert.unique_id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{cert.course_name}</p>
                  <p className="text-xs text-slate-500">Issued {cert.issued_date}</p>
                </div>
                <a href={cert.download_url} className="text-sm font-medium text-gold-400 hover:text-gold-500">
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
