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

export async function summarizeMessage(req, res, next) {
  try {
    const payload = summarySchema.parse(req.body);

    if (payload.message) {
      const summary = await generateMessageSummary({
        provider: payload.provider || "direct",
        sender: payload.sender || "Unknown sender",
        subject: payload.subject || "(No subject)",
        body: payload.message,
        snippet: payload.message.slice(0, 180),
      });

      return res.json(summary);
    }

    const message = await getMessageById(req.auth.sub, payload.messageId);

    if (!message) {
      throw new ApiError(404, "Message not found for AI summary.");
    }

    const summary = await generateMessageSummary(serializeMessage(message));

    if (isDatabaseAvailable() && message.id) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          aiSummary: summary.summary,
          aiCategory: summary.category,
        },
      });
    }

    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}

export async function suggestReply(req, res, next) {
  try {
    const payload = replySchema.parse(req.body);

    if (payload.message) {
      const response = await generateDirectReply(payload.message, payload.tone);
      return res.json(response);
    }

    const message = await getMessageById(req.auth.sub, payload.messageId);

    if (!message) {
      throw new ApiError(404, "Message not found for AI reply.");
    }

    const response = await generateReplySuggestions(serializeMessage(message), payload.tone);
    return res.json({
      reply: response.suggestions[0]?.body || "",
      suggestions: response.suggestions,
    });
  } catch (error) {
    return next(error);
  }
}
