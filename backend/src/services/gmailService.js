import { google } from "googleapis";
import { PROVIDERS } from "../constants/providers.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import { decryptSecret, encryptSecret } from "../utils/crypto.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";
import { buildAuthorizedOAuthClient } from "./oauthService.js";
import { emitToUser } from "./socketService.js";

const gmailTokenStore = new Map();

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

  console.log("[gmail] stored oauth token", {
    userId,
    email: tokenRecord.email,
    hasAccessToken: Boolean(tokenRecord.accessToken),
    hasRefreshToken: Boolean(tokenRecord.refreshToken),
  });

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
        return {
          source: "database",
          providerAccountId: account.providerAccountId || "",
          accessToken: decryptSecret(account.accessToken),
          refreshToken: account.refreshToken
            ? decryptSecret(account.refreshToken)
            : "",
          expiryDate: account.expiry ? account.expiry.getTime() : null,
          scopes: account.scopes || "",
        };
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

  throw new ApiError(401, "Authentication required");
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

  console.log("[gmail] creating Gmail client", {
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

    console.log("[gmail] gmail.users.messages.get response", {
      userId,
      id: externalId,
      subject: mapped.subject,
      sender: mapped.sender,
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
    console.error("[gmail] fetchAndStoreGmailMessage failed", {
      userId,
      externalId,
      error: error instanceof Error ? error.message : "Unknown Gmail get error.",
    });

    logger.warn("gmail_message_persist_failed", {
      userId,
      externalId,
      details:
          error instanceof Error ? error.message : "Unknown Gmail message save error.",
    });

    return null;
  }
}

export async function syncGmailMessages(userId, options = {}, runtime = {}) {
  try {
    const gmail = await getGmailClient(userId, runtime);

    console.log("[gmail] fetching messages", {
      userId,
      maxResults: Number(options.maxResults || 10),
      query: options.query || "",
      hasSessionTokens: Boolean(runtime.sessionTokens?.access_token),
    });

    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: Number(options.maxResults || 10),
      q: options.query || undefined,
    });

    const refs = data.messages || [];

    console.log("[gmail] gmail.users.messages.list response", {
      userId,
      count: refs.length,
      ids: refs.map((message) => message.id),
    });

    const messages = [];

    for (const ref of refs) {
      const stored = await fetchAndStoreGmailMessage(userId, ref.id, runtime);
      if (stored) {
        messages.push(stored);
      }
    }

    console.log("[gmail] fetched messages", {
      userId,
      count: messages.length,
      sample: messages[0] ? toClientMessage(messages[0]) : null,
    });

    logger.info("gmail_messages_fetched", {
      userId,
      count: messages.length,
    });

    emitToUser(userId, "messages:updated", {
      provider: "gmail",
      count: messages.length,
    });

    return messages;
  } catch (error) {
    console.error("[gmail] syncGmailMessages failed", {
      userId,
      error: error instanceof Error ? error.message : "Unknown Gmail list error.",
    });
    throw error;
  }
}

export async function listStoredGmailMessages(userId, filters = {}, runtime = {}) {
  if (!isDatabaseAvailable()) {
    return syncGmailMessages(userId, {
      maxResults: Number(filters.limit || 10),
      query: filters.query || "",
    }, runtime);
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        userId,
        provider: PROVIDERS.GMAIL,
        ...(filters.query
          ? {
              OR: [
                {
                  sender: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  subject: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  snippet: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  body: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        timestamp: "desc",
      },
      take: Number(filters.limit || 50),
    });

    if (messages.length > 0) {
      return messages;
    }
  } catch (error) {
    logger.warn("gmail_message_lookup_failed", {
      userId,
      details:
        error instanceof Error ? error.message : "Unknown Gmail query error.",
    });
  }

  return syncGmailMessages(userId, {
    maxResults: Number(filters.limit || 10),
    query: filters.query || "",
  }, runtime);
}

export function serializeGmailInboxMessages(messages = []) {
  return messages.map(toClientMessage);
}
