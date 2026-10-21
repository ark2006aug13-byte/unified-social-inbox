import { google } from "googleapis";
import { PROVIDERS } from "../constants/providers.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import { encryptSecret, tryDecryptSecret } from "../utils/crypto.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";
import { buildAuthorizedOAuthClient } from "./oauthService.js";
import { emitToUser } from "./socketService.js";

const gmailTokenStore = new Map();

/**
 * Minimum interval between two automatic Gmail syncs for the same user.
 * Prevents a burst of inbox refreshes from turning into a burst of Google API
 * calls (and keeps the OAuth token well inside its rate limits).
 */
const AUTO_SYNC_THROTTLE_MS = 60_000;
const autoSyncTimestamps = new Map();

/**
 * Short-lived cache used when the database is unavailable. Keeps repeated
 * inbox reads from re-downloading the whole mailbox.
 */
const gmailMessageCache = new Map();

const MAX_CONCURRENT_FETCHES = 5;

function shouldAutoSync(userId) {
  const now = Date.now();
  const last = autoSyncTimestamps.get(userId) || 0;

  if (now - last < AUTO_SYNC_THROTTLE_MS) {
    return false;
  }

  autoSyncTimestamps.set(userId, now);
  return true;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runner() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runner()));

  return results;
}


function normalizeSessionTokens(tokens) {
  if (!tokens || typeof tokens !== "object") {
    return null;
  }

  if (!tokens.access_token) {
    return null;
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date || undefined,
    scope: tokens.scope || "",
  };
}

function toClientMessage(message) {
  return {
    id: message.externalId || message.id,
    subject: message.subject || "(No subject)",
    sender: message.sender || "Unknown sender",
    snippet: message.snippet || "",
    body: message.body || "",
    timestamp:
      message.timestamp instanceof Date
        ? message.timestamp.toISOString()
        : message.timestamp || null,
  };
}

function decodeBase64Url(data) {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
}

function getHeader(headers = [], name) {
  return (
    headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())
      ?.value || ""
  );
}

