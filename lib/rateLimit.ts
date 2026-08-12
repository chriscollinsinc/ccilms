/**
 * Minimal in-memory rate limiter.
 *
 * Good enough for a single Node process (which is how this app runs on
 * Render — one persistent server, not per-request serverless functions).
 * If this ever moves to multiple instances behind a load balancer, swap
 * the Map below for something shared (e.g. Redis) — each instance would
 * otherwise track its own counts.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this Map doesn't grow forever.
// Cheap to run rarely; only matters on a long-lived server.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 5 * 60 * 1000) return;
  lastSweep = now;
  for (const [key, bucket] of Array.from(buckets)) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may try again (only meaningful when !allowed). */
  retryAfterSeconds: number;
  remaining: number;
}

/**
 * Fixed-window limiter: allows up to `max` calls per `windowMs` for a given
 * key, then blocks until the window resets.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  sweep();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0, remaining: max - existing.count };
}

/** Clears a key's bucket — call after a successful login so one mistyped
 *  password earlier doesn't count against a user's future attempts. */
export function clearRateLimit(key: string) {
  buckets.delete(key);
}

/** Best-effort client IP from Render's proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
