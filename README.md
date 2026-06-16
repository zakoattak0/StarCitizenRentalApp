# FSX Frontier Service Exchange

A Vercel-ready static prototype for the Star Citizen Services Exchange.

## Run locally

Run:

```bash
npm run build
```

The app is static, but Discord auth requires the Vercel API routes and environment variables.

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
DATABASE_URL=
```

`AUTH_SECRET` should be a long random value. `DATABASE_URL` is reserved for the future persistent account/listing database.

## Deploy to Vercel

Import this repository into Vercel. The build command is `npm run build`.
