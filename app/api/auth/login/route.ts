import { NextResponse } from "next/server";
import { userLogin, getUserByEmail, TalentLmsError } from "@/lib/talentlms";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  const { login, password } = await req.json().catch(() => ({}));
  if (!login || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  try {
    // The API's userlogin only accepts usernames, but people type emails.
    // If it looks like an email, resolve it to the username first.
    let loginName = login as string;
    if (loginName.includes("@")) {
      try {
        loginName = (await getUserByEmail(loginName)).login;
      } catch {
        // No user with that email -> fall through; userlogin will reject it
        // with the same generic message (avoids leaking which emails exist).
      }
    }
    // TalentLMS validates the credentials; we only keep the user id.
    // The returned login_key is single-use and NOT stored — course launches
    // fetch a fresh one via /api/course/[id]/launch.
    const result = await userLogin(loginName, password);
    await createSession({ userId: result.user_id, login: loginName });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof TalentLmsError) {
      console.error(`TalentLMS ${e.status}: ${e.message}`);
      // TalentLMS returns 403 (with this message) for plain bad credentials,
      // so check the message BEFORE treating 4xx as a server config problem.
      if (/password is incorrect|incorrect.*(login|password)/i.test(e.message)) {
        return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
      }
      if (e.status === 401) {
        return NextResponse.json({ error: "Server config issue: TalentLMS rejected the API key." }, { status: 502 });
      }
      if (e.status === 403) {
        return NextResponse.json({ error: "Server config issue: API not enabled on the TalentLMS portal." }, { status: 502 });
      }
      if (e.status < 500) {
        return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
      }
    }
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login is temporarily unavailable." }, { status: 502 });
  }
}
