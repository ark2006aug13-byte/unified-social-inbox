# Unified Social Inbox

A full-stack workspace that pulls every customer conversation into one place.
Gmail is live today; Instagram, WhatsApp, Messenger and Twitter sit behind the
same provider contract and are wired to go next.

- **Frontend** — Next.js 14 (App Router), Tailwind CSS, TypeScript, socket.io
- **Backend** — Express 4, Prisma 5, PostgreSQL 16
- **Integrations** — Google OAuth, Gmail API, OpenAI Responses API

---

## Highlights

| Area | What it does |
| --- | --- |
| Unified inbox | Search, filter by channel and category, and read every thread in one three-pane workspace. |
| AI copilot | Summaries with urgency, action items, and three tone-adjusted reply drafts. Summaries are persisted per message. |
| Live updates | Socket.IO pushes an event after an explicit Gmail sync; inbox reads never re-trigger a sync. |
| Provider registry | Every channel implements the same `BaseIntegration` contract, so new providers plug in without touching the UI. |
| Resilience | The backend runs with or without a database, reconnects when Postgres comes up late, and degrades gracefully on provider outages. |

---

## Quick start

```bash
cp .env.example .env          # fill in the Google + OpenAI credentials
npm install
docker compose up postgres -d # or point DATABASE_URL at your own Postgres
npm run prisma:migrate
npm run dev
```

Open http://localhost:3000 and sign in with Google.

Full walkthrough: [`docs/setup.md`](docs/setup.md).

### Docker (everything at once)

```bash
cp .env.example .env
docker compose up --build
```

Compose waits for Postgres to report healthy, then runs `prisma migrate deploy`
before the API starts. The frontend is built with the standalone Next.js output
so the runtime image stays small.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | yes | Google OAuth credentials. |
| `JWT_SECRET` / `SESSION_SECRET` | production | Session signing keys. The server refuses to boot without them in production. |
| `TOKEN_ENCRYPTION_KEY` | production | 64 hex characters (32 bytes) for AES-256-GCM token encryption. |
| `DATABASE_URL` | no | Postgres connection string. Without it the API runs in memory-only mode. |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | no | AI summaries and reply drafts. Without it the assistant returns a deterministic fallback. |
| `FRONTEND_URL` | yes | Allowed CORS origin. Also decides whether cookies get the `Secure` flag. |
| `SECURE_COOKIES` | no | Force cookies to be `Secure`. Auto-detected from an `https` `FRONTEND_URL`. |
| `DEMO_MODE` | no | Serve sample conversations for the not-yet-implemented providers. On in development, off in production. |
| `LOG_LEVEL` | no | Set to `debug` for verbose request logging. |

---

## Project layout

```
backend/
  src/
    config/env.js          validated runtime configuration
    controllers/           HTTP handlers (auth, gmail, messages, ai, dashboard, integrations)
    middleware/            auth guard, error mapping
    routes/                route tables
    services/              business logic, provider registry, AI client
    lib/prisma.js          database client with live reconnect
    utils/                 crypto, logging, typed errors
database/prisma/           schema + migrations
frontend/
  app/                     routes: /, /dashboard, /inbox, /gmail, /integrations, /ai-assistant, /settings
  components/              layout, inbox, dashboard, integrations, settings, ui primitives
  lib/                     API client, types, socket, utilities
  hooks/                   session hook
```

---

## API reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | – | Liveness plus provider/database status. |
| `GET` | `/auth/me` | optional | Current session and connected accounts. |
| `GET` | `/auth/google` | – | Start the Google OAuth flow. |
| `GET` | `/auth/google/callback` | – | OAuth callback (state is required). |
| `POST` | `/auth/logout` | – | Destroy the session and clear both cookies. |
| `GET` | `/api/messages` | yes | Unified inbox. Supports `q`, `provider`, `category`, `limit`. |
| `GET` | `/api/messages/:id` | yes | A single conversation, read from the database. |
| `GET` | `/api/dashboard` | yes | Aggregated stats, channel/category breakdowns, 7-day activity. |
| `GET` | `/api/integrations` | yes | Provider registry with connection state. |
| `GET` | `/api/gmail/connect` | yes | Redirect into the Gmail OAuth flow. |
| `GET` | `/api/gmail/messages` | yes | Stored Gmail conversations. |
| `POST` | `/api/gmail/sync` | yes | Pull the latest Gmail messages and broadcast the update. |
| `GET` | `/api/gmail/message/:id` | yes | One Gmail message, fetched and stored on demand. |
| `POST` | `/api/ai/summary` | yes | Summarise and classify a message. |
| `POST` | `/api/ai/reply` | yes | Generate reply options for a message. |

Errors always return `{ error, statusCode }` plus an optional `details` array
with per-field validation messages.

---

## Scripts

```bash
npm run dev              # backend + frontend with reload
npm run backend          # backend only
npm run frontend         # frontend only
npm run build            # production frontend build
npm run start            # production servers
npm run lint             # frontend lint
npm run prisma:generate  # regenerate the Prisma client
npm run prisma:migrate   # apply migrations
npm run prisma:deploy    # apply migrations (production)
```

---

## Security notes

- OAuth tokens are encrypted with AES-256-GCM before they are stored, and are
  never sent to the browser.
- Session cookies are `httpOnly`; `Secure` and `SameSite=None` are applied
  automatically when the frontend is served from a different site over HTTPS.
- The OAuth `state` parameter is required and verified, which blocks login CSRF.
- CORS is locked to `FRONTEND_URL` with credentials enabled.
- The server refuses to start in production when a required secret is missing.

## Production checklist

- [ ] `JWT_SECRET`, `SESSION_SECRET` and `TOKEN_ENCRYPTION_KEY` are set to
      random values. The server refuses to boot without them.
- [ ] `TOKEN_ENCRYPTION_KEY` is 64 hex characters. Changing it invalidates every
      stored provider token — users reconnect their accounts.
- [ ] `FRONTEND_URL` is the exact public origin. It drives both the CORS
      allow-list and the `Secure` / `SameSite` cookie policy.
- [ ] `DEMO_MODE=false`. It defaults to off in production.
- [ ] `DATABASE_URL` points at a real Postgres instance so the background
      reconnect loop is not needed.
- [ ] `express-session` currently uses the in-memory store. It logs a warning
      and does not survive restarts or scale past one process — swap in
      `connect-redis` (or another store) before running more than one replica.

