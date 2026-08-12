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
      className="relative overflow-hidden border-b border-ink-800"
    >
      <div className="relative h-[58vh] max-h-[680px] min-h-[440px] w-full bg-ink-800">
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

              {/* Netflix-style scrims: left for legibility, bottom fade into the page */}
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />

              {/* Copy + CTAs */}
              <div className="absolute inset-y-0 left-0 flex max-w-[600px] flex-col justify-center pl-12">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-500">
                  ★ Featured training
                </p>
                <h1
                  className="mt-3 font-display text-4xl font-bold uppercase leading-[1.1] text-white transition-all duration-700 md:text-5xl"
                  style={{
                    transform: isActive ? "translateY(0)" : "translateY(14px)",
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  {item.name}
                </h1>
                {item.description && (
                  <p
                    className="mt-4 max-w-[480px] text-sm leading-relaxed text-[#E4E0CB]/85 transition-all delay-100 duration-700"
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
                      href={`/course/${item.id}`}
                      className="flex items-center gap-2 rounded-[3px] bg-accent-500 px-6 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-accent-400"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {item.pct > 0 && item.pct < 100 ? "Continue" : item.pct >= 100 ? "Review" : "Start now"}
                    </a>
                  ) : (
                    <form action={`/api/course/${item.id}/enroll`} method="POST">
                      <button className="flex items-center gap-2 rounded-[3px] bg-accent-500 px-6 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-accent-400">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Start now
                      </button>
                    </form>
                  )}
                  <a
                    href={`/library/${item.id}`}
                    className="flex items-center gap-2 rounded-[3px] border border-white/25 bg-white/10 px-6 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8h.01M12 12v4" />
                    </svg>
                    Details
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dots — bottom-left thin bars */}
        {items.length > 1 && (
          <div className="absolute bottom-6 left-12 z-10 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goto(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-[3px] w-5 rounded-[2px] transition-colors duration-300 ${
                  i === idx ? "bg-gold-500" : "bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
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
