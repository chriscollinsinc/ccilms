/** Synced podcast episodes (from the YouTube playlist) — data/episodes.json */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface SyncedEpisode {
  id: string; // YouTube video id
  title: string;
  publishedAt: string; // ISO date
  thumb: string;
}

export interface EpisodesData {
  playlistUrl: string;
  syncedAt: string | null;
  episodes: SyncedEpisode[];
}

const FILE = path.join(process.cwd(), "data", "episodes.json");

const empty: EpisodesData = {
  playlistUrl: "https://youtube.com/playlist?list=PLxE3XASkn8NtOgsH6rBRSWwUn8XFJWtoy",
  syncedAt: null,
  episodes: [],
};

export async function readEpisodes(): Promise<EpisodesData> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as EpisodesData;
    if (Array.isArray(parsed.episodes)) return parsed;
    return empty;
  } catch {
    return empty;
  }
}

export async function writeEpisodes(data: EpisodesData): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}
