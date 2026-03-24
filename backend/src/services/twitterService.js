import { createMockMessage, hoursAgo, minutesAgo } from "./mockMessageFactory.js";

export async function listTwitterMessages(_userId) {
  return [
    createMockMessage({
      id: "twitter-journalist",
      platform: "twitter",
      sender: "Casey Winters",
      subject: "Press request",
      message:
        "I am writing a short piece on fast-growing inbox tools. Are you available for a quick quote this afternoon?",
      preview: "Journalist asking for a quick quote this afternoon.",
      timestamp: minutesAgo(26),
      labels: ["press"],
      aiCategory: "sales",
      aiSummary: "Reporter is requesting a quote for a fast-turn story this afternoon.",
    }),
    createMockMessage({
      id: "twitter-community",
      platform: "twitter",
      sender: "StudioSignals",
      subject: "DM from community lead",
      message:
        "Your latest thread on response workflows was excellent. Open to a Twitter Spaces partnership next week?",
      preview: "Open to a Twitter Spaces partnership next week?",
      timestamp: hoursAgo(18),
      labels: ["community"],
      aiCategory: "brand_deal",
      aiSummary: "Community lead is inviting the team to a co-hosted Twitter Spaces session.",
      conversation: [
        {
          sender: "StudioSignals",
          body:
            "Your latest thread on response workflows was excellent. Open to a Twitter Spaces partnership next week?",
          timestamp: hoursAgo(18),
          direction: "inbound",
        },
      ],
    }),
  ];
}
