import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { gotoCourse } from "@/lib/talentlms";

/**
 * GET /api/course/:id/launch
 * Fetches a fresh one-time gotocourse URL and redirects the browser into
 * TalentLMS. Middleware guarantees a valid session before this runs.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { goto_url } = await gotoCourse(session.userId, params.id);
    return NextResponse.redirect(goto_url);
  } catch (e) {
    console.error("Course launch error:", e);
    return NextResponse.redirect(new URL("/dashboard?error=launch", req.url));
  }
}
