import {
  isDatabaseAvailable,
  isDatabaseConfigured,
  isDatabaseConnected,
} from "../lib/prisma.js";
import { getGoogleOAuthStatus } from "../services/oauthService.js";
import { env } from "../config/env.js";

export function getHealth(_req, res) {
  const oauthStatus = getGoogleOAuthStatus();

  res.json({
    status: "ok",
    oauth: oauthStatus.configured,
    database: isDatabaseAvailable(),
    databaseConfigured: isDatabaseConfigured(),
    databaseConnected: isDatabaseConnected(),
    demoMode: env.demoMode,
    uptime: Math.round(process.uptime()),
  });
}
