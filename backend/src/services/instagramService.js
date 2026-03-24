import { createMockMessage, hoursAgo, minutesAgo } from "./mockMessageFactory.js";

export async function listInstagramMessages(_userId) {
  return [
    createMockMessage({
      id: "instagram-anna-collab",
      platform: "instagram",
      sender: "Anna Rivera",
      subject: "Spring creator partnership",
      message:
        "Hi team, I loved your latest drop. Would you be open to discussing a paid Instagram collaboration for next month?",
      preview: "Open to a paid Instagram collaboration next month?",
      timestamp: hoursAgo(2),
      labels: ["creator", "priority"],
      aiCategory: "brand_deal",
      aiSummary: "Creator outreach asking about a paid Instagram partnership for the next launch window.",
      conversation: [
        {
          sender: "Anna Rivera",
          body:
            "Hi team, I loved your latest drop. Would you be open to discussing a paid Instagram collaboration for next month?",
          timestamp: hoursAgo(2),
          direction: "inbound",
        },
        {
          sender: "Unified Social Inbox",
          body:
            "Thanks Anna, we appreciate the note. Could you share your audience demographics, past partnership examples, and your preferred timeline?",
          timestamp: minutesAgo(95),
          direction: "outbound",
        },
      ],
    }),
    createMockMessage({
      id: "instagram-support-lina",
      platform: "instagram",
      sender: "Lina Verma",
      subject: "Story mention follow-up",
      message:
        "I sent a DM yesterday about my order and wanted to check if someone can confirm the shipping update.",
      preview: "Checking on a shipping update from yesterday's DM.",
      timestamp: hoursAgo(7),
      labels: ["support"],
      aiCategory: "support",
      aiSummary: "Customer is requesting a shipping status update via Instagram DM.",
    }),
  ];
}
