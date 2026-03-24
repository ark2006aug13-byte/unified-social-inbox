import { createMockMessage, hoursAgo } from "./mockMessageFactory.js";

export async function listFacebookMessages(_userId) {
  return [
    createMockMessage({
      id: "facebook-page-brand",
      platform: "facebook",
      sender: "Northwind Media",
      subject: "Cross-channel partnership",
      message:
        "We are building a seasonal co-marketing plan for lifestyle brands and would like to explore a partnership with your team.",
      preview: "Exploring a seasonal co-marketing partnership with your team.",
      timestamp: hoursAgo(14),
      labels: ["brand"],
      aiCategory: "brand_deal",
      aiSummary: "Agency is proposing a co-marketing partnership for an upcoming seasonal campaign.",
    }),
    createMockMessage({
      id: "facebook-customer-return",
      platform: "facebook",
      sender: "Monica Hill",
      subject: "Return request",
      message:
        "Hi, I tried submitting the return form from your site but the confirmation page never loaded. Can someone help?",
      preview: "Return form issue. Customer needs help completing a return.",
      timestamp: hoursAgo(22),
      labels: ["support"],
      aiCategory: "support",
      aiSummary: "Customer could not complete the return flow and needs assistance.",
    }),
  ];
}
