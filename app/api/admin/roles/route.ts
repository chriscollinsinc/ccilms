import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { readRoles, writeRoles, isBuiltinAdmin } from "@/lib/roles";
import { getUsers } from "@/lib/talentlms";

async function guard() {
  const session = await getSession();
  if (!session) return false;
  return isAdmin(session.userId); // strictly admins — managers cannot manage roles
}

/** GET: current role grants + the TalentLMS user directory. */
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const [roles, users] = await Promise.all([readRoles(), getUsers()]);
  return NextResponse.json({
    ...roles,
    users: users.map((u) => ({
      login: u.login,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`.trim(),
      builtinAdmin: isBuiltinAdmin(u),
    })),
  });
}

/** PUT: save role grants. Body: { admins: string[], managers: string[] } */
export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.admins) || !Array.isArray(body.managers)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  await writeRoles({
    admins: body.admins.map(String),
    managers: body.managers.map(String),
  });
  return NextResponse.json({ ok: true });
}
