import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById, getCatalog } from "@/lib/talentlms";
import { readHome } from "@/lib/homeStore";
import CourseCarousel, { type CarouselItem } from "@/components/CourseCarousel";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

function stripHtml(html?: string): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, catalog, home] = await Promise.all([getUserById(session.userId), getCatalog(), readHome()]);
  const mine = new Map((user.courses ?? []).map((c) => [c.id, Number(c.completion_percentage ?? 0)]));

  const toItem = (id: string): CarouselItem | null => {
    const c = catalog.find((x) => x.id === id);
    if (!c) return null;
    const feat = home.featured.find((f) => f.courseId === id);
    return {
      id: c.id,
      name: c.name,
      description: feat?.tagline || stripHtml(c.description).slice(0, 140),
      image: feat?.image || c.big_avatar || c.avatar,
      previewVideo: feat?.previewVideo || undefined,
      previewDuration: feat?.previewDuration,
      enrolled: mine.has(c.id),
      pct: mine.get(c.id) ?? 0,
    };
  };

  // Featured: config list, else first 6 catalog courses.
  const featuredIds = home.featured.length > 0 ? home.featured.map((f) => f.courseId) : catalog.slice(0, 6).map((c) => c.id);
  const featured = featuredIds.map(toItem).filter(Boolean) as CarouselItem[];
  const hero = featured[0];

  const inProgress = (user.courses ?? [])
    .filter((c) => c.completion_status !== "Completed" && Number(c.completion_percentage ?? 0) > 0)
    .map((c) => toItem(c.id))
    .filter(Boolean) as CarouselItem[];

  const fresh = catalog
    .filter((c) => !mine.has(c.id))
    .slice(0, 12)
    .map((c) => toItem(c.id))
    .filter(Boolean) as CarouselItem[];

  return (
    <div className="px-8 py-8">
      <HeroCarousel items={featured} />

      <CourseCarousel title="Featured" items={featured} />
      <CourseCarousel title="Continue training" items={inProgress} />
      <CourseCarousel title="New for you" items={fresh} />
    </div>
  );
}
