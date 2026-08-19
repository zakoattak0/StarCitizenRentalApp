# FSX Frontier Service Exchange

A Vercel-ready static prototype for the Star Citizen Services Exchange.

## Run locally

Run:

```bash
npm run build
```

The app is static, but Discord auth requires the Vercel API routes and environment variables.

## Supabase setup

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
