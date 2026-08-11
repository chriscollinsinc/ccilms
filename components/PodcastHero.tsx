"use client";

/**
 * SDR broadcast hero.
 *  - Admin flips "We're live" (YouTube/Zoom) -> live player / join panel.
 *  - Otherwise: latest episode auto-loaded + "Next podcast" countdown.
 *  - During the Wednesday 10:00-11:30 AM PST window (mode off), shows a
 *    "we should be live" join prompt as a backstop.
 */
import { useEffect, useState } from "react";
import { youTubeId } from "@/lib/video";
import type { FlowEpisode } from "@/components/CoverFlow";

interface LiveConfig {
  podcastUrl: string;
  zoomUrl: string;
  zoomLabel: string;
  mode?: "off" | "youtube" | "zoom";
  liveUrl?: string;
  scheduleLabel?: string;
}

/** ms until next Wednesday 10:00 AM in Los Angeles (approximate across DST). */
function msToNextShow(): { ms: number; inWindow: boolean } {
  const nowLA = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const target = new Date(nowLA);
  const day = nowLA.getDay(); // Wed = 3
  let add = (3 - day + 7) % 7;
  target.setDate(nowLA.getDate() + add);
  target.setHours(10, 0, 0, 0);
  if (target.getTime() <= nowLA.getTime()) {
    // Today is Wednesday after 10am — are we inside the 90-minute window?
    const windowEnd = new Date(target);
    windowEnd.setMinutes(windowEnd.getMinutes() + 90);
    if (nowLA <= windowEnd) return { ms: 0, inWindow: true };
    target.setDate(target.getDate() + 7);
  }
  return { ms: target.getTime() - nowLA.getTime(), inWindow: false };
}

function fmtCountdown(ms: number): string {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function PodcastHero({ live, latest }: { live: LiveConfig; latest: FlowEpisode | null }) {
  const [clock, setClock] = useState(() => msToNextShow());
  useEffect(() => {
    const t = setInterval(() => setClock(msToNextShow()), 30000);
    return () => clearInterval(t);
  }, []);

  const mode = live.mode ?? "off";
  const liveYtId = mode === "youtube" ? youTubeId(live.liveUrl || live.podcastUrl) : null;
  const schedule = live.scheduleLabel || "Every Wednesday · 10:00 AM PST";

  // LIVE — YouTube embed
  if (mode === "youtube" && liveYtId) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-800/60">
        <div className="flex items-center justify-between bg-red-950/60 px-5 py-2.5">
          <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> LIVE NOW
          </span>
          <span className="text-xs text-red-200/70">{schedule}</span>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${liveYtId}?autoplay=1&mute=1`}
            title="Live stream"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      </div>
    );
  }

  // LIVE — Zoom join panel
  if (mode === "zoom") {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-800/60 bg-ink-900">
        <div className="flex items-center justify-between bg-red-950/60 px-5 py-2.5">
          <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> LIVE NOW ON ZOOM
          </span>
          <span className="text-xs text-red-200/70">{schedule}</span>
        </div>
        <div className="flex aspect-[21/8] min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">We&apos;re live right now</h2>
          <p className="max-w-md text-sm text-slate-400">The session is happening on Zoom — jump in.</p>
          <a
            href={live.liveUrl || live.zoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-gold-500 px-10 py-3 font-semibold text-ink-950 transition hover:bg-gold-400"
          >
            Join the Zoom ↗
          </a>
        </div>
      </div>
    );
  }

  // OFF-AIR — latest episode + countdown (or in-window join prompt)
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-ink-900 px-5 py-3">
        {clock.inWindow ? (
          <>
            <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> WE SHOULD BE LIVE
            </span>
            <a
              href={live.podcastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-gold-500 px-4 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-400"
            >
              Join the stream ↗
            </a>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-500">
              Next podcast · {schedule}
            </span>
            <span className="rounded-full border border-ink-700 px-3 py-1 text-xs font-semibold text-slate-300">
              Going live in {fmtCountdown(clock.ms)}
            </span>
          </>
        )}
      </div>
      <div className="aspect-video bg-black">
        {latest ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${latest.id}?rel=0`}
            title={latest.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-600">
            Sync the playlist to load the latest episode here.
          </div>
        )}
      </div>
      {latest && (
        <div className="flex items-center justify-between bg-ink-900 px-5 py-3">
          <p className="min-w-0 truncate pr-4 text-sm font-medium text-white">
            <span className="mr-2 rounded bg-ink-700 px-2 py-0.5 text-[11px] font-semibold text-gold-400">LATEST</span>
            {latest.title}
          </p>
        </div>
      )}
    </div>
  );
}
