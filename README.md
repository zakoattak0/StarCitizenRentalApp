# FSX Frontier Service Exchange

A small-group beta of the Star Citizen player service exchange.

The marketplace starts without sample listings or simulated players. Listings, profiles, and deals come from the connected database. See [BETA_TESTING.md](BETA_TESTING.md) for the tester handoff and launch checks.

## Run locally

Run:

```bash
npm run build
```

The app is static, but Discord auth requires the Vercel API routes and environment variables.

## Ship exterior images

Run `npm run sync:ships` to validate the UEX vehicle catalog against Star Citizen Wiki and download local exterior images. The sync prefers the wiki's isometric ship profile; models without one use a reviewed exterior image. Special-edition mappings live in `scripts/ship-image-overrides.json`.

`public/ship-images.json` records each image's wiki page, original file, image type, content hash, and legacy names/slugs. The app resolves images through this catalog rather than UEX's generic photos. This also supports saved listings whose ship slug has changed.

Use `npm run sync:ships -- --audit-only` to inspect mappings without changing published assets, `--force` to refresh cached sources, and `--limit=3` to control request concurrency. Source pages and audit output are cached under `.cache/ship-images/`. Run `npm test` after a sync to check complete coverage and local asset integrity.

The same sync publishes `public/vehicles.json`, a full catalog for browsers where UEX is unavailable. Verified launches missing from UEX live in `scripts/vehicle-supplements.json`, with source links and scheduled release dates. The browser merges the bundled catalog, fresh UEX records and these supplements; when UEX adds a supplemented ship, name/slug aliases reconcile it to its real UEX ID. Concepts and ship modules remain excluded from the owner selector. Check release dates and specifications against the linked sources before updating supplements.

The Gatac Hyūn has a combined mining and salvage configuration. Owners can record equipped heads, mining modules, additional equipment and switching instructions together. These are owner descriptions, not a compatibility calculator: hardpoint counts and permitted attachments are deliberately not assumed while published specifications are incomplete.

## Supabase setup

Material line items store integer `qualityMin` / `qualityMax` bounds from 0–1000 and a readable `quality` label in the existing materials JSON. Both slider handles and numeric inputs share this range. Older exact values, ranges and `735+` entries are supported when editing; a full 0–1000 range accepts any quality. Player-price comparisons only use a single quality band, so broad ranges do not get a misleading comparison based only on their lower bound. No database migration is required for this control.

Existing installations need `supabase/migrations/20261116_crew_availability.sql` before deploying crew scheduling. This additive migration preserves existing postings (defaulting them to Anytime with no notice) and adds the booking dates/timezone to deals. New databases can use the complete schema below.

Crew postings support Anytime or a bounded date/time range, an IANA timezone, and rolling 0/24/48/72-hour notice. Notice is checked against the server's current time for every request, independently of when the posting was created or edited. Dates are stored as UTC instants; the chosen timezone is kept for display and editing. Search, posting previews and requests share `public/crew-availability.js`. The server validates crew requests against the current saved posting before creating a deal. During a repeated daylight-saving hour, the earlier occurrence is used and shown with its UTC offset; nonexistent local times are rejected.

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor, then add these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The API routes also support `SUPABASE_URL` and `SUPABASE_ANON_KEY` if you prefer non-public variable names for the same values.

Marketplace data is publicly readable, but all writes go through the Vercel API routes using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS — the API routes enforce the session/ownership checks instead of Postgres policies. `SUPABASE_SERVICE_ROLE_KEY` must be set for posting, editing, or deleting listings/deals to work; without it, writes fail (RLS rejects the anon key, and the service role key is required to bypass it). Never expose this key to the browser.

## Discord auth setup

Create a Discord application in the Discord Developer Portal and add this redirect URL:

```text
https://YOUR_DOMAIN/api/auth/callback
```

For local Vercel dev, also add:

```text
http://localhost:3000/api/auth/callback
```

Configure these environment variables in Vercel:

```text
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
AUTH_SECRET=
AUTH_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

`AUTH_SECRET` should be a long random value. `DATABASE_URL` is reserved for a future database adapter if the account/session layer needs one.

## RSI handle verification

RSI verification is proof-of-control for a public handle. The app generates an `FSX-` code, the user adds it to their public RSI citizen profile bio, and `/api/auth/account` (POST) fetches the public RSI profile before marking the handle verified.

## Deploy to Vercel

Import this repository into Vercel. The build command is `npm run build`.