function stripHtml(text = "") {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBody(payload) {
  if (payload?.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload?.parts || [];
  const plainPart = parts.find(
    (part) => part.mimeType === "text/plain" && part.body?.data,
  );
  if (plainPart) {
    return decodeBase64Url(plainPart.body.data);
  }

  const htmlPart = parts.find(
    (part) => part.mimeType === "text/html" && part.body?.data,
  );
  if (htmlPart) {
    return stripHtml(decodeBase64Url(htmlPart.body.data));
  }

  for (const part of parts) {
    const nested = extractBody(part);
    if (nested) {
      return nested;
    }
  }

  return "";
}

function toStoredTokenRecord(profile, tokens, existingRecord = null) {
  return {
    email: profile?.email || existingRecord?.email || "",
    accessToken: tokens.access_token || existingRecord?.accessToken || "",
    refreshToken: tokens.refresh_token || existingRecord?.refreshToken || "",
    expiryDate: tokens.expiry_date || existingRecord?.expiryDate || null,
    scopes:
      (typeof tokens.scope === "string" && tokens.scope) ||
      existingRecord?.scopes ||
      "",
  };
}

function createTransientMessageRecord(userId, mapped) {
  return {
    id: mapped.externalId,
    userId,
    provider: PROVIDERS.GMAIL,
    externalId: mapped.externalId,
    sender: mapped.sender,
    subject: mapped.subject,
    snippet: mapped.snippet,
    body: mapped.body,
    timestamp: mapped.timestamp,
    labels: mapped.labels,
    threadId: mapped.threadId,
    isRead: mapped.isRead,
    aiCategory: null,
    aiSummary: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function rememberGmailTokens(userId, profile, tokens) {
  const existingRecord = gmailTokenStore.get(userId) || null;
  const tokenRecord = toStoredTokenRecord(profile, tokens, existingRecord);

  gmailTokenStore.set(userId, tokenRecord);

  logger.info("gmail_tokens_stored", {
    userId,
    email: tokenRecord.email,
    hasAccessToken: Boolean(tokenRecord.accessToken),
    hasRefreshToken: Boolean(tokenRecord.refreshToken),
  });

  return tokenRecord;
}

async function persistGmailTokens(userId, profile, tokens) {
  if (!isDatabaseAvailable()) {
    return null;
  }

  return prisma.connectedAccount.upsert({
    where: {
      userId_provider: {
        userId,
        provider: PROVIDERS.GMAIL,
      },
    },
    create: {
      userId,
      provider: PROVIDERS.GMAIL,
      providerAccountId: profile.email || profile.id || null,
      accessToken: encryptSecret(tokens.access_token || ""),
      refreshToken: tokens.refresh_token
        ? encryptSecret(tokens.refresh_token)
        : null,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: typeof tokens.scope === "string" ? tokens.scope : "",
      status: "connected",
    },
    update: {
      providerAccountId: profile.email || profile.id || null,
      accessToken: encryptSecret(tokens.access_token || ""),
      refreshToken: tokens.refresh_token
        ? encryptSecret(tokens.refresh_token)
        : undefined,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: typeof tokens.scope === "string" ? tokens.scope : "",
      status: "connected",
    },
  });
}

export async function storeGmailTokens(userId, profile, tokens) {
  rememberGmailTokens(userId, profile, tokens);

  try {
    await persistGmailTokens(userId, profile, tokens);
  } catch (error) {
    logger.warn("gmail_token_persist_failed", {
      userId,
      email: profile?.email || "",
      details: error instanceof Error ? error.message : "Unknown token store error.",
    });
  }
}

export function hasStoredGmailTokens(userId) {
  const tokenRecord = gmailTokenStore.get(userId);
  return Boolean(tokenRecord?.accessToken);
}

async function getConnectedAccount(userId) {
  if (isDatabaseAvailable()) {
    try {
      const account = await prisma.connectedAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: PROVIDERS.GMAIL,
          },
        },
      });

      if (account) {
        const accessToken = tryDecryptSecret(account.accessToken);
        const refreshToken = account.refreshToken
          ? tryDecryptSecret(account.refreshToken)
          : "";

        if (accessToken) {
          return {
            source: "database",
            providerAccountId: account.providerAccountId || "",
            accessToken,
            refreshToken: refreshToken || "",
            expiryDate: account.expiry ? account.expiry.getTime() : null,
            scopes: account.scopes || "",
          };
        }

        logger.warn("gmail_account_token_unreadable", {
          userId,
          message: "Stored Gmail token could not be decrypted. Reconnect Gmail.",
        });
      }
    } catch (error) {
      logger.warn("gmail_account_lookup_failed", {
        userId,
        details:
          error instanceof Error
            ? error.message
            : "Unknown connected account lookup error.",
      });
    }
  }

  const memoryTokens = gmailTokenStore.get(userId);
  if (memoryTokens?.accessToken) {
    return {
      source: "memory",
      providerAccountId: memoryTokens.email || "",
      accessToken: memoryTokens.accessToken,
      refreshToken: memoryTokens.refreshToken || "",
      expiryDate: memoryTokens.expiryDate || null,
      scopes: memoryTokens.scopes || "",
    };
  }

  throw new ApiError(401, "Gmail is not connected for this account.");
}

async function updateRefreshedTokens(userId, account, tokens) {
  if (
    !tokens.access_token &&
    !tokens.refresh_token &&
    !tokens.expiry_date &&
    !tokens.scope
  ) {
    return;
  }

  rememberGmailTokens(
    userId,
    { email: account.providerAccountId || account.email || "" },
    {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope || account.scopes || "",
    },
  );

  if (!isDatabaseAvailable()) {
    return;
  }

  try {
    await prisma.connectedAccount.update({
      where: {
        userId_provider: {
          userId,
          provider: PROVIDERS.GMAIL,
        },
      },
      data: {
        accessToken: tokens.access_token
          ? encryptSecret(tokens.access_token)
          : undefined,
        refreshToken: tokens.refresh_token
          ? encryptSecret(tokens.refresh_token)
          : undefined,
        expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scopes: typeof tokens.scope === "string" ? tokens.scope : undefined,
      },
    });
  } catch (error) {
    logger.warn("gmail_refreshed_token_persist_failed", {
      userId,
      details:
        error instanceof Error
          ? error.message
          : "Unknown token refresh persistence error.",
    });
  }
}

