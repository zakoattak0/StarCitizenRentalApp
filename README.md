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

Current persistence uses temporary public insert/update/delete policies because Supabase auth is not wired to Discord yet. Tighten those policies when account ownership is connected to Supabase identities.

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

## Deploy to Vercel

Import this repository into Vercel. The build command is `npm run build`.
