"use client";

/**
 * Featured hero carousel. Each slide plays its video preview all the way
 * through, then auto-advances. Image-only slides get a slow Ken Burns zoom
 * and an 8s timer. A gold progress bar tracks the active slide.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselItem } from "@/components/CourseCarousel";
import { youTubeId, ytStart, isDirectVideo } from "@/lib/video";

const IMAGE_MS = 8000; // image-only slide duration
const VIDEO_CAP_S = 120; // safety cap so a full-length video can't hold the hero hostage

/* global YT loader (once per page) */
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: object) => YtPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YtPlayer {
  destroy: () => void;
  mute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}
let ytPromise: Promise<void> | null = null;
function loadYtApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

function YtSlide({
  videoId,
  start,
  cap,
  onEnded,
  onProgress,
}: {
  videoId: string;
  start: number;
  cap: number;
  onEnded: () => void;
  onProgress: (p: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let player: YtPlayer | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let dead = false;

    loadYtApi().then(() => {
      if (dead || !holder.current || !window.YT) return;
      const mount = document.createElement("div");
      holder.current.appendChild(mount);
      player = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          disablekb: 1,
          start,
        },
        events: {
          onReady: (e: { target: YtPlayer }) => {
            e.target.mute();
            poll = setInterval(() => {
              try {
                const t = player!.getCurrentTime() - start;
                const dur = Math.min(Math.max(player!.getDuration() - start, 1), cap);
                onProgress(Math.min(t / dur, 1));
                if (t >= dur) onEnded();
              } catch {
                /* player mid-teardown */
              }
            }, 400);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) onEnded(); // ENDED
          },
        },
      });
    });

    return () => {
      dead = true;
      if (poll) clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, start, cap]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={holder}
        className="absolute left-1/2 top-1/2 aspect-video h-[135%] -translate-x-1/2 -translate-y-1/2 [&>iframe]:h-full [&>iframe]:w-full"
        style={{ minWidth: "135%" }}
      />
    </div>
  );
}

export default function HeroCarousel({ items }: { items: CarouselItem[] }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgressState] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const active = items[Math.min(idx, items.length - 1)];

  const setProgress = useCallback((p: number) => {
    progressRef.current = p;
    setProgressState(p);
  }, []);

  const next = useCallback(() => {
    setProgress(0);
    setIdx((i) => (i + 1) % Math.max(items.length, 1));
  }, [items.length, setProgress]);

  const goto = (i: number) => {
    setProgress(0);
    setIdx(i);
  };

  // Timer for slides without a playable video (image / no media)
  const hasVideo = !!active && (isDirectVideo(active.previewVideo) || !!youTubeId(active.previewVideo));
  useEffect(() => {
    if (!active || hasVideo || items.length < 2) return;
    if (paused) return;
    const startTs = Date.now() - progress * IMAGE_MS;
    const t = setInterval(() => {
      const p = (Date.now() - startTs) / IMAGE_MS;
      if (p >= 1) next();
      else setProgress(p);
    }, 50);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, hasVideo, paused, items.length]);

  // Watchdog: if a video slide makes no progress (autoplay blocked, embed
  // unavailable, slow network), move on instead of stalling the carousel.
  useEffect(() => {
    if (!hasVideo || items.length < 2) return;
    const t = setTimeout(() => {
      if (progressRef.current < 0.02) next();
    }, 15000);
    return () => clearTimeout(t);
  }, [idx, hasVideo, items.length, next]);

  if (items.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-2xl border border-ink-700"
    >
      <div className="relative aspect-[21/8] min-h-[280px] w-full bg-ink-800">
        {items.map((item, i) => {
          const isActive = i === idx;
          const yt = youTubeId(item.previewVideo);
          return (
            <div
              key={item.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? "auto" : "none" }}
            >
              {/* Media */}
              {isActive && item.previewVideo && isDirectVideo(item.previewVideo) && (
                <video
                  src={item.previewVideo}
                  autoPlay
                  muted
                  playsInline
                  onEnded={next}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    const cap = item.previewDuration ?? VIDEO_CAP_S;
                    const dur = Math.min(v.duration || 1, cap);
                    setProgress(Math.min(v.currentTime / dur, 1));
                    if (v.currentTime >= cap) next();
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {isActive && !isDirectVideo(item.previewVideo) && yt && (
                <YtSlide
                  videoId={yt}
                  start={ytStart(item.previewVideo)}
                  cap={item.previewDuration ?? VIDEO_CAP_S}
                  onEnded={next}
                  onProgress={setProgress}
                />
              )}
              {(!isActive || (!yt && !isDirectVideo(item.previewVideo))) && item.image && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={
                    isActive
                      ? { animation: `heroKenBurns ${IMAGE_MS + 1200}ms ease-out forwards` }
                      : undefined
                  }
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent" />

              {/* Copy + CTAs */}
              <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-500">
                  Featured training
                </p>
                <h1
                  className="mt-2 text-3xl font-extrabold leading-tight text-white transition-all duration-700"
                  style={{
                    transform: isActive ? "translateY(0)" : "translateY(14px)",
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  {item.name}
                </h1>
                {item.description && (
                  <p
                    className="mt-3 text-sm leading-relaxed text-slate-300 transition-all delay-100 duration-700"
                    style={{
                      transform: isActive ? "translateY(0)" : "translateY(14px)",
                      opacity: isActive ? 1 : 0,
                    }}
                  >
                    {item.description}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-3">
                  {item.enrolled ? (
                    <a
                      href={`/launch?course=${item.id}`}
                      className="rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
                    >
                      {item.pct > 0 && item.pct < 100 ? "Continue" : item.pct >= 100 ? "Review" : "Start now"}
                    </a>
                  ) : (
                    <form action={`/api/course/${item.id}/enroll`} method="POST">
                      <button className="rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400">
                        Add to my training
                      </button>
                    </form>
                  )}
                  <a
                    href="/library"
                    className="rounded-md border border-ink-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Browse library
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Controls */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => goto((idx - 1 + items.length) % items.length)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-ink-700/80 bg-ink-950/50 px-3 py-1.5 text-lg text-slate-300 backdrop-blur transition hover:text-white"
            >
              ‹
            </button>
            <button
              onClick={() => goto((idx + 1) % items.length)}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-ink-700/80 bg-ink-950/50 px-3 py-1.5 text-lg text-slate-300 backdrop-blur transition hover:text-white"
            >
              ›
            </button>
            <div className="absolute bottom-5 right-6 z-10 flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goto(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === idx ? 24 : 10,
                    background: i === idx ? "#d9a233" : "rgba(148,163,184,.45)",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Slide progress bar */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-ink-950/50">
          <div
            className="h-full bg-gold-500"
            style={{ width: `${Math.round(progress * 100)}%`, transition: "width 120ms linear" }}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes heroKenBurns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.09);
          }
        }
      `}</style>
    </div>
  );
}
