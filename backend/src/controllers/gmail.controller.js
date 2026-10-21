import { z } from "zod";
import { PROVIDERS } from "../constants/providers.js";
import { getIntegration } from "../services/integrationRegistry.js";
import {
  fetchAndStoreGmailMessage,
  listStoredGmailMessages,
  serializeGmailInboxMessages,
} from "../services/gmailService.js";
import { getMessageById, serializeMessage } from "../services/messageService.js";
import { ApiError } from "../utils/apiError.js";

const syncSchema = z.object({
  maxResults: z.coerce.number().int().positive().max(50).optional(),
  query: z.string().max(500).optional(),
});

function getGmailRuntime(req) {
  return {
    sessionTokens: req.session?.tokens || null,
    email: req.auth?.email || req.session?.user?.email || "",
  };
}

function getGmailIntegration() {
  const integration = getIntegration(PROVIDERS.GMAIL);

  if (!integration) {
    throw new ApiError(503, "The Gmail integration is not available.");
  }

  return integration;
}

export async function connectGmail(req, res, next) {
  try {
    const integration = getGmailIntegration();
    const url = await integration.getConnectionUrl(req.auth.sub);

    return res.redirect(url);
  } catch (error) {
    return next(error);
  }
}

export async function getGmailMessages(req, res, next) {
  try {
    const userId = req.auth?.sub || req.session?.gmailUserId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const query = req.query.q?.toString() || "";

    const messages = await listStoredGmailMessages(
      userId,
      { limit, query },
      getGmailRuntime(req),
    );

    return res.json(serializeGmailInboxMessages(messages));
  } catch (error) {
    return next(error);
  }
}

export async function syncGmail(req, res, next) {
  try {
    const userId = req.auth?.sub || req.session?.gmailUserId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = syncSchema.parse(req.body || {});
    const integration = getGmailIntegration();

    const messages = await integration.syncMessages(userId, {
      maxResults: payload.maxResults || 25,
      query: payload.query || "",
      emit: true,
      skipExisting: false,
    });

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
    const userId = req.auth?.sub || req.session?.gmailUserId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const id = req.params.id;
    let message = await getMessageById(userId, id);

    if (!message) {
      message = await fetchAndStoreGmailMessage(userId, id, getGmailRuntime(req));
    }

    if (!message) {
      throw new ApiError(404, "Message not found.");
    }

    return res.json({
      message: serializeMessage(message),
    });
  } catch (error) {
    return next(error);
  }
}
