# CLAUDE.md

Guide for future Claude Code sessions working on this repository.

## Project purpose

FSX Frontier Service Exchange — a Star Citizen player marketplace. Players rent ships, hire
crew/services, and buy/sell materials from other players, then run simple request → accept →
complete → rate deal flows. Product owner is not a software engineer: prefer simple workflows,
fewer clicks, and plain explanations of tradeoffs. See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)
for product philosophy and decisions, and [CURRENT_TASKS.md](CURRENT_TASKS.md) for live priorities.

## Architecture overview

Static single-page frontend (no framework, no bundler) + Vercel Node serverless API routes +
Supabase (Postgres via REST) for persistence + Discord OAuth for login + UEX Corp API for live
ship/commodity/location data.

- **Frontend**: `index.html` (all panels/forms/modals), `styles.css` (all styling), `app.js`
  (monolithic client: routing, state, DOM rendering, API calls, calculations). No build tooling
  transforms `app.js` — it ships as-is.
- **Backend**: `api/*.js` — one file per Vercel serverless function. `api/_supabase.js` centralizes
  Supabase REST calls and the posting-account gate. `api/auth/` handles Discord OAuth + signed
  cookie sessions + RSI handle verification.
- **Data**: `supabase/schema.sql` is the source of truth for DB shape and RLS policies.
- **Routing**: client-side, driven by `window.location.pathname` in `app.js`. `vercel.json` has
  SPA rewrites for `/ships`, `/crew`, `/materials`, `/calendar`, `/account`. `/players` and
  `/owners` work without rewrites because `scripts/build.mjs` physically copies `index.html` into
  those output directories (Vercel serves the static file directly). `/owners` has no matching
  panel in `app.js`, so it silently renders the home panel — this is leftover route history, not
  a bug to "fix" reflexively; ask before touching it.

## Important directories/files

- `index.html`, `app.js`, `styles.css` — the entire frontend.
- `api/` — Vercel serverless functions (`ship-listings.js`, `crew-listings.js`,
  `material-requests.js`, `deals.js`, `rating-stats.js`, `hangar-services.js`,
  `material-options.js`, `users.js`, `_supabase.js`, `_users.js`).
- `api/auth/` — Discord OAuth (`discord.js`, `callback.js`), session (`session.js`, `_shared.js`),
  `profile.js` (RSI verification), `logout.js`.
- `supabase/schema.sql` — DB schema + RLS policies. Edit intentionally; treat as a migration.
- `scripts/build.mjs` — copies static files + `public/` into `dist/`, stamps per-route
  `index.html` copies for SPA paths.
- `scripts/sync-ship-images.mjs` — pulls UEX vehicle data into `src/data/ships.json` and downloads
  ship photos into `public/ships/*.webp` (uses `sharp`, `p-limit`). Generated output — don't
  hand-edit `src/data/ships.json` or `public/ships/*.webp`.
- `src/models/account-models.js` — advisory JSDoc types; known to drift from real schema/runtime
  shapes, treat as a hint not a contract.
- `dist/`, `node_modules/`, `.vercel/` — generated/local, never hand-edit or commit meaningfully.
- `CHATGPT_WORK_HANDOFF.md`, `CHATGPT_WORK_PROJECT_INDEX.md`, `CHATGPT_WORK_START_PROMPT.md` —
  detailed handoff notes from a prior AI session (2026-08-17), currently **untracked** in git.
  Very thorough; still worth cross-checking against real code since it can drift.

## Setup and run commands

```bash
npm install
npm run build          # writes static site to dist/
```

Full local run with working API routes (Discord auth, Supabase, UEX proxy endpoints) requires the
Vercel CLI, which is not currently installed in this environment and is not a listed dependency:

```bash
npx vercel dev
```

Static-only preview (no working `/api/*` routes) can be served with any static file server against
`dist/`, e.g. `npx serve dist`. The frontend is written to fail gracefully when API calls 404/fail
(falls back to demo/cached data), so this is enough for UI smoke checks.

```bash
npm run sync:ships              # refresh ship metadata/images from UEX
npm run sync:ships -- --force
npm run sync:ships -- --limit=4
```

## Testing/build commands

