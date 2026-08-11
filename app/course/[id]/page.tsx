"use client";

/**
 * EXPERIMENT: embedded course player.
 * Tries to render the TalentLMS course inside the portal via an iframe.
 * Whether this works depends on TalentLMS's frame headers and browser
 * cookie rules — if the frame stays blank, use "Open full screen"
 * (the redirect flow, which always works).
 */
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EmbeddedCoursePage() {
  const { id } = useParams<{ id: string }>();
  const launchUrl = `/api/course/${id}/launch`;

  return (
    <main className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-4 py-2">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to dashboard
        </Link>
        <span className="text-sm font-bold tracking-tight text-white">
          CHRIS COLLINS <span className="text-gold-500">INC</span>
        </span>
        <a
          href={launchUrl}
          className="rounded-md border border-ink-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
        >
          Open full screen ↗
        </a>
      </div>
      <iframe
        src={launchUrl}
        className="w-full flex-1 border-0 bg-white"
        allow="fullscreen; autoplay; encrypted-media"
        title="Course player"
      />
    </main>
  );
}
