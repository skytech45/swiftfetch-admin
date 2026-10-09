# SwiftFetch Admin (Track A — M-A0 foundations)

Web dashboard + services control plane for the SwiftFetch desktop app
(see `docs/admin-panel.md` in the desktop repo). Next.js (App Router) +
Supabase Auth + Postgres. Deploys on Vercel.

**M-A0 scope:** email/password login, RBAC (`owner/admin/finance/support/viewer`),
immutable audit log, dashboard shell (Overview/Users/Audit). Update feed +
version control ships in M-A1; licensing in M-A2.

## 1. Supabase setup (5 min)

1. Create a project at https://supabase.com/dashboard.
2. SQL Editor → paste `supabase/migrations/0001_ma0_foundations.sql` → Run.
3. Project Settings → API → copy URL + `anon` + `service_role` keys.
4. Auth → Providers → Email ON; **Confirm email OFF** for the first owner
   (re-enable after), or invite via Auth → Users.
5. Locally: `cp .env.example .env.local` and fill the three values.

## 2. First owner

1. `npm install`, `npm run dev`, open http://localhost:3000/login.
2. Sign in once with your email (any password — this creates the auth user).
3. `node scripts/seed-owner.mjs you@example.com` → promotes to `owner`.

## 3. Deploy (Render, free)

1. Push this repo to GitHub (already at `skytech45/swiftfetch-admin`).
2. https://dashboard.render.com → New → **Blueprint** → select the repo
   (`render.yaml` wires build/start/health check automatically).
3. Service → Environment → add the same 3 values as `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Free tier sleeps after ~15 min idle (first load after sleep
   takes ~60 s); optional: a free UptimeRobot HTTP ping every 10 min
   keeps it warm.

(Vercel also works — same 3 env vars + redeploy — but needs a paid plan
for commercial use.)

## 4. Scripts

- `npm run dev` / `npm run build` / `npm run lint`
- `node scripts/seed-owner.mjs <email>` — promote first owner

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only (`lib/supabase/service.ts`
  is never imported from client components). Writes go through
  RLS + server actions that enforce `requireRoles` first.
- Audit rows are insert-only (no update/delete policy granted).
- New signups default to `viewer`; owners assign real roles in Users.