async function getGmailClient(userId, runtime = {}) {
  const sessionTokens = normalizeSessionTokens(runtime.sessionTokens);
  const account = sessionTokens
    ? {
        source: "session",
        providerAccountId: runtime.email || "",
        accessToken: sessionTokens.access_token,
        refreshToken: sessionTokens.refresh_token || "",
        expiryDate: sessionTokens.expiry_date || null,
        scopes: sessionTokens.scope || "",
      }
    : await getConnectedAccount(userId);
  const oauth2Client = buildAuthorizedOAuthClient({
    access_token: account.accessToken,
    refresh_token: account.refreshToken || undefined,
    expiry_date: account.expiryDate || undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    await updateRefreshedTokens(userId, account, tokens);
  });

  logger.debug?.("gmail_client_created", {
    userId,
    source: account.source,
    hasAccessToken: Boolean(account.accessToken),
    hasRefreshToken: Boolean(account.refreshToken),
  });

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken || undefined,
    expiry_date: account.expiryDate || undefined,
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}

function mapGoogleMessageToRecord(message) {
  const payload = message.payload || {};
  const sender = getHeader(payload.headers, "From") || "Unknown sender";
  const subject = getHeader(payload.headers, "Subject") || "(No subject)";
  const rawBody = extractBody(payload);
  const body = rawBody || message.snippet || "";

  return {
    externalId: message.id,
    sender,
    subject,
    snippet: message.snippet || body.slice(0, 180),
    body,
    timestamp: new Date(Number(message.internalDate || Date.now())),
    labels: message.labelIds || [],
    threadId: message.threadId || null,
    isRead: !(message.labelIds || []).includes("UNREAD"),
  };
}

export async function fetchAndStoreGmailMessage(userId, externalId, runtime = {}) {
  try {
    const gmail = await getGmailClient(userId, runtime);
    const { data } = await gmail.users.messages.get({
      userId: "me",
      id: externalId,
      format: "full",
    });

    const mapped = mapGoogleMessageToRecord(data);

    logger.info("gmail_message_fetched", {
      userId,
      externalId,
      subject: mapped.subject,
    });

    if (!isDatabaseAvailable()) {
      return createTransientMessageRecord(userId, mapped);
    }

    return await prisma.message.upsert({
      where: {
        userId_provider_externalId: {
          userId,
          provider: PROVIDERS.GMAIL,
          externalId: mapped.externalId,
        },
      },
      create: {
        userId,
        provider: PROVIDERS.GMAIL,
        ...mapped,
      },
      update: mapped,
    });
  } catch (error) {
    logger.warn("gmail_message_persist_failed", {
      userId,
      externalId,
      details:
        error instanceof Error ? error.message : "Unknown Gmail message save error.",
    });

    return null;
  }
}

/**
 * Pulls the latest Gmail messages and stores them.
 *
 * `options.emit` controls whether the `messages:updated` socket event is
 * broadcast. List reads must never emit, otherwise the refresh triggered by
 * the event would trigger another sync, which would emit again - an unbounded
 * feedback loop.
 *
 * `options.skipExisting` reuses already stored messages instead of
 * re-downloading every body from Google on every sync.
 */
