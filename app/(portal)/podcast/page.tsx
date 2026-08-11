import { readContent } from "@/lib/contentStore";
import { readEpisodes } from "@/lib/episodesStore";
import CoverFlow, { type FlowEpisode } from "@/components/CoverFlow";
import PodcastHero from "@/components/PodcastHero";

export const dynamic = "force-dynamic";

export default async function PodcastPage() {
  const [{ podcast }, synced] = await Promise.all([readContent(), readEpisodes()]);

  // Synced playlist episodes preferred; manual admin list as fallback.
  const episodes: FlowEpisode[] =
    synced.episodes.length > 0
      ? synced.episodes
      : podcast.episodes.map((e) => ({ id: e.id, title: e.title, thumb: `https://i.ytimg.com/vi/${e.id}/mqdefault.jpg` }));
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <h1 className="text-2xl font-bold text-white">{podcast.title}</h1>
      <p className="mt-1 text-sm text-slate-400">{podcast.description}</p>

      {/* Broadcast hero: live stream when live, latest episode + countdown otherwise */}
      <section className="mt-8">
        <PodcastHero live={podcast.live} latest={episodes[0] ?? null} />
      </section>

      {/* Premium session */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold-500 bg-gradient-to-br from-ink-900 to-ink-800 p-5">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-gold-500/20 px-3 py-1 text-xs font-semibold text-gold-400">
            PREMIUM
          </span>
          <h3 className="mt-2 font-semibold text-white">{podcast.live.zoomLabel}</h3>
          <p className="mt-0.5 text-sm text-slate-400">Members-only live session with Chris — bring your questions.</p>
        </div>
        <a
          href={podcast.live.zoomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          Join on Zoom ↗
        </a>
      </section>

      {/* Past episodes */}
      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Past Episodes
          </h2>
          <a
            href={podcast.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold-400 hover:text-gold-500"
          >
            View all on YouTube ↗
          </a>
        </div>
        <CoverFlow episodes={episodes} />
      </section>
    </div>
  );
}
