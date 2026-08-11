/** Helpers for preview media: direct video files vs YouTube links. */

export function youTubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

export function isDirectVideo(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

/** Start offset in seconds from a YouTube URL's t= / start= param (e.g. t=247s). */
export function ytStart(url?: string): number {
  if (!url) return 0;
  const m = url.match(/[?&](?:t|start)=(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** Chromeless-ish muted looping YouTube embed for hover/background previews. */
export function ytEmbedUrl(id: string, start = 0): string {
  const p = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: id,
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    iv_load_policy: "3",
    disablekb: "1",
  });
  if (start > 0) p.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

/** Full embed URL straight from any YouTube link, or null if not YouTube. */
export function ytEmbedFromUrl(url?: string): string | null {
  const id = youTubeId(url);
  return id ? ytEmbedUrl(id, ytStart(url)) : null;
}