There is no `test`, `lint`, or `typecheck` script and no test files exist. `npm run build` is the
only automated check. Validate changes by building, then manually exercising the relevant panel(s)
in a browser (see Known issues below for what needs real Supabase/Discord credentials vs. what
doesn't).

## Important conventions

- No framework, no transpiler — write plain browser JS/HTML/CSS directly in `app.js`/`index.html`.
- Client object field names and Supabase column names intentionally differ; API route files do the
  mapping. Check the relevant `api/*.js` mapper before renaming fields on either side.
- Demo/test data (`FAKE DEMO` listings, `John Doe` test player, `localStorage` key
  `fsx.testDeals`) is intentional — it keeps the marketplace populated and lets one signed-in user
  exercise two-party deal flows. Don't strip it out casually.
- Ship roles are derived from ship type and are not owner-editable.
- Rate periods are hour/day/week with fixed conversion factors (hour=1, day=24, week=168).
- Keep changes targeted; `app.js` is large and monolithic, so prefer small, well-scoped edits over
  refactors unless the user asks for one.

## Integrations/environment requirements

Configure via `.env.local` (see `.env.example`); none are currently set in this workspace.

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth login |
| `AUTH_SECRET` (or `NEXTAUTH_SECRET`) | Signs the `fsx_session` cookie |
| `AUTH_URL` (or `NEXTAUTH_URL`) | OAuth callback base URL |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_*` equivalents) | Supabase REST reads (public, RLS-gated to select-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** — all listing/deal/rating writes use this to bypass RLS (see Known issues) |
| `DATABASE_URL` | Reserved, unused today |

External services: UEX Corp API (vehicles/commodities/locations, called directly from the browser
and from `scripts/sync-ship-images.mjs`), Discord OAuth API, RSI public citizen profile pages
(handle proof-of-control), Supabase REST API, Vercel (hosting + serverless functions). This repo
is already linked to Vercel project `sc-ship-rental-app` (see `.vercel/project.json`).

Never print, commit, or hardcode real values for the variables above.

## Known issues

- **Security (fixed 2026-08-19, needs a live Supabase run)**: `supabase/schema.sql` no longer
  grants public insert/update/delete — only `select` is public now. All writes in `api/ship-
  listings.js`, `api/crew-listings.js`, `api/material-requests.js`, and `api/deals.js` go through
  `useServiceRole: true` (service role bypasses RLS), and the API layer enforces ownership via
  `requireOwnedRow()` in `api/_supabase.js` (403 if you don't own the row, 404 if it doesn't
  exist) plus server-set `owner_id`/`requester_id` (client-supplied values are ignored on write).
  **This requires `SUPABASE_SERVICE_ROLE_KEY` to actually be set** — without it, `_supabase.js`
  silently falls back to the anon key, which RLS now rejects, and every create/edit/delete/rate
  call will fail. **The updated `supabase/schema.sql` still needs to be run against the live
  Supabase project** (SQL editor, or `apply_migration` via the Supabase MCP connection) — editing
  the file alone doesn't change the deployed database.
- **npm audit**: `sharp` (used only by `scripts/sync-ship-images.mjs`, not runtime/API code) has a
  high-severity advisory on versions `<0.35.0`; current pinned version is `0.33.5`. Fixing requires
  a breaking major-version bump (`npm audit fix --force` → `sharp@0.35.3`). Not applied — flag to
  the user before upgrading since it's a major version change to a dependency, even though blast
  radius is limited to the local sync script.
- Account/profile data lives only in the signed session cookie; the `users` table + `api/users.js`
  exist but aren't the source of truth yet.
- Calendar "rentals" mode and `Generate Request` are placeholders (`bookings` array is always
  empty; button just changes label to "coming soon").
- `ratings` table is legacy/unused; `deal_ratings` + `/api/rating-stats` is the active rating path.
- `/owners` static route has no corresponding panel in `app.js` (falls through to home panel).

## Current development state

Working: static build, SPA panel routing, ship/crew/material browsing with demo-data fallback,
Supabase-backed CRUD for ship/crew/material listings (when env vars configured), Discord OAuth +
RSI verification, deal request/accept/reject/cancel/complete/rate flow, player directory
aggregation, local John Doe two-party test deal flow.

Verified in this session (2026-08-19): `npm install` succeeds (Node v24.15.0, npm 11.12.1, no
lockfile drift beyond the sharp advisory above), `npm run build` succeeds, static output smoke-
tested in-browser across `/`, `/ships`, `/players`, `/owners` with no JS runtime errors — only
expected 404s from `/api/*` calls (no serverless runtime under a plain static server). Full
API/auth/Supabase behavior was **not** exercised because no `.env.local` credentials exist in this
workspace; that requires `npx vercel dev` plus real Discord/Supabase secrets.

Recent commit history focus: player directory, deal ratings, local two-party test deal flow,
mobile layout polish, footer/legal content, account syncing into the player directory. Repo is on
`main`, clean except for the three untracked `CHATGPT_WORK_*.md` handoff files, and fully in sync
with `origin/main`.

## Next planned work

Per `CURRENT_TASKS.md` and repository history, the natural next phase is production hardening and
finishing partially-built workflows, roughly in this order:

1. ~~Lock down Supabase RLS + add ownership checks to listing/deal PATCH/DELETE routes.~~ Done in
   code 2026-08-19 — still needs the updated `supabase/schema.sql` applied to the live database
   and `SUPABASE_SERVICE_ROLE_KEY` confirmed set in Vercel before deploying.
2. Persist Discord/RSI profiles into the `users` table instead of only the session cookie.
3. Build the real scheduling/reservation system (`rental_availability` table exists but isn't
   wired up) and replace the calendar's placeholder request builder.
4. Add edit/pause controls for crew and material listings (ship listings already have them).
5. Add at least basic smoke tests for API route validation and core frontend flows.
