export const PROVIDERS = {
  GOOGLE: "GOOGLE",
  GMAIL: "GMAIL",
  INSTAGRAM: "INSTAGRAM",
  WHATSAPP: "WHATSAPP",
  FACEBOOK_MESSENGER: "FACEBOOK_MESSENGER",
  TWITTER: "TWITTER",
};

export const PROVIDER_META = {
  [PROVIDERS.GMAIL]: {
    key: "gmail",
    name: "Gmail",
    description: "Sync your inbox, summarize messages, and draft replies.",
    status: "available",
  },
  [PROVIDERS.INSTAGRAM]: {
    key: "instagram",
    name: "Instagram",
    description: "Planned support for DMs, mentions, and creator outreach.",
    status: "coming_soon",
  },
  [PROVIDERS.WHATSAPP]: {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Planned support for customer support threads and campaigns.",
    status: "coming_soon",
  },
  [PROVIDERS.FACEBOOK_MESSENGER]: {
    key: "facebook-messenger",
    name: "Facebook Messenger",
    description: "Planned support for page inbox and direct responses.",
    status: "coming_soon",
  },
  [PROVIDERS.TWITTER]: {
    key: "twitter",
    name: "Twitter",
    description: "Planned support for DMs and social engagement workflows.",
    status: "coming_soon",
  },
};
