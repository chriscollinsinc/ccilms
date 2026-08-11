/**
 * Minimal signed-cookie session (JWT via jose). The portal keeps its own
 * session; TalentLMS is only touched at login validation and course launch.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "cci_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me");

export interface SessionData {
  userId: string;
  login: string;
}

export async function createSession(data: SessionData): Promise<void> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as string, login: payload.login as string };
  } catch {
    return null;
  }
}

export function destroySession(): void {
  cookies().delete(COOKIE);
}
