import { z } from "zod";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import {
  generateDirectReply,
  generateMessageSummary,
  generateReplySuggestions,
} from "../services/aiService.js";
import { getMessageById, serializeMessage } from "../services/messageService.js";
import { ApiError } from "../utils/apiError.js";

const summarySchema = z
  .object({
    messageId: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    provider: z.string().optional(),
    sender: z.string().optional(),
    subject: z.string().optional(),
  })
  .refine((value) => Boolean(value.messageId || value.message), {
    message: "messageId or message is required",
  });

const replySchema = z
  .object({
    messageId: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    tone: z.string().default("professional"),
  })
  .refine((value) => Boolean(value.messageId || value.message), {
    message: "messageId or message is required",
  });

async function persistSummary(messageId, summary) {
  if (!isDatabaseAvailable() || !messageId) {
    return false;
  }

  try {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        aiSummary: summary.summary,
        aiCategory: summary.category,
      },
    });

    return true;
  } catch (_error) {
    // The message may live outside the database (placeholder conversation) or
    // belong to another provider. A failed persist must not fail the request.
    return false;
  }
}

export async function summarizeMessage(req, res, next) {
  try {
    const payload = summarySchema.parse(req.body);

    // Prefer the stored message so the summary can be persisted and the
    // dashboard metrics stay accurate.
    if (payload.messageId) {
      const message = await getMessageById(req.auth.sub, payload.messageId);

      if (message) {
        const summary = await generateMessageSummary(serializeMessage(message));
        const persisted = await persistSummary(message.id, summary);

        return res.json({ ...summary, persisted });
      }
    }

    // Fall back to the raw payload. Placeholder conversations and messages
    // that are not stored yet still get a useful summary, just not persisted.
    if (payload.message) {
      const summary = await generateMessageSummary({
        provider: payload.provider || "direct",
        sender: payload.sender || "Unknown sender",
        subject: payload.subject || "(No subject)",
        body: payload.message,
        snippet: payload.message.slice(0, 180),
      });

      return res.json({ ...summary, persisted: false });
    }

    throw new ApiError(404, "Message not found for AI summary.");
  } catch (error) {
    return next(error);
  }
}

export async function suggestReply(req, res, next) {
  try {
    const payload = replySchema.parse(req.body);

    if (payload.messageId) {
      const message = await getMessageById(req.auth.sub, payload.messageId);

      if (message) {
        const response = await generateReplySuggestions(
          serializeMessage(message),
          payload.tone,
        );
        const suggestions = response.suggestions || [];

        return res.json({
          reply: suggestions[0]?.body || "",
          suggestions,
        });
      }
    }

    if (payload.message) {
      const response = await generateDirectReply(payload.message, payload.tone);

      return res.json({
        reply: response.reply || "",
        suggestions: response.suggestions || [],
      });
    }

    throw new ApiError(404, "Message not found for AI reply.");
  } catch (error) {
    return next(error);
  }
}
