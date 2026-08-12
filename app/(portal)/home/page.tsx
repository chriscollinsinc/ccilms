import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById, getCatalog } from "@/lib/talentlms";
import { readHome } from "@/lib/homeStore";
import { readBoard, summarizeThreads } from "@/lib/boardStore";
import { getStandings } from "@/lib/leaderboard";
import CourseCarousel, { type CarouselItem } from "@/components/CourseCarousel";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

function stripHtml(html?: string): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, catalog, home, board, standings] = await Promise.all([
    getUserById(session.userId),
    getCatalog(),
    readHome(),
    readBoard().catch(() => null),
    getStandings().catch(() => []),
  ]);
  const mine = new Map((user.courses ?? []).map((c) => [c.id, Number(c.completion_percentage ?? 0)]));

  const toItem = (id: string): CarouselItem | null => {
    const c = catalog.find((x) => x.id === id);
    if (!c) return null;
    const feat = home.featured.find((f) => f.courseId === id);
    return {
      id: c.id,
      name: c.name,
      description: feat?.tagline || stripHtml(c.description).slice(0, 140),
      image: feat?.image || c.big_avatar || c.avatar,
      previewVideo: feat?.previewVideo || undefined,
      previewDuration: feat?.previewDuration,
      enrolled: mine.has(c.id),
      pct: mine.get(c.id) ?? 0,
    };
  };

  // Featured: config list, else first 6 catalog courses.
  const featuredIds = home.featured.length > 0 ? home.featured.map((f) => f.courseId) : catalog.slice(0, 6).map((c) => c.id);
  const featured = featuredIds.map(toItem).filter(Boolean) as CarouselItem[];

  // Continue training — closest to done first, so the course someone's most
  // likely to actually finish today leads instead of just enrollment order.
  const inProgress = (user.courses ?? [])
    .filter((c) => c.completion_status !== "Completed" && Number(c.completion_percentage ?? 0) > 0)
    .sort((a, b) => Number(b.completion_percentage ?? 0) - Number(a.completion_percentage ?? 0))
    .map((c) => toItem(c.id))
    .filter(Boolean) as CarouselItem[];

  const fresh = catalog
    .filter((c) => !mine.has(c.id))
    .slice(0, 12)
    .map((c) => toItem(c.id))
    .filter(Boolean) as CarouselItem[];

  // "Today" strip inputs
  const rankIndex = standings.findIndex((s) => s.id === user.id);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;
  const aheadOfPct = rank && standings.length > 1 ? Math.round((1 - rankIndex / (standings.length - 1)) * 100) : null;
  const latestBadge = (user.badges ?? [])
    .slice()
    .sort((a, b) => (b.issued_on ?? "").localeCompare(a.issued_on ?? ""))[0];
  const pulseThreads = board ? summarizeThreads(board).slice(0, 3) : [];

  return (
    <div className="pb-8">
      <HeroCarousel items={featured} />

      <div className="px-8">
        {/* Today — live session, standing, latest achievement. The reason to open
            the app today, not just a discovery feed. */}
        {(home.liveSession.enabled || rank || latestBadge) && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {home.liveSession.enabled && (
              <a
                href={home.liveSession.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gold-500/40 bg-gradient-to-br from-gold-500/10 to-ink-900 p-5 transition hover:border-gold-500/70"
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-500">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold-500" />
                  Next live session
                </div>
                <h3 className="font-display text-sm uppercase text-white">{home.liveSession.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{home.liveSession.whenLabel}</p>
              </a>
            )}

            {rank && (
              <Link
                href="/leaderboard"
                className="rounded-lg border border-ink-700 bg-ink-900 p-5 transition hover:border-gold-500/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-2xl font-bold text-white">{Number(user.points ?? 0).toLocaleString()}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">points</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-accent-500">#{rank}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">on leaderboard</p>
                  </div>
                </div>
                {aheadOfPct !== null && aheadOfPct > 0 && (
                  <p className="mt-3 text-xs text-slate-500">Ahead of {aheadOfPct}% of members · Level {user.level ?? 1}</p>
                )}
              </Link>
            )}

            {latestBadge && (
              <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 p-5">
                {latestBadge.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={latestBadge.image_url} alt="" className="h-9 w-9 shrink-0" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-500/40 bg-accent-500/10 text-accent-500">
                    ★
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{latestBadge.name ?? "Badge earned"}</p>
                  <p className="text-xs text-slate-500">{latestBadge.criteria ?? "Latest achievement"}</p>
                </div>
              </div>
            )}
          </section>
        )}

        <CourseCarousel title="Continue training" items={inProgress} />

        {/* Community pulse — surfaces the board here instead of it living
            invisibly behind its own nav item. */}
        {pulseThreads.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between pr-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">From the Community</h2>
              <Link href="/community" className="text-xs font-medium text-gold-500 hover:text-gold-400">
                View board
              </Link>
            </div>
            <div className="divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
              {pulseThreads.map((t) => (
                <Link
                  key={t.id}
                  href={`/community/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-ink-800/60"
                >
                  {t.pinned && <span className="shrink-0 text-gold-500">📌</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.channelName} · {t.authorName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-gold-500">{t.replyCount} replies</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <CourseCarousel title="Featured" items={featured} />
        <CourseCarousel title="New for you" items={fresh} />
      </div>
    </div>
  );
}
