import { PROVIDERS } from "../constants/providers.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";

const providerLookup = {
  gmail: PROVIDERS.GMAIL,
  instagram: PROVIDERS.INSTAGRAM,
  whatsapp: PROVIDERS.WHATSAPP,
  "facebook-messenger": PROVIDERS.FACEBOOK_MESSENGER,
  facebook_messenger: PROVIDERS.FACEBOOK_MESSENGER,
  twitter: PROVIDERS.TWITTER,
};

export function normalizeProvider(provider) {
  if (!provider) {
    return null;
  }

  return providerLookup[provider.toLowerCase()] || null;
}

export function serializeMessage(message) {
  return {
    id: message.id,
    externalId: message.externalId,
    provider: message.provider.toLowerCase(),
    sender: message.sender,
    subject: message.subject,
    snippet: message.snippet,
    body: message.body,
    timestamp: message.timestamp,
    labels: message.labels,
    threadId: message.threadId,
    isRead: message.isRead,
    aiCategory: message.aiCategory,
    aiSummary: message.aiSummary,
  };
}

export function serializeConnectedAccount(account) {
  return {
    id: account.id,
    provider: account.provider.toLowerCase(),
    status: account.status,
    connectedAt: account.createdAt,
    expiry: account.expiry,
  };
}

export async function listMessages(userId, filters = {}) {
  if (!isDatabaseAvailable()) {
    return [];
  }

  const where = {
    userId,
  };

  const provider = normalizeProvider(filters.provider);
  if (provider) {
    where.provider = provider;
  }

  if (filters.category) {
    where.aiCategory = filters.category;
  }

  if (filters.query) {
    where.OR = [
      { sender: { contains: filters.query, mode: "insensitive" } },
      { subject: { contains: filters.query, mode: "insensitive" } },
      { snippet: { contains: filters.query, mode: "insensitive" } },
      { body: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  return prisma.message.findMany({
    where,
    take: Number(filters.limit || 50),
    orderBy: {
      timestamp: "desc",
    },
  });
}

export async function getMessageById(userId, messageId) {
  if (!isDatabaseAvailable()) {
    return null;
  }

  return prisma.message.findFirst({
    where: {
      userId,
      OR: [{ id: messageId }, { externalId: messageId }],
    },
  });
}
