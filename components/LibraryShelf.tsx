"use client";

import Link from "next/link";
import { useRef } from "react";

export interface ShelfCourse {
  id: string;
  name: string;
  image?: string;
  level: number | null;
  enrolled: boolean;
  pct: number;
  startHere: boolean;
}

export function LibraryCard({ c }: { c: ShelfCourse }) {
  return (
    <Link
      href={`/library/${c.id}`}
      className="group w-56 shrink-0 snap-start"
      aria-label={c.name}
    >
      <div className="relative overflow-hidden rounded-lg border border-ink-700 bg-ink-800 transition duration-300 group-hover:-translate-y-1 group-hover:border-gold-500/50 group-hover:shadow-xl">
        <div className="relative aspect-video bg-ink-700">
          {c.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={c.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-gold-500/60">
              {c.name.slice(0, 1)}
            </div>
          )}
          {c.level !== null && (
            <span className="absolute left-2 top-2 rounded bg-ink-950/80 px-2 py-0.5 text-[11px] font-semibold text-slate-300 backdrop-blur">
              Level {c.level}
            </span>
          )}
          {c.startHere && (
            <span className="absolute right-2 top-2 rounded bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-ink-950">
              Start here
            </span>
          )}
          {c.enrolled && c.pct >= 100 && (
            <span className="absolute right-2 top-2 rounded bg-emerald-900/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur">
              Completed ✓
            </span>
          )}
          {c.enrolled && c.pct > 0 && c.pct < 100 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-ink-950/60">
              <div className="h-full bg-gold-500" style={{ width: `${c.pct}%` }} />
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 truncate text-sm font-medium text-slate-200 group-hover:text-white">{c.name}</p>
      <p className="text-xs text-slate-500">
        {c.enrolled ? (c.pct >= 100 ? "Completed" : c.pct > 0 ? `${c.pct}% complete` : "In your training") : "Tap for details"}
      </p>
    </Link>
  );
}

export default function LibraryShelf({ title, courses }: { title: string; courses: ShelfCourse[] }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (d: 1 | -1) => row.current?.scrollBy({ left: d * (row.current.clientWidth - 120), behavior: "smooth" });

  if (courses.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between pr-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        {courses.length > 4 && (
          <div className="flex gap-1">
            <button onClick={() => scroll(-1)} aria-label="Scroll left" className="rounded-md border border-ink-700 px-2.5 py-1 text-slate-400 hover:border-slate-500 hover:text-white">
              ‹
            </button>
            <button onClick={() => scroll(1)} aria-label="Scroll right" className="rounded-md border border-ink-700 px-2.5 py-1 text-slate-400 hover:border-slate-500 hover:text-white">
              ›
            </button>
          </div>
        )}
      </div>
      <div
        ref={row}
        className="flex snap-x gap-4 overflow-x-auto px-1 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((c) => (
          <LibraryCard key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}
