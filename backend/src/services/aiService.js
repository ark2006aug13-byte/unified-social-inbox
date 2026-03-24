import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function getClient() {
  if (!env.openAiApiKey) {
    return null;
  }

  return new OpenAI({
    apiKey: env.openAiApiKey,
  });
}

function formatMessagePrompt(message) {
  return `Provider: ${message.provider}
Sender: ${message.sender}
Subject: ${message.subject || "(No subject)"}
Body:
${message.body}`;
}

function buildFallbackReply(message, tone = "professional") {
  const introByTone = {
    professional: "Thanks for reaching out.",
    friendly: "Thanks so much for the note.",
    confident: "Thanks for the update.",
  };

  return `${introByTone[tone] || introByTone.professional} We have received your message and will follow up shortly with the right next steps.`;
}

export async function generateMessageSummary(message) {
  const client = getClient();
  if (!client) {
    return {
      summary: message.snippet || message.body.slice(0, 180),
      category: "other",
      urgency: "medium",
      actionItems: [],
    };
  }

  const response = await client.responses.create({
    model: env.openAiModel,
    store: false,
    instructions:
      "You are an inbox copilot. Summarize incoming business messages and classify them for a unified support dashboard.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Summarize and categorize this message.\n\n${formatMessagePrompt(message)}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "message_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            category: {
              type: "string",
              enum: ["brand_deal", "support", "sales", "operations", "personal", "other"],
            },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            actionItems: {
              type: "array",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
          required: ["summary", "category", "urgency", "actionItems"],
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

export async function generateReplySuggestions(message, tone = "professional") {
  const client = getClient();
  if (!client) {
    const reply = buildFallbackReply(message, tone);
    return {
      suggestions: [
        { title: "Primary reply", body: reply },
        { title: "Short follow-up", body: reply },
        { title: "Warmer version", body: buildFallbackReply(message, "friendly") },
      ],
    };
  }

  const response = await client.responses.create({
    model: env.openAiModel,
    store: false,
    instructions:
      "You are an executive inbox copilot. Write concise, human, high-quality email responses.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Create three reply suggestions in a ${tone} tone for this message.\n\n${formatMessagePrompt(
              message,
            )}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "reply_suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                },
                additionalProperties: false,
                required: ["title", "body"],
              },
            },
          },
          additionalProperties: false,
          required: ["suggestions"],
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

export async function generateDirectReply(message, tone = "professional") {
  const client = getClient();

  if (!client) {
    return {
      reply: buildFallbackReply(
        {
          provider: "direct",
          sender: "Unknown sender",
          subject: null,
          body: message,
        },
        tone,
      ),
    };
  }

  try {
    const response = await client.responses.create({
      model: env.openAiModel,
      store: false,
      instructions:
        "You are an executive inbox copilot. Draft a concise, polished reply that is ready to paste into an email or DM.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Write a ${tone} reply to this message:\n\n${message}`,
            },
          ],
        },
      ],
    });

    return {
      reply: response.output_text.trim(),
    };
  } catch (error) {
    logger.warn("ai_direct_reply_failed", {
      details: error instanceof Error ? error.message : "Unknown AI reply error.",
    });

    return {
      reply: buildFallbackReply(
        {
          provider: "direct",
          sender: "Unknown sender",
          subject: null,
          body: message,
        },
        tone,
      ),
    };
  }
}