export async function syncGmailMessages(userId, options = {}, runtime = {}) {
  const {
    maxResults = Number(options.maxResults || 10),
    query = options.query || "",
    emit = false,
    skipExisting = true,
  } = options;

  try {
    const gmail = await getGmailClient(userId, runtime);

    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: Math.min(Number(maxResults) || 10, 100),
      q: query || undefined,
    });

    const refs = data.messages || [];
    const alreadyStored = new Set();

    if (skipExisting && isDatabaseAvailable() && refs.length > 0) {
      try {
        const existing = await prisma.message.findMany({
          where: {
            userId,
            provider: PROVIDERS.GMAIL,
            externalId: { in: refs.map((ref) => ref.id) },
          },
          select: { externalId: true },
        });

        for (const record of existing) {
          alreadyStored.add(record.externalId);
        }
      } catch (error) {
        logger.warn("gmail_existing_lookup_failed", {
          userId,
          details:
            error instanceof Error
              ? error.message
              : "Unknown existing message lookup error.",
        });
      }
    }

    const toFetch = skipExisting
      ? refs.filter((ref) => !alreadyStored.has(ref.id))
      : refs;

    const fetched = await mapWithConcurrency(
      toFetch,
      MAX_CONCURRENT_FETCHES,
      (ref) => fetchAndStoreGmailMessage(userId, ref.id, runtime),
    );

    const messages = fetched.filter(Boolean);

    logger.info("gmail_messages_fetched", {
      userId,
      listed: refs.length,
      downloaded: messages.length,
      reused: refs.length - toFetch.length,
    });

    if (emit) {
      emitToUser(userId, "messages:updated", {
        provider: "gmail",
        count: messages.length,
        total: refs.length,
      });
    }

    return messages;
  } catch (error) {
    logger.warn("gmail_sync_failed", {
      userId,
      details: error instanceof Error ? error.message : "Unknown Gmail list error.",
    });

    throw error;
  }
}

function buildGmailMessageFilter(userId, query) {
  return {
    userId,
    provider: PROVIDERS.GMAIL,
    ...(query
      ? {
          OR: [
            { sender: { contains: query, mode: "insensitive" } },
            { subject: { contains: query, mode: "insensitive" } },
            { snippet: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/**
 * Reads Gmail conversations for the unified inbox.
 *
 * The database is the source of truth. A live Gmail call only happens when a
 * search is requested, when nothing has been stored yet, or when the stored
 * data is stale - and even then it is throttled per user.
 */
export async function listStoredGmailMessages(userId, filters = {}, runtime = {}) {
  const limit = Math.min(Number(filters.limit) || 50, 100);
  const query = filters.query || "";

  if (!isDatabaseAvailable()) {
    // Without a database there is nothing to persist, so the last sync is
    // cached in memory to avoid re-downloading the whole mailbox on every
    // request.
    const cached = gmailMessageCache.get(userId);

    if (cached && !query && Date.now() - cached.fetchedAt < AUTO_SYNC_THROTTLE_MS) {
      return cached.messages.slice(0, limit);
    }

    const messages = await syncGmailMessages(
      userId,
      { maxResults: limit, query, emit: false },
      runtime,
    );

    if (!query) {
      gmailMessageCache.set(userId, { messages, fetchedAt: Date.now() });
    }

    return messages.slice(0, limit);
  }

  let stored = [];

  try {
    stored = await prisma.message.findMany({
      where: buildGmailMessageFilter(userId, query),
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    });
  } catch (error) {
    logger.warn("gmail_message_lookup_failed", {
      userId,
      details:
        error instanceof Error ? error.message : "Unknown Gmail query error.",
    });
  }

  const needsLiveSync = Boolean(query) || stored.length === 0;

  if (needsLiveSync && shouldAutoSync(userId)) {
    try {
      await syncGmailMessages(
        userId,
        { maxResults: limit, query, emit: false, skipExisting: !query },
        runtime,
      );

      stored = await prisma.message.findMany({
        where: buildGmailMessageFilter(userId, query),
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
      });
    } catch (error) {
      logger.warn("gmail_background_sync_failed", {
        userId,
        details:
          error instanceof Error
            ? error.message
            : "Unknown Gmail background sync error.",
      });
    }
  }

  return stored;
}

export function serializeGmailInboxMessages(messages = []) {
  return messages.map(toClientMessage);
}
