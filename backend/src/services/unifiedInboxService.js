import { listStoredGmailMessages } from "./gmailService.js";
import { listFacebookMessages } from "./facebookService.js";
import { listInstagramMessages } from "./instagramService.js";
import { logger } from "../utils/logger.js";
import { listTwitterMessages } from "./twitterService.js";
import { listWhatsAppMessages } from "./whatsappService.js";
import { env } from "../config/env.js";
import { getMessageById } from "./messageService.js";

/**
 * Maps a provider filter onto the canonical lowercase provider key.
 * Returns `null` when no provider filter is applied - an empty string must
 * never fall back to a specific provider, otherwise "all channels" silently
 * becomes "gmail only".
 */
export function normalizeProvider(provider) {
  const value = String(provider || "").trim().toLowerCase();

  if (!value || value === "all") {
    return null;
  }

  if (value === "facebook_messenger" || value === "facebook-messenger") {
    return "facebook";
  }

  if (value === "gmail" || value === "google") {
    return "gmail";
  }

  if (value === "instagram") {
    return "instagram";
  }

  if (value === "whatsapp") {
    return "whatsapp";
  }

  if (value === "twitter" || value === "x") {
    return "twitter";
  }

  return value;
}

function normalizeTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeConversation(message, timestamp) {
  if (Array.isArray(message.conversation) && message.conversation.length > 0) {
    return message.conversation.map((entry, index) => ({
      id: entry.id || `${message.id || message.externalId}-${index + 1}`,
      sender: entry.sender || message.sender || "Unknown sender",
      body: entry.body || message.body || message.message || message.snippet || "",
      timestamp: normalizeTimestamp(entry.timestamp || timestamp),
      direction: entry.direction || "inbound",
    }));
  }

  return [
    {
      id: `${message.externalId || message.id}-incoming`,
      sender: message.sender || "Unknown sender",
      body: message.body || message.message || message.snippet || "",
      timestamp,
      direction: "inbound",
    },
  ];
}

function normalizeMessage(message) {
  const timestamp = normalizeTimestamp(message.timestamp);
  const provider = normalizeProvider(message.provider || message.platform) || "gmail";
  const body = message.body || message.message || message.snippet || "";
  const externalId = message.externalId || message.id;

  return {
    id: externalId,
    externalId,
    provider,
    platform: provider,
    sender: message.sender || "Unknown sender",
    subject: message.subject || null,
    snippet: message.snippet || message.preview || body.slice(0, 180),
    body,
    message: body,
    preview: message.preview || message.snippet || body.slice(0, 180),
    timestamp,
    labels: Array.isArray(message.labels) ? message.labels : [],
    threadId: message.threadId || externalId,
    isRead: Boolean(message.isRead),
    aiCategory: message.aiCategory || null,
    aiSummary: message.aiSummary || null,
    urgency: message.urgency || null,
    unreadCount:
      typeof message.unreadCount === "number" ? message.unreadCount : message.isRead ? 0 : 1,
    conversation: normalizeConversation(message, timestamp),
  };
}

function filterMessages(messages, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const provider = normalizeProvider(filters.provider);
  const category = String(filters.category || "").trim().toLowerCase();

  return messages.filter((message) => {
    if (provider && message.provider !== provider) {
      return false;
    }

    if (category && category !== "all" && String(message.aiCategory || "").toLowerCase() !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      message.sender,
      message.subject,
      message.snippet,
      message.body,
      message.provider,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

/**
 * Placeholder conversations for the providers that are not implemented yet.
 * They are only served when demo mode is explicitly enabled so production
 * tenants never see fabricated conversations.
 */
async function listPlaceholderMessages() {
  if (!env.demoMode) {
    return [];
  }

  const [instagramMessages, whatsappMessages, facebookMessages, twitterMessages] =
    await Promise.all([
      listInstagramMessages(),
      listWhatsAppMessages(),
      listFacebookMessages(),
      listTwitterMessages(),
    ]);

  return [
    ...instagramMessages,
    ...whatsappMessages,
    ...facebookMessages,
    ...twitterMessages,
  ];
}

export async function listUnifiedMessages(userId, filters = {}, runtime = {}) {
  const limit = Math.min(Number(filters.limit) || 50, 200);
  const providerFilter = normalizeProvider(filters.provider);
  const query = filters.query || "";

  const sources = [];

  const shouldLoadGmail = !providerFilter || providerFilter === "gmail";

  if (shouldLoadGmail) {
    try {
      const gmailMessages = await listStoredGmailMessages(
        userId,
        { limit, query },
        runtime,
      );
      sources.push(gmailMessages.map(normalizeMessage));
    } catch (error) {
      logger.warn("unified_inbox_gmail_unavailable", {
        userId,
        details: error instanceof Error ? error.message : "Unknown Gmail inbox error.",
      });
    }
  }

  if (!providerFilter || providerFilter !== "gmail") {
    try {
      const placeholderMessages = await listPlaceholderMessages();
      const filtered = providerFilter
        ? placeholderMessages.filter(
            (message) => normalizeProvider(message.provider) === providerFilter,
          )
        : placeholderMessages;
      sources.push(filtered.map(normalizeMessage));
    } catch (error) {
      logger.warn("unified_inbox_placeholder_unavailable", {
        userId,
        details:
          error instanceof Error
            ? error.message
            : "Unknown placeholder inbox error.",
      });
    }
  }

  const combined = filterMessages(sources.flat(), filters).sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

  return combined.slice(0, limit);
}

/**
 * Reads a single conversation. Uses the stored message first so opening a
 * message does not trigger a full mailbox sync.
 */
export async function getUnifiedMessageById(userId, messageId, runtime = {}) {
  const stored = await getMessageById(userId, messageId);

  if (stored) {
    return normalizeMessage(stored);
  }

  const messages = await listUnifiedMessages(
    userId,
    { limit: 100 },
    runtime,
  );

  return (
    messages.find(
      (message) =>
        message.id === messageId ||
        message.externalId === messageId ||
        message.threadId === messageId,
    ) || null
  );
}
