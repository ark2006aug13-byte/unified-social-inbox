import { PROVIDERS } from "../constants/providers.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";

export function serializeMessage(message) {
  return {
    id: message.id,
    externalId: message.externalId,
    provider: String(message.provider || PROVIDERS.GMAIL).toLowerCase(),
    sender: message.sender,
    subject: message.subject,
    snippet: message.snippet,
    body: message.body,
    timestamp:
      message.timestamp instanceof Date
        ? message.timestamp.toISOString()
        : message.timestamp || null,
    labels: Array.isArray(message.labels) ? message.labels : [],
    threadId: message.threadId,
    isRead: Boolean(message.isRead),
    aiCategory: message.aiCategory ?? null,
    aiSummary: message.aiSummary ?? null,
    urgency: message.urgency ?? null,
  };
}

export function serializeConnectedAccount(account) {
  return {
    id: account.id,
    provider: String(account.provider || "").toLowerCase(),
    status: account.status,
    connectedAt: account.createdAt,
    expiry: account.expiry,
  };
}

/**
 * Looks up a single stored message for a user. Accepts either the internal
 * id or the provider's external id.
 */
export async function getMessageById(userId, messageId) {
  if (!isDatabaseAvailable() || !messageId) {
    return null;
  }

  try {
    return await prisma.message.findFirst({
      where: {
        userId,
        OR: [{ id: messageId }, { externalId: messageId }],
      },
    });
  } catch (_error) {
    return null;
  }
}

/**
 * Counts stored conversations per provider, used by the dashboard breakdown.
 */
export async function countMessagesByProvider(userId) {
  if (!isDatabaseAvailable()) {
    return [];
  }

  try {
    const grouped = await prisma.message.groupBy({
      by: ["provider"],
      where: { userId },
      _count: { _all: true },
    });

    return grouped.map((entry) => ({
      provider: String(entry.provider).toLowerCase(),
      count: entry._count._all,
    }));
  } catch (_error) {
    return [];
  }
}

/**
 * Counts stored conversations per AI category.
 */
export async function countMessagesByCategory(userId) {
  if (!isDatabaseAvailable()) {
    return [];
  }

  try {
    const grouped = await prisma.message.groupBy({
      by: ["aiCategory"],
      where: { userId, aiCategory: { not: null } },
      _count: { _all: true },
    });

    return grouped.map((entry) => ({
      category: entry.aiCategory,
      count: entry._count._all,
    }));
  } catch (_error) {
    return [];
  }
}
