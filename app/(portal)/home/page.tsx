import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById, getCatalog } from "@/lib/talentlms";
import { readHome } from "@/lib/homeStore";
import { readBoard, summarizeThreads } from "@/lib/boardStore";
import { getStandings } from "@/lib/leaderboard";
import CourseCarousel, { type CarouselItem } from "@/components/CourseCarousel";
import HeroCarousel from "@/components/HeroCarousel";
import { realImage } from "@/lib/courseMeta";

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
      image: feat?.image || realImage(c.big_avatar) || realImage(c.avatar),
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
    // TalentLMS sometimes reports 100% with a status other than "Completed",
    // so filter on both — finished courses belong in Review, not here.
    .filter(
      (c) =>
        c.completion_status !== "Completed" &&
        Number(c.completion_percentage ?? 0) > 0 &&
        Number(c.completion_percentage ?? 0) < 100
    )
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
    <div className="pb-10">
      <HeroCarousel items={featured} />

      <div className="px-12 pt-7">
        {/* Today — live session, standing, latest achievement. The reason to open
            the app today, not just a discovery feed. */}
        {(home.liveSession.enabled || rank || latestBadge) && (
          <section className="mb-9 grid gap-3.5 md:grid-cols-[1.3fr_1fr_1fr]">
            {home.liveSession.enabled && (
              <a
                href={home.liveSession.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gold-500/40 bg-gradient-to-br from-gold-500/10 to-ink-900 p-4 transition hover:border-gold-500/70"
              >
                <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gold-500">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold-500" />
                  Next live session
                </div>
                <h3 className="font-display text-sm font-semibold uppercase text-white">{home.liveSession.title}</h3>
                <p className="mb-3 mt-1 text-xs text-stone-500">{home.liveSession.whenLabel}</p>
                <span className="block w-full rounded-[3px] bg-accent-500 py-[9px] text-center font-display text-[11px] font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-accent-400">
                  Join reminder
                </span>
              </a>
            )}

            {rank && (
              <Link
                href="/leaderboard"
                className="border border-ink-700 bg-ink-900 p-4 transition hover:border-gold-500/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-[22px] font-bold text-white">{Number(user.points ?? 0).toLocaleString()}</p>
                    <p className="text-[10.5px] text-stone-500">points</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[22px] font-bold text-accent-500">#{rank}</p>
                    <p className="text-[10.5px] text-stone-500">on leaderboard</p>
                  </div>
                </div>
                {aheadOfPct !== null && aheadOfPct > 0 && (
                  <p className="mt-3.5 text-xs text-stone-500">Level {user.level ?? 1} · ahead of {aheadOfPct}% of members</p>
                )}
              </Link>
            )}

            {latestBadge && (
              <div className="flex items-center gap-2.5 border border-ink-700 bg-ink-900 p-4">
                {latestBadge.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={latestBadge.image_url} alt="" className="h-[34px] w-[34px] shrink-0" />
                ) : (
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-accent-500/40 bg-accent-500/10 text-accent-500">
                    ★
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{latestBadge.name ?? "Badge earned"}</p>
                  <p className="mt-0.5 text-[10.5px] text-stone-500">{latestBadge.criteria ?? "Latest achievement"}</p>
                </div>
              </div>
            )}
          </section>
        )}

        <CourseCarousel title="Continue Training" items={inProgress} viewAllHref="/dashboard" />

        {/* Community pulse — surfaces the board here instead of it living
            invisibly behind its own nav item. */}
        {pulseThreads.length > 0 && (
          <section className="mb-9">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-white">From the Community</h2>
              <Link href="/community" className="font-display text-[11px] font-medium uppercase tracking-wide text-gold-500 hover:text-gold-400">
                View board
              </Link>
            </div>
            <div className="border border-ink-700 bg-ink-900">
              {pulseThreads.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/community/${t.id}`}
                  className={`flex items-center gap-3 px-4 py-3 transition hover:bg-ink-800/60 ${i > 0 ? "border-t border-ink-700" : ""}`}
                >
                  {t.pinned && <span className="shrink-0 text-[13px] text-accent-500">📌</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-white">{t.title}</p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {t.channelName} · {t.authorName}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-gold-500">{t.replyCount} replies</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <CourseCarousel title="Featured" items={featured} viewAllHref="/library" />
        <CourseCarousel title="New for you" items={fresh} viewAllHref="/library" />
      </div>
    </div>
  );
}
