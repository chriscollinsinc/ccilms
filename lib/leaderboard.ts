import { getUsers, getUserById } from "@/lib/talentlms";
import { isBuiltinAdmin } from "@/lib/roles";

export interface Standing {
  id: string;
  name: string;
  points: number;
  level: number;
}

let cache: { data: Standing[]; ts: number } | null = null;
let inflight: Promise<Standing[]> | null = null;
const TTL = 10 * 60 * 1000;

/** Ranked standings (learners only — staff excluded), cached 10 minutes. */
export async function getStandings(): Promise<Standing[]> {
  if (cache && Date.now() - cache.ts < TTL) return cache.data;

  // Several requests can land at once right when the cache expires (e.g.
  // a few people opening the leaderboard within the same second). Without
  // this, each one would kick off its own full TalentLMS fetch/hydration.
  // Share a single in-flight refresh instead.
  if (inflight) return inflight;

  inflight = refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function refresh(): Promise<Standing[]> {
  try {
    const data = await computeStandings();
    cache = { data, ts: Date.now() };
    return data;
  } catch (e) {
    // TalentLMS hiccup — serve the last good standings rather than a
    // broken page, if we have any.
    if (cache) {
      console.error("getStandings: refresh failed, serving stale cache:", e);
      return cache.data;
    }
    throw e;
  }
}

async function computeStandings(): Promise<Standing[]> {
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

  return standings;
}
