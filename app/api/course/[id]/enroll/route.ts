import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { enrollUserInCourse } from "@/lib/talentlms";

/**
 * POST /api/course/:id/enroll
 * Self-enroll the logged-in member as a learner, then bounce back to the library.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  const nextParam = new URL(req.url).searchParams.get("next");
  const back = nextParam && nextParam.startsWith("/") ? nextParam : "/library";

  try {
    await enrollUserInCourse(session.userId, params.id);
    return NextResponse.redirect(new URL(`${back}?enrolled=${params.id}`, req.url), { status: 303 });
  } catch (e) {
    console.error("Enroll error:", e);
    return NextResponse.redirect(new URL(`${back}?error=1`, req.url), { status: 303 });
  }
}
