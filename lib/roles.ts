/**
 * Portal roles.
 *  - admin:   full Admin Console + can grant/revoke roles (People tab)
 *  - manager: content tabs of the Admin Console (no People tab)
 *  - learner: no console access
 * TalentLMS admin-type accounts are ALWAYS portal admins (lock-out proof).
 * Granted roles are stored in data/roles.json by login/email.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { getUserById, type TlmsUser } from "@/lib/talentlms";

export type Role = "admin" | "manager" | "learner";

export interface RolesData {
  admins: string[]; // logins or emails
  managers: string[];
}

const FILE = path.join(process.cwd(), "data", "roles.json");

export async function readRoles(): Promise<RolesData> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as RolesData;
    return {
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
      managers: Array.isArray(parsed.managers) ? parsed.managers : [],
    };
  } catch {
    return { admins: [], managers: [] };
  }
}

export async function writeRoles(data: RolesData): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(
    FILE,
    JSON.stringify(
      {
        admins: Array.from(new Set(data.admins.map((s) => s.trim().toLowerCase()).filter(Boolean))),
        managers: Array.from(new Set(data.managers.map((s) => s.trim().toLowerCase()).filter(Boolean))),
      },
      null,
      2
    ),
    "utf8"
  );
}

/** True when the TalentLMS account itself is an admin type (built-in admin). */
export function isBuiltinAdmin(user: Pick<TlmsUser, "user_type">): boolean {
  return /admin/i.test(user.user_type ?? "");
}

export function resolveRole(user: TlmsUser, roles: RolesData): Role {
  if (isBuiltinAdmin(user)) return "admin";
  const ids = [user.login, user.email].filter(Boolean).map((s) => s!.toLowerCase());
  if (roles.admins.some((a) => ids.includes(a))) return "admin";
  if (roles.managers.some((m) => ids.includes(m))) return "manager";
  return "learner";
}

export async function getRoleForUserId(userId: string): Promise<Role> {
  try {
    const [user, roles] = await Promise.all([getUserById(userId), readRoles()]);
    return resolveRole(user, roles);
  } catch {
    return "learner";
  }
}
