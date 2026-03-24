import { PROVIDERS, PROVIDER_META } from "../constants/providers.js";
import { buildGmailConnectUrl } from "./oauthService.js";
import { syncGmailMessages } from "./gmailService.js";
import { GmailIntegration } from "./integrations/gmailIntegration.js";
import { PlaceholderIntegration } from "./integrations/placeholderIntegration.js";

const registry = new Map([
  [
    PROVIDERS.GMAIL,
    new GmailIntegration(PROVIDER_META[PROVIDERS.GMAIL], syncGmailMessages, buildGmailConnectUrl),
  ],
  [
    PROVIDERS.INSTAGRAM,
    new PlaceholderIntegration(PROVIDER_META[PROVIDERS.INSTAGRAM]),
  ],
  [
    PROVIDERS.WHATSAPP,
    new PlaceholderIntegration(PROVIDER_META[PROVIDERS.WHATSAPP]),
  ],
  [
    PROVIDERS.FACEBOOK_MESSENGER,
    new PlaceholderIntegration(PROVIDER_META[PROVIDERS.FACEBOOK_MESSENGER]),
  ],
  [
    PROVIDERS.TWITTER,
    new PlaceholderIntegration(PROVIDER_META[PROVIDERS.TWITTER]),
  ],
]);

export function getIntegration(provider) {
  return registry.get(provider);
}

export function listIntegrations() {
  return Array.from(registry.values()).map((entry) => entry.getMetadata());
}
