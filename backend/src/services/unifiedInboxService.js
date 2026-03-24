import { syncGmailMessages } from "./gmailService.js";
import { listFacebookMessages } from "./facebookService.js";
import { listInstagramMessages } from "./instagramService.js";
import { logger } from "../utils/logger.js";
import { listTwitterMessages } from "./twitterService.js";
import { listWhatsAppMessages } from "./whatsappService.js";

function normalizeProvider(provider) {
  const value = String(provider || "").toLowerCase();

  if (value === "facebook_messenger" || value === "facebook-messenger") {
    return "facebook";
  }

  return value || "gmail";
}

function normalizeTimestamp(value) {
  if (!value) {
    return new Date().toISOString();
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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
  const provider = normalizeProvider(message.provider || message.platform);
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
    unreadCount:
      typeof message.unreadCount === "number" ? message.unreadCount : message.isRead ? 0 : 1,
    conversation: normalizeConversation(message, timestamp),
  };
}

function filterMessages(messages, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const provider = normalizeProvider(filters.provider || "");
  const category = String(filters.category || "").trim().toLowerCase();

  return messages.filter((message) => {
    if (provider && provider !== "all" && message.provider !== provider) {
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

export async function listUnifiedMessages(userId, filters = {}, runtime = {}) {
  const sources = [];

  try {
    const gmailMessages = await syncGmailMessages(
      userId,
      {
        maxResults: Number(filters.limit || 10),
        query: filters.query || "",
      },
      runtime,
    );
    sources.push(gmailMessages.map(normalizeMessage));
  } catch (error) {
    logger.warn("unified_inbox_gmail_unavailable", {
      userId,
      details: error instanceof Error ? error.message : "Unknown Gmail inbox error.",
    });
  }

  const [instagramMessages, whatsappMessages, facebookMessages, twitterMessages] = await Promise.all([
    listInstagramMessages(userId),
    listWhatsAppMessages(userId),
    listFacebookMessages(userId),
    listTwitterMessages(userId),
  ]);

  sources.push(
    instagramMessages.map(normalizeMessage),
    whatsappMessages.map(normalizeMessage),
    facebookMessages.map(normalizeMessage),
    twitterMessages.map(normalizeMessage),
  );

  const combined = filterMessages(sources.flat(), filters).sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );

  return combined.slice(0, Number(filters.limit || 50));
}

export async function getUnifiedMessageById(userId, messageId, runtime = {}) {
  const messages = await listUnifiedMessages(
    userId,
    {
      limit: 100,
    },
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
