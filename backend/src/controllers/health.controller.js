import { isDatabaseAvailable } from "../lib/prisma.js";
import { getGoogleOAuthStatus } from "../services/oauthService.js";

export function getHealth(_req, res) {
  const oauthStatus = getGoogleOAuthStatus();

  res.json({
    status: "ok",
    oauth: oauthStatus.configured,
    database: isDatabaseAvailable(),
  });
}
