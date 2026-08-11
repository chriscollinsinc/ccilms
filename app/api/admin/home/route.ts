import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { canEditContent } from "@/lib/admin";
import { getCatalog } from "@/lib/talentlms";
import { readHome, writeHome } from "@/lib/homeStore";
import type { FeaturedCourse } from "@/config/portal";

async function guard() {
  const session = await getSession();
  if (!session) return null;
  if (!(await canEditContent(session.userId))) return null;
  return session;
}

/** GET: current spotlight config + course catalog for the picker. */
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [cfg, catalog] = await Promise.all([readHome(), getCatalog()]);
  return NextResponse.json({
    featured: cfg.featured,
    catalog: catalog.map((c) => ({ id: c.id, name: c.name, image: c.big_avatar || c.avatar || "" })),
  });
}

/** PUT: save spotlight config. Body: { featured: FeaturedCourse[] } */
export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.featured)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const featured: FeaturedCourse[] = body.featured
    .filter((f: FeaturedCourse) => typeof f.courseId === "string" && f.courseId)
    .map((f: FeaturedCourse) => ({
      courseId: String(f.courseId),
      tagline: typeof f.tagline === "string" ? f.tagline.slice(0, 200) : "",
      previewVideo: typeof f.previewVideo === "string" ? f.previewVideo.trim() : "",
      previewDuration:
        typeof f.previewDuration === "number" && isFinite(f.previewDuration)
          ? Math.min(Math.max(Math.round(f.previewDuration), 5), 600)
          : undefined,
      image: typeof f.image === "string" ? f.image.trim() : "",
    }));

  await writeHome({ featured });
  return NextResponse.json({ ok: true });
}
