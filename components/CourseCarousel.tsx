import Link from "next/link";

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

/** Right-side action link — mirrors the concept: Finish / Continue / Review / Start. */
function actionLabel(item: CarouselItem): string {
  if (!item.enrolled) return "Start →";
  if (item.pct >= 100) return "Review →";
  if (item.pct >= 85) return "Finish →";
  if (item.pct > 0) return "Continue →";
  return "Start →";
}

function Card({ item }: { item: CarouselItem }) {
  const done = item.pct >= 100;
  const almost = !done && item.pct >= 85;

  const status = !item.enrolled ? (
    <span className="text-stone-500">Not started</span>
  ) : done ? (
    <span className="text-done-500">Completed</span>
  ) : almost ? (
    <span className="text-accent-500">{item.pct}% — almost there</span>
  ) : item.pct > 0 ? (
    <span className="text-stone-500">{item.pct}% complete</span>
  ) : (
    <span className="text-stone-500">Not started</span>
  );

  return (
    <div className="group border border-ink-700 bg-ink-900 p-4 transition duration-150 hover:-translate-y-0.5 hover:border-gold-500">
      {/* Thumb */}
      <Link href={item.enrolled ? `/course/${item.id}` : `/library/${item.id}`} className="mb-3 block">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-[2px] bg-ink-800 text-stone-700">
          {item.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </Link>

      {/* Title */}
      <h3 className="mb-2.5 font-display text-[12.5px] font-semibold uppercase leading-snug tracking-wide text-white">
        {item.name}
      </h3>

      {/* Progress */}
      <div className="mb-2 h-[3px] overflow-hidden rounded-[2px] bg-stone-700">
        <div
          className={`h-full ${done ? "bg-done-500" : "bg-gold-500"}`}
          style={{ width: `${Math.min(item.pct, 100)}%` }}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-[11px]">
        {status}
        {item.enrolled ? (
          <Link href={`/course/${item.id}`} className="font-semibold text-gold-500 hover:text-gold-400">
            {actionLabel(item)}
          </Link>
        ) : (
          <form action={`/api/course/${item.id}/enroll?next=/course/${item.id}`} method="POST">
            <button className="font-semibold text-gold-500 hover:text-gold-400">Start →</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CourseCarousel({
  title,
  items,
  viewAllHref,
}: {
  title: string;
  items: CarouselItem[];
  viewAllHref?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-white">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="font-display text-[11px] font-medium uppercase tracking-wide text-gold-500 hover:text-gold-400">
            View all
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
