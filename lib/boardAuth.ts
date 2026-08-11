import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/talentlms";
import { getRoleForUserId } from "@/lib/roles";

export interface BoardUser {
  key: string; // stable member key (login/email, lowercase)
  name: string;
  staff: boolean; // admin or manager -> can moderate
}

export async function getBoardUser(): Promise<BoardUser | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const [user, role] = await Promise.all([
      getUserById(session.userId),
      getRoleForUserId(session.userId),
    ]);
    return {
      key: (user.login || user.email || session.userId).toLowerCase(),
      name: `${user.first_name} ${user.last_name}`.trim() || user.login,
      staff: role !== "learner",
    };
  } catch {
    return null;
  }
}
