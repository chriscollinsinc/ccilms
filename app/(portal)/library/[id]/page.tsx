import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById, getCourse, getCategories } from "@/lib/talentlms";
import { courseLevel, stripHtml } from "@/lib/courseMeta";
import { readHome } from "@/lib/homeStore";
import { ytEmbedFromUrl, isDirectVideo } from "@/lib/video";

export const dynamic = "force-dynamic";

const unitIcon = (type?: string): string => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("video")) return "M8 5v14l11-7z";
  if (t.includes("test") || t.includes("quiz") || t.includes("survey"))
    return "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11";
  if (t.includes("ilt") || t.includes("conference")) return "M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z";
  return "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6";
};

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, course, categories, home] = await Promise.all([
    getUserById(session.userId),
    getCourse(params.id).catch(() => null),
    getCategories(),
    readHome(),
  ]);
  if (!course) notFound();

  const enrolledCourse = (user.courses ?? []).find((c) => c.id === course.id);
  const pct = Number(enrolledCourse?.completion_percentage ?? 0);
  const enrolled = !!enrolledCourse;
  const level = courseLevel(course.code);
  const category = categories.find((c) => c.id === course.category_id)?.name;
  const preview = home.featured.find((f) => f.courseId === course.id)?.previewVideo;
  const previewEmbed = preview ? (isDirectVideo(preview) ? preview : ytEmbedFromUrl(preview)) : null;
  const description = stripHtml(course.description);
  const units = course.units ?? [];

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden border-b border-ink-800">
        <div className="absolute inset-0">
          {(course.big_avatar || course.avatar) && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={course.big_avatar || course.avatar} alt="" className="h-full w-full object-cover opacity-25 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/40" />
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center gap-8 px-8 py-10">
          <div className="w-64 shrink-0 overflow-hidden rounded-xl border border-ink-700 shadow-2xl">
            <div className="aspect-video bg-ink-800">
              {(course.big_avatar || course.avatar) && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={course.big_avatar || course.avatar} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Link href="/library" className="text-xs text-slate-400 hover:text-white">
              ← Course Library
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {category && <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-slate-300">{category}</span>}
              {level !== null && <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-slate-300">Level {level}</span>}
              {units.length > 0 && <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-slate-300">{units.length} lessons</span>}
              {enrolled && pct >= 100 && (
                <span className="rounded-full bg-emerald-900/60 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Completed ✓</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white">{course.name}</h1>
            {enrolled && pct > 0 && pct < 100 && (
              <div className="mt-4 max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{pct}% complete</p>
              </div>
            )}
            <div className="mt-6 flex items-center gap-3">
              {enrolled ? (
                <a
                  href={`/course/${course.id}`}
                  className="rounded-md bg-gold-500 px-8 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
                >
                  {pct >= 100 ? "Review course" : pct > 0 ? "Continue course" : "Start course"}
                </a>
              ) : (
                <form action={`/api/course/${course.id}/enroll?next=/library/${course.id}`} method="POST">
                  <button className="rounded-md bg-gold-500 px-8 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400">
                    Add to my training
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-8 py-10 lg:grid-cols-[1fr,360px]">
        {/* Curriculum */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">What&apos;s inside</h2>
          {units.length > 0 ? (
            <ol className="mt-4 divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
              {units.map((u, i) => (
                <li key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-6 shrink-0 text-right text-xs text-slate-600">{i + 1}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-gold-500/80">
                    <path d={unitIcon(u.type)} />
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{u.name}</span>
                  {u.type && <span className="shrink-0 text-xs text-slate-600">{u.type}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Curriculum details coming soon.</p>
          )}
        </div>

        {/* About + preview */}
        <div>
          {previewEmbed && (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Preview</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-ink-700">
                {isDirectVideo(preview!) ? (
                  <video src={preview!} controls muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <iframe src={previewEmbed} title="Course preview" allow="autoplay; encrypted-media" className="h-full w-full border-0" />
                )}
              </div>
            </>
          )}
          {description && (
            <>
              <h2 className={`text-sm font-semibold uppercase tracking-wider text-slate-500 ${previewEmbed ? "mt-8" : ""}`}>
                About this course
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{description}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
