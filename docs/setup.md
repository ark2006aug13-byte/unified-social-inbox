# Setup Guide

## 1. Create environment files

Copy the root example for shared local development:

```bash
cp .env.example .env
```

Optional app-local files:

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
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

## 4. Apply Prisma migrations

```bash
npm run prisma:migrate
```

## 5. Start the app

```bash
npm run dev
```

## 6. Connect Google services

- Create a Google Cloud project.
- Enable the Gmail API.
- Configure the OAuth consent screen.
- Add `http://localhost:4000/auth/callback` as an authorized redirect URI.
- Put the resulting Google credentials into `.env`.

## 7. Test the product flow

1. Open `http://localhost:3000`
2. Log in with Google
3. Go to Integrations and connect Gmail
4. Sync Gmail messages
5. Open Inbox or Gmail pages
6. Generate AI summaries and reply suggestions
