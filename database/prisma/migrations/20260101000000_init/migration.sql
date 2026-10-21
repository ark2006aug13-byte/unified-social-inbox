-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'GMAIL', 'INSTAGRAM', 'WHATSAPP', 'FACEBOOK_MESSENGER', 'TWITTER');
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'Type "Provider" already exists, skipping';
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerAccountId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiry" TIMESTAMP(3),
    "scopes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT,
    "snippet" TEXT,
    "body" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "labels" TEXT[],
    "threadId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "aiCategory" TEXT,
    "aiSummary" TEXT,
    "urgency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ConnectedAccount_userId_provider_key" ON "ConnectedAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Message_userId_provider_externalId_key" ON "Message"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_userId_provider_timestamp_idx" ON "Message"("userId", "provider", "timestamp" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_userId_aiCategory_idx" ON "Message"("userId", "aiCategory");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'Constraint "ConnectedAccount_userId_fkey" already exists, skipping';
END
$$;

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN RAISE NOTICE 'Constraint "Message_userId_fkey" already exists, skipping';
END
$$;
