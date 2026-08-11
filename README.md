# Chris Collins Inc — LMS Portal (Phase 1)

Custom front-end on top of TalentLMS. Your site owns landing, login, and dashboard;
TalentLMS is only entered for the course player (chrome hidden, returns here on completion).

## The Phase-1 flow this validates

```
/login  →  POST /api/auth/login  →  TalentLMS /v1/userlogin (validates creds)
        →  signed session cookie →  /dashboard (courses + progress + certs
                                     from /v1/users/id:{id})
"Start" →  GET /api/course/:id/launch  →  /v1/gotocourse (one-time URL,
           header hidden, completion redirect)  →  TalentLMS course player
        →  on completion, back to /dashboard?completed=:id
```

## Setup

1. `npm install`
2. `cp .env.example .env.local` and fill in:
   - `TALENTLMS_DOMAIN` — your subdomain (the `X` in `X.talentlms.com`)
   - `TALENTLMS_API_KEY` — super-admin key (Account & Settings → Basic settings → API)
   - `SESSION_SECRET` — `openssl rand -base64 32`
   - `PORTAL_URL` — `http://localhost:3000` for dev
3. `npm run dev` → http://localhost:3000
4. Log in with any real TalentLMS learner's username/password. Launch a course. Finish a unit.
   Watch it bounce back to your dashboard.

**No TalentLMS handy?** Set `TALENTLMS_MOCK=true` and log in with `demo` / `demo` to click
through the entire flow with fake data.

## Deploy (Vercel)

`vercel` from this directory (or push to GitHub → import in Vercel). Add the same four env
vars in Project Settings. Set `PORTAL_URL` to your production URL.

## Security notes

- The TalentLMS API key lives only in server env vars; every TalentLMS call happens in
  API routes / server components. Nothing TalentLMS-related ships to the browser.
- Portal sessions are 12h signed JWTs in an httpOnly cookie; middleware guards
  `/dashboard` and `/api/course/*`.
- `login_key` / `goto_url` are single-use — fetched fresh per login/launch, never stored.

## Structure

```
lib/talentlms.ts        TalentLMS API client (+ mock mode)
lib/session.ts          JWT cookie sessions
middleware.ts           Route protection
app/page.tsx            Landing page
app/login/page.tsx      Login form
app/dashboard/page.tsx  Courses, progress, certificates
app/api/auth/login      Credential validation → session
app/api/auth/logout     Session teardown
app/api/course/[id]/launch   gotocourse redirect
```

## Next (Phase 2+)

Catalog pages from `/v1/courses` + `/v1/categories` with server-side caching; Stripe
checkout + webhook provisioning (`usersignup` → `addusertogroup`); CEO-LLM iframe page;
TalentLMS theming so the course player matches this design; custom domain mapping.
