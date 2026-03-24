import { createMockMessage, hoursAgo, minutesAgo } from "./mockMessageFactory.js";

export async function listWhatsAppMessages(_userId) {
  return [
    createMockMessage({
      id: "whatsapp-vendor-ops",
      platform: "whatsapp",
      sender: "Apex Fulfillment",
      subject: "Shipment confirmation",
      message:
        "Morning team, pallet 42 is leaving the warehouse today at 3 PM. Please confirm delivery contact details on your side.",
      preview: "Pallet 42 leaves today at 3 PM. Please confirm delivery contact details.",
      timestamp: minutesAgo(48),
      labels: ["operations"],
      aiCategory: "operations",
      aiSummary: "Logistics vendor is confirming shipment timing and requesting delivery details.",
      conversation: [
        {
          sender: "Apex Fulfillment",
          body:
            "Morning team, pallet 42 is leaving the warehouse today at 3 PM. Please confirm delivery contact details on your side.",
          timestamp: minutesAgo(48),
          direction: "inbound",
        },
        {
          sender: "Unified Social Inbox",
          body: "Confirmed. Please use the warehouse receiving desk and call 555-0192 on arrival.",
          timestamp: minutesAgo(31),
          direction: "outbound",
        },
      ],
    }),
    createMockMessage({
      id: "whatsapp-vip-customer",
      platform: "whatsapp",
      sender: "Rohan Kapoor",
      subject: "Restock request",
      message:
        "Do you know when the charcoal set will be back? I want to place a bulk order for our studio next week.",
      preview: "Looking for a charcoal set restock before a bulk studio order.",
      timestamp: hoursAgo(10),
      labels: ["sales"],
      aiCategory: "sales",
      aiSummary: "Potential bulk buyer asking about restock timing before placing a larger order.",
    }),
  ];
}
