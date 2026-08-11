import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCourse } from "@/lib/talentlms";
import FramedEmbed from "@/components/FramedEmbed";

/**
 * Embedded course player — keeps the member inside the portal's own chrome
 * instead of bouncing them out to talentlms.com. Works because "Allow
 * application to be loaded in a frame" is enabled on the TalentLMS account
 * (Account & Settings > Security > Other). If that ever gets turned off,
 * the iframe will stay blank — "Open full screen" always works regardless,
 * since it's a plain top-level redirect to the same launch URL.
 */
export default async function EmbeddedCoursePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const course = await getCourse(params.id).catch(() => null);
  if (!course) notFound();

  const launchUrl = `/api/course/${params.id}/launch`;

  return (
    <main className="flex h-screen flex-col bg-ink-950">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-4 py-2.5">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to dashboard
        </Link>
        <span className="min-w-0 truncate px-4 text-sm font-semibold text-white">{course.name}</span>
        <a
          href={launchUrl}
          className="shrink-0 rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-gold-500/50 hover:text-white"
        >
          Open full screen ↗
        </a>
      </div>
      <FramedEmbed
        src={launchUrl}
        title={course.name}
        allow="fullscreen; autoplay; encrypted-media"
        label="Loading your training…"
      />
    </main>
  );
}
