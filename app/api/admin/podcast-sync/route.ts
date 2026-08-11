import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { canEditContent } from "@/lib/admin";
import { writeEpisodes, type SyncedEpisode } from "@/lib/episodesStore";

/**
 * POST /api/admin/podcast-sync  { playlistUrl }
 * Pulls EVERY item in the YouTube playlist (title, thumbnail, real publish
 * date) via the YouTube Data API v3 and saves to the episodes store.
 * Requires YOUTUBE_API_KEY in .env.local.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !(await canEditContent(session.userId))) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is missing from .env.local — add it and restart the dev server." },
      { status: 400 }
    );
  }

  const { playlistUrl } = await req.json().catch(() => ({}));
  const listId = String(playlistUrl ?? "").match(/[?&]list=([\w-]+)/)?.[1];
  if (!listId) {
    return NextResponse.json({ error: "That doesn't look like a YouTube playlist URL." }, { status: 400 });
  }

  const episodes: SyncedEpisode[] = [];
  let pageToken = "";
  let pages = 0;

  try {
    do {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet,contentDetails");
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("playlistId", listId);
      url.searchParams.set("key", key);
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message ?? `YouTube API error (${res.status})`;
        return NextResponse.json({ error: msg }, { status: 502 });
      }

      for (const item of data.items ?? []) {
        const id = item.contentDetails?.videoId;
        const title = item.snippet?.title ?? "";
        // Skip private/deleted videos
        if (!id || title === "Private video" || title === "Deleted video") continue;
        episodes.push({
          id,
          title,
          publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? "",
          thumb:
            item.snippet?.thumbnails?.medium?.url ??
            item.snippet?.thumbnails?.default?.url ??
            `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        });
      }

      pageToken = data.nextPageToken ?? "";
      pages++;
    } while (pageToken && pages < 30); // safety cap: 1,500 videos

    episodes.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

    await writeEpisodes({
      playlistUrl: String(playlistUrl),
      syncedAt: new Date().toISOString(),
      episodes,
    });

    return NextResponse.json({ ok: true, count: episodes.length });
  } catch (e) {
    console.error("Playlist sync error:", e);
    return NextResponse.json({ error: "Sync failed — check the server logs." }, { status: 500 });
  }
}
