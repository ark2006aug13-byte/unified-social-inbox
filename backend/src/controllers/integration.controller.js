import { PROVIDERS } from "../constants/providers.js";
import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import { listIntegrations } from "../services/integrationRegistry.js";

const keyToProvider = {
  gmail: PROVIDERS.GMAIL,
  instagram: PROVIDERS.INSTAGRAM,
  whatsapp: PROVIDERS.WHATSAPP,
  "facebook-messenger": PROVIDERS.FACEBOOK_MESSENGER,
  twitter: PROVIDERS.TWITTER,
};

export async function getIntegrationStatus(req, res, next) {
  try {
    const accounts = isDatabaseAvailable()
      ? await prisma.connectedAccount.findMany({
          where: {
            userId: req.auth.sub,
          },
        })
      : [];

    const byProvider = new Map(accounts.map((account) => [account.provider, account]));
    const integrations = listIntegrations().map((integration) => {
      const provider = keyToProvider[integration.key];
      const connected = provider ? byProvider.get(provider) : null;

      return {
        ...integration,
        connected: Boolean(connected),
        connectedAt: connected?.createdAt || null,
      };
    });

    return res.json({ integrations });
  } catch (error) {
    return next(error);
  }
}
