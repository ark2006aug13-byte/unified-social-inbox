# Unified Social Inbox

Unified Social Inbox is a production-oriented SaaS starter for managing customer conversations from a single dashboard. Gmail is implemented first, while the backend integration registry and the frontend integration management UI are ready for Instagram, WhatsApp, Facebook Messenger, and Twitter to be added next.

## Stack

- Next.js 14 App Router
- React + TypeScript + Tailwind CSS
- Node.js + Express
- PostgreSQL + Prisma ORM
- Google OAuth2
- OpenAI API
- Socket.io
- Docker Compose

## Project Structure

```text
unified-social-inbox/
  frontend/
  backend/
  database/
  docs/
  docker-compose.yml
  .env.example
```

## Local Development

1. Copy `.env.example` to `.env` and fill in the Google and OpenAI credentials.
2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL locally or with Docker Compose, then run Prisma migrations:

```bash
npm run prisma:migrate
```

4. Start the frontend and backend together:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000` and backend runs on `http://localhost:4000`.

Optional app-level examples:

- `frontend/.env.local.example`
- `backend/.env.example`

## Docker

```bash
docker compose up --build
```

## Google Cloud Setup

- Enable the Gmail API in your Google Cloud project.
- Configure OAuth consent screen.
- Add `http://localhost:4000/auth/callback` as an authorized redirect URI.
- Request Gmail scopes only when connecting Gmail from the app.

## Example API Requests

See [backend/examples.http](./backend/examples.http) for request examples.

## Detailed Setup

See [docs/setup.md](./docs/setup.md) for the full local development flow.
