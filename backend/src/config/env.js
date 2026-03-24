const REQUIRED_ENVIRONMENT_VARIABLES = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

const OPTIONAL_ENVIRONMENT_VARIABLES = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
];

function getMissingEnvironmentVariables(variableNames) {
  return variableNames.filter((name) => !process.env[name]?.trim());
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/auth/google/callback",
  databaseUrl: process.env.DATABASE_URL || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    "development-only-session-secret",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "usi_session",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || "",
  isProduction: process.env.NODE_ENV === "production",
};

export function validateEnvironmentVariables() {
  const missingRequired = getMissingEnvironmentVariables(
    REQUIRED_ENVIRONMENT_VARIABLES,
  );
  const missingOptional = getMissingEnvironmentVariables(
    OPTIONAL_ENVIRONMENT_VARIABLES,
  );

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    oauthConfigured: missingRequired.length === 0,
    databaseConfigured: !missingOptional.includes("DATABASE_URL"),
    openAiConfigured: !missingOptional.includes("OPENAI_API_KEY"),
  };
}
