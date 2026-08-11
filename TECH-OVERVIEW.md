# CCI LMS Portal — Technical Overview (for IT)

## Summary
Custom web front-end for our TalentLMS learning platform. Members log in here,
browse/launch courses, watch the podcast, use the AI coach, and interact on a
discussion board. TalentLMS remains the system of record for users, courses,
progress, and certificates.

## Stack
| Layer | Technology |
|---|---|
| Language | TypeScript |
| Framework | Next.js 14 (React 18, App Router) — SSR + API routes in one app |
| Styling | Tailwind CSS 3 |
| Runtime | Node.js 18+ |
| Sessions | Signed JWT (HS256 via `jose`) in httpOnly, SameSite=Lax cookies, 12h expiry |
| Dependencies | Intentionally minimal: `next`, `react`, `jose`, Tailwind toolchain |

## Identity & access
- **TalentLMS is the identity provider.** Portal login calls TalentLMS
  `/v1/userlogin`; no passwords are stored or synced by the portal.
- Portal mints its own short-lived session cookie after TalentLMS approves.
- Deactivating a user in TalentLMS immediately blocks portal login.
- Role system: TalentLMS admin-type accounts are portal admins; additional
  admin/manager grants stored portal-side. All authorization is enforced
  server-side on every API route (UI hiding is cosmetic only).

## Secrets & integrations
- `TALENTLMS_API_KEY` (super-admin REST key) — server-side env var only; every
  TalentLMS call is proxied through server code. Never shipped to the browser.
- `SESSION_SECRET` — JWT signing key (rotate to invalidate all sessions).
- `YOUTUBE_API_KEY` — Google API key restricted to YouTube Data API v3
  (read-only public playlist sync).
- Delphi AI chat — third-party iframe embed, origin-allowlisted on Delphi's side.
- Google Tag Manager — injected into TalentLMS (not the portal) for the
  cross-navigation button; GTM container access should be restricted.

## Data
- Learning data (users, courses, progress, certificates, points/badges):
  lives in TalentLMS, fetched via REST with server-side caching (5–10 min TTLs)
  to respect API rate limits.
- Portal-owned data (spotlight config, page content, podcast episode cache,
  role grants, discussion board): JSON files under `data/` in development.
  **Planned:** swap to a managed store (Vercel KV / Postgres) at deployment —
  the storage layer is isolated in `lib/*Store.ts` for a one-file swap each.

## Hosting (planned)
- Vercel (or equivalent Node host): serverless SSR + API routes, TLS included.
- Custom domains: `portal.<company>.com` (this app) and
  `learn.<company>.com` (TalentLMS domain mapping) — same-site cookies enable
  the embedded-LMS experience.

## Repo layout
```
app/           pages + API routes (App Router)
  (portal)/    authenticated member pages
  api/         auth, TalentLMS proxy, admin, board endpoints
components/    shared React components
lib/           TalentLMS client, sessions, roles, stores
config/        editable defaults (superseded by Admin Console at runtime)
data/          runtime JSON stores (dev) — gitignore for production
```

## Known pre-deployment tasks
- Replace file stores with a managed database/KV.
- Add `data/` and `.env.local` to `.gitignore`; provision env vars in host.
- Update GTM button URL and Delphi allowed origins to production domains.
- Rate-limit/monitor auth endpoints (host-level or middleware).
