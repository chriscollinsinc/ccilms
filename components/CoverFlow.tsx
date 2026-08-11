"use client";

/**
 * Cover Flow episode browser — iPhone-1 album style. Center cover faces the
 * viewer; neighbors angle away like records in a crate, with reflections.
 * Wheel, arrow keys, clicking a side cover, or the scrubber to navigate.
 * Click the center cover to play.
 */
import { useMemo, useRef, useState } from "react";

export interface FlowEpisode {
  id: string;
  title: string;
  publishedAt?: string;
  thumb?: string;
}

const SPACING = 130; // px between side covers
const VISIBLE = 8; // covers rendered on each side of center

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function CoverFlow({ episodes }: { episodes: FlowEpisode[] }) {
  const [idx, setIdx] = useState(0);
  const [year, setYear] = useState("");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<FlowEpisode | null>(null);
  const wheelAcc = useRef(0);

  const years = useMemo(() => {
    const set = new Set<string>();
    episodes.forEach((e) => {
      const y = e.publishedAt?.slice(0, 4);
      if (y) set.add(y);
    });
    return Array.from(set).sort().reverse();
  }, [episodes]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return episodes.filter((e) => {
      if (year && e.publishedAt?.slice(0, 4) !== year) return false;
      if (ql && !e.title.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [episodes, year, q]);

  const max = filtered.length - 1;
  const cur = Math.min(idx, Math.max(0, max));
  const move = (d: number) => setIdx(Math.min(Math.max(cur + d, 0), Math.max(0, max)));

  function onWheel(e: React.WheelEvent) {
    wheelAcc.current += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelAcc.current) > 40) {
      move(wheelAcc.current > 0 ? 1 : -1);
      wheelAcc.current = 0;
    }
  }

  const center = filtered[cur];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          placeholder="Search episodes…"
          className="w-56 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-gold-500"
        />
        {years.length > 0 && (
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setIdx(0);
            }}
            className="rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-500">
          {filtered.length} episode{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-slate-500">No episodes match.</p>
      ) : (
        <>
          {/* The flow */}
          <div
            tabIndex={0}
            role="listbox"
            aria-label="Episode browser"
            onWheel={onWheel}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(1);
              if (e.key === "ArrowLeft") move(-1);
              if (e.key === "Enter" && center) setPlaying(center);
            }}
            className="relative mt-6 h-[300px] select-none overflow-hidden outline-none"
            style={{ perspective: 1200 }}
          >
            {filtered.map((ep, i) => {
              const off = i - cur;
              if (Math.abs(off) > VISIBLE) return null;
              const isC = off === 0;
              const x = off * SPACING + (off === 0 ? 0 : off > 0 ? 90 : -90);
              return (
                <button
                  key={ep.id + i}
                  onClick={() => (isC ? setPlaying(ep) : setIdx(i))}
                  aria-label={ep.title}
                  className="absolute left-1/2 top-6 block"
                  style={{
                    width: 260,
                    marginLeft: -130,
                    zIndex: 100 - Math.abs(off),
                    transform: `translateX(${x}px) translateZ(${isC ? 90 : -60}px) rotateY(${
                      isC ? 0 : off > 0 ? -48 : 48
                    }deg)`,
                    transformStyle: "preserve-3d",
                    transition: "transform 450ms cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <div
                    className={`overflow-hidden rounded-md border ${isC ? "border-gold-500/60" : "border-ink-700"} bg-ink-800 shadow-2xl`}
                    style={{
                      WebkitBoxReflect:
                        "below 2px linear-gradient(transparent 62%, rgba(255,255,255,.14))",
                    }}
                  >
                    <div className="relative aspect-video">
                      {ep.thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={ep.thumb} alt="" draggable={false} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-ink-700 text-gold-500">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                      {isC && (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition hover:bg-ink-950/30">
                          <span className="rounded-full bg-gold-500/90 p-3 text-ink-950 opacity-0 transition hover:opacity-100">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Edge arrows */}
            <button onClick={() => move(-1)} aria-label="Previous episode" className="absolute left-2 top-1/3 z-[200] rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-lg text-slate-300 hover:text-white">
              ‹
            </button>
            <button onClick={() => move(1)} aria-label="Next episode" className="absolute right-2 top-1/3 z-[200] rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-lg text-slate-300 hover:text-white">
              ›
            </button>
          </div>

          {/* Center title + date */}
          {center && (
            <div className="mt-1 text-center">
              <p className="mx-auto max-w-xl truncate text-sm font-semibold text-white">{center.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{fmtDate(center.publishedAt)}</p>
            </div>
          )}

          {/* Jukebox scrubber */}
          {filtered.length > 1 && (
            <input
              type="range"
              min={0}
              max={max}
              step={1}
              value={cur}
              onChange={(e) => setIdx(Number(e.target.value))}
              aria-label="Scrub through episodes"
              className="mt-4 w-full accent-[#d9a233]"
            />
          )}
        </>
      )}

      {/* Player */}
      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6"
          onClick={() => setPlaying(null)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="truncate pr-4 text-sm font-semibold text-white">{playing.title}</p>
              <button
                onClick={() => setPlaying(null)}
                className="rounded-md border border-ink-700 px-3 py-1 text-sm text-slate-300 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-xl border border-ink-700">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`}
                title={playing.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
