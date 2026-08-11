import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserById, getCatalog, getCategories, type TlmsCatalogCourse } from "@/lib/talentlms";
import { courseLevel, codeSort } from "@/lib/courseMeta";
import LibraryShelf, { LibraryCard, type ShelfCourse } from "@/components/LibraryShelf";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { q?: string; show?: string; enrolled?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, catalog, categories] = await Promise.all([
    getUserById(session.userId),
    getCatalog(),
    getCategories(),
  ]);
  const mine = new Map((user.courses ?? []).map((c) => [c.id, Number(c.completion_percentage ?? 0)]));

  const q = (searchParams.q ?? "").toLowerCase();
  const show = searchParams.show ?? "all";
  const filtering = q !== "" || show !== "all";

  const toShelf = (c: TlmsCatalogCourse, startHere = false): ShelfCourse => ({
    id: c.id,
    name: c.name,
    image: c.big_avatar || c.avatar,
    level: courseLevel(c.code),
    enrolled: mine.has(c.id),
    pct: mine.get(c.id) ?? 0,
    startHere,
  });

  const sortCourses = (list: TlmsCatalogCourse[]) =>
    [...list].sort((a, b) => codeSort(a.code, b.code, a.name, b.name));

  // Shelves: one per category (in TalentLMS-defined structure), plus a
  // catch-all for uncategorized courses.
  const shelves: { title: string; courses: ShelfCourse[] }[] = [];
  if (!filtering) {
    const used = new Set<string>();
    for (const cat of [...categories].sort((a, b) => a.name.localeCompare(b.name))) {
      const inCat = sortCourses(catalog.filter((c) => c.category_id === cat.id));
      if (inCat.length === 0) continue;
      inCat.forEach((c) => used.add(c.id));
      const startId = inCat.find((c) => (mine.get(c.id) ?? 0) < 100)?.id;
      shelves.push({
        title: cat.name,
        courses: inCat.map((c) => toShelf(c, c.id === startId)),
      });
    }
    const rest = sortCourses(catalog.filter((c) => !used.has(c.id)));
    if (rest.length > 0) {
      const startId = rest.find((c) => (mine.get(c.id) ?? 0) < 100)?.id;
      shelves.push({ title: shelves.length > 0 ? "More courses" : "All courses", courses: rest.map((c) => toShelf(c, c.id === startId)) });
    }
  }

  // Flat results when searching / filtering.
  const results = filtering
    ? sortCourses(
        catalog.filter((c) => {
          if (q && !`${c.name} ${c.code ?? ""} ${c.description ?? ""}`.toLowerCase().includes(q)) return false;
          if (show === "enrolled" && !mine.has(c.id)) return false;
          if (show === "new" && mine.has(c.id)) return false;
          return true;
        })
      ).map((c) => toShelf(c))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      {searchParams.enrolled && (
        <div className="mb-6 rounded-md border border-emerald-800 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
          Added to your training — it&apos;s ready to start.
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Library</h1>
          <p className="mt-1 text-sm text-slate-400">
            Everything in your membership, organized by track. Pick up where the gold marker points.
          </p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search courses…"
            className="w-56 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-gold-500"
          />
          <select
            name="show"
            defaultValue={show}
            className="rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
          >
            <option value="all">All</option>
            <option value="enrolled">My training</option>
            <option value="new">Not started</option>
          </select>
          <button className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-400">
            Go
          </button>
          {filtering && (
            <a href="/library" className="text-sm text-slate-400 hover:text-white">
              Clear
            </a>
          )}
        </form>
      </div>

      {filtering ? (
        <>
          <p className="mt-6 text-xs text-slate-500">
            {results.length} course{results.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {results.map((c) => (
              <LibraryCard key={c.id} c={c} />
            ))}
          </div>
          {results.length === 0 && <p className="mt-8 text-sm text-slate-500">No courses match.</p>}
        </>
      ) : (
        shelves.map((s) => <LibraryShelf key={s.title} title={s.title} courses={s.courses} />)
      )}
    </div>
  );
}
