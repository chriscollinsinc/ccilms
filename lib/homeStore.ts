/**
 * Persistence for editor-managed Home/spotlight settings.
 * Dev + regular servers: JSON file at data/home.json.
 * (On Vercel, swap these two functions for a KV/Postgres read+write —
 * nothing else in the app needs to change.)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { home as defaults, type FeaturedCourse, type LiveSession } from "@/config/portal";

const FILE = path.join(process.cwd(), "data", "home.json");

export interface HomeConfig {
  featured: FeaturedCourse[];
  liveSession: LiveSession;
}

export async function readHome(): Promise<HomeConfig> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<HomeConfig>;
    return {
      featured: Array.isArray(parsed.featured) ? parsed.featured : defaults.featured,
      liveSession: parsed.liveSession ?? defaults.liveSession,
    };
  } catch {
    return { featured: defaults.featured, liveSession: defaults.liveSession };
  }
}

export async function writeHome(cfg: HomeConfig): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cfg, null, 2), "utf8");
}
