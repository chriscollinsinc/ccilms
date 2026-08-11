import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAutologinUrl } from "@/lib/talentlms";

/**
 * GET /api/sso
 * Hands the member into native TalentLMS (e.g. Discussions) via a fresh
 * one-time autologin URL — no second sign-in.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const url = await getAutologinUrl(session.userId);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("SSO error:", e);
    return NextResponse.redirect(new URL("/dashboard?error=launch", req.url));
  }
}
