import { isDatabaseAvailable, prisma } from "../lib/prisma.js";
import { listIntegrations } from "../services/integrationRegistry.js";
import { env } from "../config/env.js";

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
      const connected = byProvider.get(integration.provider);

      return {
        key: integration.key,
        name: integration.name,
        description: integration.description,
        status: integration.status,
        connected: Boolean(connected),
        connectedAt: connected?.createdAt || null,
        expiresAt: connected?.expiry || null,
      };
    });

    return res.json({
      integrations,
      demoMode: env.demoMode,
    });
  } catch (error) {
    return next(error);
  }
}
