/**
 * Discussion board storage — data/board.json.
 * Same pattern as the other stores: file now, swap to Postgres/KV at deploy.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface Channel {
  id: string;
  name: string;
  description: string;
}
export interface Thread {
  id: string;
  channelId: string;
  title: string;
  authorKey: string;
  authorName: string;
  createdAt: string;
  pinned?: boolean;
  locked?: boolean;
  tag?: string; // id from lib/boardTags
}
export interface PostAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}
export interface Post {
  id: string;
  threadId: string;
  authorKey: string;
  authorName: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  likes: string[]; // member keys
  attachments?: PostAttachment[];
}
export interface BoardData {
  channels: Channel[];
  threads: Thread[];
  posts: Post[];
}

const FILE = path.join(process.cwd(), "data", "board.json");

const defaults: BoardData = {
  channels: [
    { id: "announcements", name: "Announcements", description: "News from the Chris Collins team" },
    { id: "general", name: "General", description: "Talk shop with fellow members" },
    { id: "wins", name: "Wins", description: "Share your numbers and victories" },
    { id: "ask", name: "Ask the Community", description: "Get answers from people who've been there" },
  ],
  threads: [],
  posts: [],
};

export async function readBoard(): Promise<BoardData> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as BoardData;
    if (Array.isArray(parsed.channels) && Array.isArray(parsed.threads) && Array.isArray(parsed.posts)) {
      return parsed;
    }
    return defaults;
  } catch {
    return defaults;
  }
}

// Serialize writes so concurrent posts don't clobber each other.
let writeQueue: Promise<unknown> = Promise.resolve();

export function mutateBoard<T>(fn: (data: BoardData) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await readBoard();
    const result = await fn(data);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface ThreadSummary extends Thread {
  replyCount: number;
  lastActivity: string;
  channelName: string;
}

/** Thread summaries — pinned first, then most-recent activity. Shared by the
 *  board API route and the Home page's community teaser. */
export function summarizeThreads(board: BoardData): ThreadSummary[] {
  const channelName = (id: string) => board.channels.find((c) => c.id === id)?.name ?? id;
  return board.threads
    .map((t) => {
      const posts = board.posts.filter((p) => p.threadId === t.id);
      const last = posts[posts.length - 1];
      return {
        ...t,
        replyCount: Math.max(posts.length - 1, 0),
        lastActivity: last?.createdAt ?? t.createdAt,
        channelName: channelName(t.channelId),
      };
    })
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return a.lastActivity < b.lastActivity ? 1 : -1;
    });
}
