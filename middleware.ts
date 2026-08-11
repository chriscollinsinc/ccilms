import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protects /dashboard and /api/course/* — verifies the session cookie at the edge.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("cci_session")?.value;
  const loginUrl = new URL("/login", req.url);

  if (!token) return NextResponse.redirect(loginUrl);
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me"));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/home/:path*",
    "/dashboard/:path*",
    "/library/:path*",
    "/community/:path*",
    "/leaderboard/:path*",
    "/podcast/:path*",
    "/coach/:path*",
    "/resources/:path*",
    "/tools/:path*",
    "/course/:path*",
    "/launch",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/board/:path*",
    "/api/course/:path*",
    "/api/sso",
  ],
};
