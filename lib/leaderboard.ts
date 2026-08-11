import { getUsers, getUserById } from "@/lib/talentlms";
import { isBuiltinAdmin } from "@/lib/roles";

export interface Standing {
  id: string;
  name: string;
  points: number;
  level: number;
}

let cache: { data: Standing[]; ts: number } | null = null;
const TTL = 10 * 60 * 1000;

/** Ranked standings (learners only — staff excluded), cached 10 minutes. */
export async function getStandings(): Promise<Standing[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;

  let users = await getUsers();
  users = users.filter((u) => u.status !== "inactive" && !isBuiltinAdmin(u));

  // If the list endpoint doesn't include points, hydrate via user detail (capped).
  const needsHydration = users.length > 0 && users.every((u) => u.points === undefined);
  if (needsHydration) {
    const detailed = await Promise.all(
      users.slice(0, 100).map((u) =>
        getUserById(u.id)
          .then((d) => ({ ...u, points: d.points, level: d.level }))
          .catch(() => u)
      )
    );
    users = detailed;
  }

  const standings = users
    .map((u) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || u.login,
      points: Number(u.points ?? 0) || 0,
      level: Number(u.level ?? 1) || 1,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  cache = { data: standings, ts: Date.now() };
  return standings;
}
