"use client";

import { useRef, useState } from "react";
import { ytEmbedFromUrl, isDirectVideo } from "@/lib/video";

export interface CarouselItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  previewVideo?: string;
  previewDuration?: number; // seconds — hero advances after this long
  enrolled: boolean;
  pct: number;
}

function Card({ item }: { item: CarouselItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);

  function enter() {
    if (!item.previewVideo) return;
    timer.current = setTimeout(() => {
      setPlaying(true);
      videoRef.current?.play().catch(() => {});
    }, 450);
  }
  function leave() {
    if (timer.current) clearTimeout(timer.current);
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <div
      onMouseEnter={enter}
      onMouseLeave={leave}
      className="group relative w-64 shrink-0 snap-start transition-transform duration-300 ease-out hover:z-20 hover:scale-[1.22] hover:-translate-y-2"
      style={{ transitionDelay: "120ms" }}
    >
      <div className="overflow-hidden rounded-lg border border-ink-700 bg-ink-800 shadow-lg">
        {/* Media */}
        <div className="relative aspect-video bg-ink-700">
          {item.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink-950">
              <span className="rounded-md bg-gold-500 px-3 py-1">{item.name.slice(0, 1)}</span>
            </div>
          )}
          {isDirectVideo(item.previewVideo) && (
            <video
              ref={videoRef}
              src={item.previewVideo}
              muted
              loop
              playsInline
              preload="none"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {playing && ytEmbedFromUrl(item.previewVideo) && (
            <iframe
              src={ytEmbedFromUrl(item.previewVideo)!}
              title=""
              aria-hidden
              tabIndex={-1}
              allow="autoplay; encrypted-media"
              className="pointer-events-none absolute inset-1/2 aspect-video h-[135%] -translate-x-1/2 -translate-y-1/2"
              style={{ minWidth: "135%" }}
            />
          )}
          {item.enrolled && item.pct > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-ink-950/60">
              <div className="h-full bg-gold-500" style={{ width: `${item.pct}%` }} />
            </div>
          )}
        </div>

        {/* Details — slide up on hover */}
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
          <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              {item.description && (
                <p className="mt-1 text-xs leading-relaxed text-slate-400" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 pb-1">
                {item.enrolled ? (
                  <a href={`/course/${item.id}`} className="rounded bg-accent-500 px-3 py-1 text-xs font-semibold text-ink-950 hover:bg-accent-400">
                    {item.pct > 0 && item.pct < 100 ? "Continue" : item.pct >= 100 ? "Review" : "Start"}
                  </a>
                ) : (
                  <form action={`/api/course/${item.id}/enroll`} method="POST">
                    <button className="rounded border border-accent-500/60 px-3 py-1 text-xs font-semibold text-accent-500 hover:bg-accent-500 hover:text-ink-950">
                      Add to my training
                    </button>
                  </form>
                )}
                {item.enrolled && <span className="text-[11px] text-slate-500">{item.pct}%</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseCarousel({ title, items }: { title: string; items: CarouselItem[] }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * (row.current.clientWidth - 120), behavior: "smooth" });

  if (items.length === 0) return null;

  return (
    <section className="relative mt-10">
      <div className="mb-3 flex items-center justify-between pr-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} aria-label="Scroll left" className="rounded-md border border-ink-700 px-2.5 py-1 text-slate-400 hover:border-slate-500 hover:text-white">
            ‹
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" className="rounded-md border border-ink-700 px-2.5 py-1 text-slate-400 hover:border-slate-500 hover:text-white">
            ›
          </button>
        </div>
      </div>
      <div ref={row} className="flex snap-x gap-4 overflow-x-auto overflow-y-visible px-1 pb-12 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <Card key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
