import {
  countMessagesByCategory,
  countMessagesByProvider,
} from "../services/messageService.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import { listUnifiedMessages } from "../services/unifiedInboxService.js";
import { logger } from "../utils/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildActivitySeries(messages, days = 7) {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * DAY_MS);
    return {
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      total: 0,
      unread: 0,
    };
  });

  const indexByDate = new Map(buckets.map((bucket, index) => [bucket.date, index]));

  for (const message of messages) {
    const timestamp = new Date(message.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      continue;
    }

    const key = startOfDay(timestamp).toISOString().slice(0, 10);
    const index = indexByDate.get(key);

    if (index === undefined) {
      continue;
    }

    buckets[index].total += 1;
    if (!message.isRead) {
      buckets[index].unread += 1;
    }
  }

  return buckets;
}

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.auth.sub;

    const messages = await listUnifiedMessages(
      userId,
      { limit: 200 },
      {
        sessionTokens: req.session?.tokens || null,
        email: req.auth?.email || "",
      },
    );

    const [providerCounts, categoryCounts] = await Promise.all([
      countMessagesByProvider(userId),
      countMessagesByCategory(userId),
    ]);

    const providerTotals = new Map(providerCounts.map((entry) => [entry.provider, entry.count]));
    const categoryTotals = new Map(categoryCounts.map((entry) => [entry.category, entry.count]));

    for (const message of messages) {
      providerTotals.set(
        message.provider,
        (providerTotals.get(message.provider) || 0) + 1,
      );

      if (message.aiCategory) {
        categoryTotals.set(
          message.aiCategory,
          (categoryTotals.get(message.aiCategory) || 0) + 1,
        );
      }
    }

    const total = messages.length;
    const unread = messages.filter((message) => !message.isRead).length;
    const categorized = messages.filter((message) => Boolean(message.aiCategory)).length;
    const summarized = messages.filter((message) => Boolean(message.aiSummary)).length;

    const connectedAccounts = isDatabaseAvailable()
      ? await prisma.connectedAccount.findMany({ where: { userId } })
      : [];

    return res.json({
      stats: {
        total,
        unread,
        categorized,
        summarized,
        channels: providerTotals.size,
        connectedAccounts: connectedAccounts.length,
      },
      byProvider: [...providerTotals.entries()]
        .map(([provider, count]) => ({ provider, count }))
        .sort((left, right) => right.count - left.count),
      byCategory: [...categoryTotals.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((left, right) => right.count - left.count),
      activity: buildActivitySeries(messages),
      recent: messages.slice(0, 8),
    });
  } catch (error) {
    logger.warn("dashboard_stats_failed", {
      userId: req.auth?.sub,
      details: error instanceof Error ? error.message : "Unknown dashboard error.",
    });

    return next(error);
  }
}
