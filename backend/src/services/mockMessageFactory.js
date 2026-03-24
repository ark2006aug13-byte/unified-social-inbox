function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export function createMockMessage({
  id,
  platform,
  sender,
  subject = null,
  message,
  preview,
  timestamp,
  labels = [],
  isRead = false,
  aiCategory = null,
  aiSummary = null,
  conversation = [],
}) {
  const normalizedTimestamp = toDate(timestamp);
  const normalizedConversation = (conversation.length ? conversation : [
    {
      id: `${id}-incoming`,
      sender,
      body: message,
      timestamp: normalizedTimestamp,
      direction: "inbound",
    },
  ]).map((entry, index) => ({
    id: entry.id || `${id}-${index + 1}`,
    sender: entry.sender,
    body: entry.body,
    timestamp: toDate(entry.timestamp || normalizedTimestamp),
    direction: entry.direction || "inbound",
  }));

  return {
    id,
    externalId: id,
    provider: platform,
    platform,
    sender,
    subject,
    snippet: preview || message.slice(0, 160),
    body: message,
    message,
    preview: preview || message.slice(0, 160),
    timestamp: normalizedTimestamp,
    labels,
    threadId: id,
    isRead,
    aiCategory,
    aiSummary,
    unreadCount: isRead ? 0 : 1,
    conversation: normalizedConversation,
  };
}
