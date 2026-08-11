import type { TlmsUser } from "@/lib/talentlms";
import { getRoleForUserId, resolveRole, readRoles } from "@/lib/roles";

/** Full admin: console + role management. */
export async function isAdmin(userId: string): Promise<boolean> {
  return (await getRoleForUserId(userId)) === "admin";
}

/** Admin or manager: can edit portal content in the console. */
export async function canEditContent(userId: string): Promise<boolean> {
  const role = await getRoleForUserId(userId);
  return role === "admin" || role === "manager";
}

/** Sync variant when the user object + roles are already loaded. */
export function userIsAdmin(user: TlmsUser): boolean {
  // Kept for compatibility; built-in TalentLMS admins only.
  return /admin/i.test(user.user_type ?? "");
}

export { getRoleForUserId, resolveRole, readRoles };
