import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { env, validateEnvironmentVariables } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const BASE_SCOPES = ["openid", "email", "profile"];
const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function createOAuthClient() {
  const environmentStatus = validateEnvironmentVariables();

  if (!environmentStatus.oauthConfigured) {
    throw new ApiError(
      500,
      "Google OAuth is not configured.",
      {
        missingVariables: environmentStatus.missingRequired,
      },
    );
  }

  try {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  } catch (error) {
    throw new ApiError(500, "Failed to create Google OAuth2 client.", {
      cause:
        error instanceof Error
          ? error.message
          : "Unknown OAuth client creation error.",
    });
  }
}

export function getGoogleOAuthStatus() {
  const environmentStatus = validateEnvironmentVariables();

  return {
    configured: environmentStatus.oauthConfigured,
    missingVariables: environmentStatus.missingRequired,
  };
}

export function buildLoginUrl() {
  const client = createOAuthClient();
  const state = signState({ flow: "login" });

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...BASE_SCOPES, ...GMAIL_SCOPES],
    state,
  });
}

export function buildGmailConnectUrl(userId) {
  const client = createOAuthClient();
  const state = signState({ flow: "gmail_connect", userId });

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...BASE_SCOPES, ...GMAIL_SCOPES],
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (error) {
    throw new ApiError(400, "Failed to exchange OAuth code with Google.", {
      cause:
        error instanceof Error ? error.message : "Unknown token exchange error.",
    });
  }
}

export async function fetchGoogleProfile(tokens) {
  try {
    const client = createOAuthClient();
    client.setCredentials(tokens);
    const oauth = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth.userinfo.get();
    return data;
  } catch (error) {
    throw new ApiError(400, "Failed to fetch Google profile.", {
      cause:
        error instanceof Error ? error.message : "Unknown Google profile error.",
    });
  }
}

export function buildAuthorizedOAuthClient(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);
  return client;
}

function signState(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "10m" });
}

export function verifyState(state) {
  if (!state) {
    return null;
  }

  try {
    return jwt.verify(state, env.jwtSecret);
  } catch (_error) {
    return null;
  }
}
