# Setup Guide

## 1. Create environment files

Copy the root example and fill in the values:

```bash
cp .env.example .env
```

Optional app-local files:

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

Generate strong secrets (the server refuses to boot in production without them):

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # TOKEN_ENCRYPTION_KEY
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start PostgreSQL

Local database via Docker:

```bash
docker compose up postgres -d
```

Or point `DATABASE_URL` at any existing Postgres 14+ instance. Without a
database the backend still runs, but it stores messages in memory only and
warns on the dashboard.

## 4. Apply Prisma migrations

```bash
npm run prisma:migrate
```

## 5. Start the app

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/health

## 6. Connect Google services

1. Create a Google Cloud project.
2. Enable the Gmail API.
3. Configure the OAuth consent screen.
4. Add `http://localhost:4000/auth/google/callback` as an authorized redirect
   URI. Set the same value in `GOOGLE_REDIRECT_URI`.
5. Put the client id and secret into `.env`.

## 7. Configure the AI provider (optional)

Set `OPENAI_API_KEY` in `.env`. Without it the assistant returns a
deterministic fallback so the UI can still be exercised end to end.

## 8. Test the product flow

1. Open http://localhost:3000
2. Log in with Google
3. Go to **Integrations** and connect Gmail
4. Run a sync from the **Inbox** or **Dashboard**
5. Open the **Unified Inbox**, filter by channel or category
6. Select a message and generate a summary and reply drafts

---

## Docker

```bash
cp .env.example .env
docker compose up --build
```

The compose stack starts Postgres, waits for it to become healthy, applies the
Prisma migrations and then starts the API and the web frontend.

---

## Troubleshooting

**"Refusing to start with an invalid configuration"**
The backend exits when a required variable is missing. The error lists exactly
which ones. In production this also covers `JWT_SECRET`, `SESSION_SECRET` and
`TOKEN_ENCRYPTION_KEY`.

**"Running without a database"**
`DATABASE_URL` is missing or Postgres is not reachable yet. The backend retries
the connection every 10 seconds, so it recovers on its own once the database is
up.

**The session cookie is not stored**
Cookies are marked `Secure` automatically when `FRONTEND_URL` uses HTTPS. If
you are on plain HTTP on a non-localhost host, set `SECURE_COOKIES=false`.

**The inbox is empty**
Gmail is only imported after a successful connect. Use **Sync Gmail** on the
Inbox or Dashboard page.

**Gmail says "Authentication required"**
The stored token could not be decrypted - most likely `TOKEN_ENCRYPTION_KEY`
changed. Reconnect Gmail from the Integrations page.

**The placeholders for other channels disappeared**
`DEMO_MODE` is off in production. Set `DEMO_MODE=true` to see them again.
