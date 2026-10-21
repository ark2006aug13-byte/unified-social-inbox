const REQUIRED_ENVIRONMENT_VARIABLES = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

const OPTIONAL_ENVIRONMENT_VARIABLES = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
];

const PRODUCTION_REQUIRED_ENVIRONMENT_VARIABLES = [
  "JWT_SECRET",
  "SESSION_SECRET",
  "TOKEN_ENCRYPTION_KEY",
];

const DEVELOPMENT_FALLBACK_SECRETS = {
  JWT_SECRET: "development-only-secret",
  SESSION_SECRET: "development-only-session-secret",
};

function getMissingEnvironmentVariables(variableNames) {
  return variableNames.filter((name) => !process.env[name]?.trim());
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isSecureUrl(value) {
  return /^https:\/\//i.test(String(value || "").trim());
}

function readBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  frontendUrl,
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/auth/google/callback",
  databaseUrl: process.env.DATABASE_URL || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1",
  jwtSecret: process.env.JWT_SECRET || DEVELOPMENT_FALLBACK_SECRETS.JWT_SECRET,
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    DEVELOPMENT_FALLBACK_SECRETS.SESSION_SECRET,
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "usi_session",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || "",
  isProduction: isProduction(),
  /**
   * Cookies are marked Secure whenever the public frontend is served over
   * HTTPS. Deriving this from the URL instead of NODE_ENV keeps plain-HTTP
   * deployments (docker compose on localhost) working while still protecting
   * real HTTPS deployments.
   */
  useSecureCookies:
    readBoolean(process.env.SECURE_COOKIES) || isSecureUrl(frontendUrl),
  /**
   * Demo mode serves the placeholder conversations for the not-yet-implemented
   * providers. It is opt-in so production tenants never see fake data.
   */
  demoMode: readBoolean(process.env.DEMO_MODE, !isProduction()),
  /**
   * Cross-site cookies are required when the frontend and backend live on
   * different sites (not just different ports).
   */
  crossSiteCookies: !isSameSite(frontendUrl),
};

function isSameSite(url) {
  try {
    const parsed = new URL(url);
    return getSiteKey(parsed.hostname) === getSiteKey(new URL("http://localhost").hostname);
  } catch (_error) {
    return true;
  }
}

/**
 * Approximates the "site" of a hostname (registrable domain). Ports do not
 * affect same-site rules, but different subdomains of the same registrable
 * domain still count as one site.
 */
function getSiteKey(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  if (!normalized || normalized === "localhost") {
    return normalized;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized) || normalized.includes(":")) {
    return normalized;
  }

  const labels = normalized.split(".").filter(Boolean);
  if (labels.length <= 2) {
    return normalized;
  }

  return labels.slice(-2).join(".");
}

export function validateEnvironmentVariables() {
  const missingRequired = getMissingEnvironmentVariables(
    REQUIRED_ENVIRONMENT_VARIABLES,
  );
  const missingOptional = getMissingEnvironmentVariables(
    OPTIONAL_ENVIRONMENT_VARIABLES,
  );
  const missingProductionRequired = isProduction()
    ? getMissingEnvironmentVariables(PRODUCTION_REQUIRED_ENVIRONMENT_VARIABLES)
    : [];

  const usingDevelopmentFallbackSecret =
    !isProduction() &&
    DEVELOPMENT_FALLBACK_SECRETS.JWT_SECRET === env.jwtSecret;

  return {
    ok: missingRequired.length === 0 && missingProductionRequired.length === 0,
    missingRequired,
    missingOptional,
    missingProductionRequired,
    oauthConfigured: missingRequired.length === 0,
    databaseConfigured: !missingOptional.includes("DATABASE_URL"),
    openAiConfigured: !missingOptional.includes("OPENAI_API_KEY"),
    demoMode: env.demoMode,
    usingDevelopmentFallbackSecret,
  };
}

/**
 * Hard failures that must stop the process from booting in production.
 * Without these the app would silently sign sessions with a publicly known
 * secret or store provider tokens with an unvalidated key.
 */
export function getBlockingEnvironmentErrors() {
  const status = validateEnvironmentVariables();
  const errors = [];

  if (status.missingRequired.length > 0) {
    errors.push(
      `Missing required environment variables: ${status.missingRequired.join(", ")}.`,
    );
  }

  if (status.missingProductionRequired.length > 0) {
    errors.push(
      `Missing production secrets: ${status.missingProductionRequired.join(", ")}. ` +
        "Set them to long random values before starting the server.",
    );
  }

  if (status.usingDevelopmentFallbackSecret) {
    errors.push(
      "JWT_SECRET is using the development fallback. Set JWT_SECRET explicitly.",
    );
  }

  if (env.tokenEncryptionKey) {
    const keyError = validateEncryptionKey(env.tokenEncryptionKey);
    if (keyError) {
      errors.push(keyError);
    }
  } else if (isProduction()) {
    errors.push(
      "TOKEN_ENCRYPTION_KEY is required in production to encrypt provider tokens.",
    );
  }

  return errors;
}

export function validateEncryptionKey(key) {
  if (!key) {
    return "TOKEN_ENCRYPTION_KEY is required to securely store provider tokens.";
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    return "TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes) for AES-256-GCM.";
  }

  return null;
}
