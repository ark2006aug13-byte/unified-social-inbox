import { z } from "zod";
import {
  fetchAndStoreGmailMessage,
  serializeGmailInboxMessages,
  syncGmailMessages,
} from "../services/gmailService.js";
import { buildGmailConnectUrl } from "../services/oauthService.js";
import { getMessageById, serializeMessage } from "../services/messageService.js";

const syncSchema = z.object({
  maxResults: z.number().int().positive().max(50).optional(),
  query: z.string().optional(),
});

function getGmailRuntime(req) {
  return {
    sessionTokens: req.session?.tokens || null,
    email: req.auth?.email || req.session?.user?.email || "",
  };
}

export async function connectGmail(req, res) {
  res.redirect(buildGmailConnectUrl(req.auth.sub));
}

export async function getGmailMessages(req, res, next) {
  try {
    const userId = req.auth?.sub || req.session?.gmailUserId;

    if (!req.session?.tokens || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log("[gmail-api] /api/gmail/messages tokens", {
      userId,
      hasAccessToken: Boolean(req.session.tokens?.access_token),
      hasRefreshToken: Boolean(req.session.tokens?.refresh_token),
    });

    const messages = await syncGmailMessages(
      userId,
      {
        maxResults: Number(req.query.limit || 10),
        query: req.query.q?.toString() || "",
      },
      getGmailRuntime(req),
    );

    return res.json(serializeGmailInboxMessages(messages));
  } catch (error) {
    console.error("[gmail-api] /api/gmail/messages failed", {
      error: error instanceof Error ? error.message : "Unknown Gmail API error.",
    });
    return next(error);
  }
}

export async function syncGmail(req, res, next) {
  try {
    if (!req.session?.tokens && !req.auth?.sub) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = syncSchema.parse({
      maxResults: req.body.maxResults ? Number(req.body.maxResults) : undefined,
      query: req.body.query,
    });

    const messages = await syncGmailMessages(req.auth.sub, payload, getGmailRuntime(req));

    return res.json({
      synced: messages.length,
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getGmailMessage(req, res, next) {
  try {
    if (!req.session?.tokens && !req.auth?.sub) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = req.params.id;
    let message = await getMessageById(req.auth.sub, id);

    if (!message) {
      message = await fetchAndStoreGmailMessage(req.auth.sub, id, getGmailRuntime(req));
    }

    return res.json({
      message: serializeMessage(message),
    });
  } catch (error) {
    return next(error);
  }
}
