import { env } from "../config/env.js";
import {
  isDatabaseAvailable,
  prisma,
} from "../lib/prisma.js";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../services/authTokenService.js";
import {
  buildLoginUrl,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  verifyState,
} from "../services/oauthService.js";
import {
  hasStoredGmailTokens,
  storeGmailTokens,
  syncGmailMessages,
} from "../services/gmailService.js";
import { serializeConnectedAccount } from "../services/messageService.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

const FRONTEND_DASHBOARD_URL = "http://localhost:3000/dashboard";

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown OAuth error.";
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

function buildTransientUser(profile) {
  return {
    id: profile.id || profile.email,
    email: profile.email,
    name: profile.name || profile.email,
    avatarUrl: profile.picture || null,
    createdAt: new Date(),
  };
}

function buildFallbackConnectedAccounts(userId) {
  if (!hasStoredGmailTokens(userId)) {
    return [];
  }

  return [
    {
      id: `memory-gmail-${userId}`,
      provider: "gmail",
      status: "connected",
      connectedAt: new Date().toISOString(),
      expiry: null,
    },
  ];
}

function createSessionTokenPayload(tokens) {
  return {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || "",
    expiry_date: tokens.expiry_date || null,
    scope: tokens.scope || "",
    token_type: tokens.token_type || "Bearer",
  };
}

function createSessionUserPayload(user) {
  return {
    id: user.id,
    email: user.email || "",
    name: user.name || user.email || "Google User",
  };
}

function saveRequestSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function persistUser(profile) {
  if (!isDatabaseAvailable()) {
    logger.warn("oauth_login_without_database", {
      email: profile.email,
      message: "Database not connected, running in no-DB mode",
    });

    return buildTransientUser(profile);
  }

  try {
    return await prisma.user.upsert({
      where: {
        email: profile.email,
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
      },
      update: {
        name: profile.name,
        avatarUrl: profile.picture,
      },
    });
  } catch (error) {
    logger.warn("oauth_user_persist_failed", {
      email: profile.email,
      details: getErrorMessage(error),
    });

    return buildTransientUser(profile);
  }
}

export async function startGoogleAuth(_req, res) {
  try {
    return res.redirect(buildLoginUrl());
  } catch (error) {
    const details = getErrorMessage(error);

    logger.error("google_oauth_start_failed", {
      details,
    });

    return res.status(500).json({
      error: "OAuth failed",
      details,
    });
  }
}

export async function handleGoogleCallback(req, res) {
  try {
    const code = String(req.query.code || "");
    if (!code) {
      throw new ApiError(400, "Missing Google OAuth code.");
    }

    const state = verifyState(
      typeof req.query.state === "string" ? req.query.state : undefined,
    );

    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (error) {
      throw new ApiError(
        400,
        "Failed to exchange Google OAuth code for access token.",
        {
          cause: getErrorMessage(error),
        },
      );
    }

    let profile;
    try {
      profile = await fetchGoogleProfile(tokens);
    } catch (error) {
      throw new ApiError(400, "Failed to fetch Google profile.", {
        cause: getErrorMessage(error),
      });
    }

    if (!profile?.email) {
      throw new ApiError(
        400,
        "Google profile did not include an email address.",
      );
    }

    if (state?.flow === "gmail_connect") {
      if (!state.userId) {
        throw new ApiError(400, "Invalid Gmail connection state.");
      }

      req.session.tokens = createSessionTokenPayload(tokens);
      req.session.gmailConnected = true;
      req.session.gmailUserId = state.userId;
      req.session.user = {
        id: state.userId,
        email: profile.email || "",
        name: profile.name || profile.email || "Google User",
      };

      try {
        await storeGmailTokens(state.userId, profile, tokens);
      } catch (error) {
        logger.warn("gmail_connect_token_store_failed", {
          userId: state.userId,
          details: getErrorMessage(error),
        });
      }

      try {
        await syncGmailMessages(state.userId, { maxResults: 10 });
      } catch (error) {
        logger.warn("gmail_initial_sync_failed", {
          userId: state.userId,
          details: getErrorMessage(error),
        });
      }

      await saveRequestSession(req);

      console.log("[oauth] gmail connect success", {
        userId: state.userId,
        email: profile.email,
      });

      logger.info("google_oauth_success", {
        flow: "gmail_connect",
        email: profile.email,
      });

      return res.redirect(
        `${env.frontendUrl}/integrations?provider=gmail&status=connected`,
      );
    }

    const user = await persistUser(profile);
    req.session.tokens = createSessionTokenPayload(tokens);
    req.session.gmailConnected = true;
    req.session.gmailUserId = user.id;
    req.session.user = createSessionUserPayload(user);

    try {
      await storeGmailTokens(user.id, profile, tokens);
    } catch (error) {
      logger.warn("gmail_login_token_store_failed", {
        userId: user.id,
        details: getErrorMessage(error),
      });
    }

    try {
      await syncGmailMessages(user.id, { maxResults: 10 });
    } catch (error) {
      logger.warn("gmail_login_sync_failed", {
        userId: user.id,
        details: getErrorMessage(error),
      });
    }

    await saveRequestSession(req);
    setSessionCookie(res, user);

    console.log("[oauth] login success", {
      userId: user.id,
      email: profile.email,
      hasAccessToken: Boolean(tokens.access_token),
    });

    logger.info("google_oauth_success", {
      flow: "login",
      email: profile.email,
      database: isDatabaseAvailable(),
    });

    return res.redirect(FRONTEND_DASHBOARD_URL);
  } catch (error) {
    const details = getErrorMessage(error);

    logger.error("google_oauth_callback_failed", {
      path: req.originalUrl,
      hasCode: Boolean(req.query.code),
      details,
    });

    return res
      .status(error instanceof ApiError ? error.statusCode : 500)
      .json({
        error: "OAuth failed",
        details,
      });
  }
}

export async function getSession(req, res) {
  try {
    if (!req.auth?.sub) {
      return res.json({
        authenticated: false,
        user: null,
        connectedAccounts: [],
      });
    }

    if (!isDatabaseAvailable()) {
      return res.json({
        authenticated: true,
        user: {
          id: req.auth.sub,
          email: req.auth.email || "",
          name: req.auth.name || req.auth.email || "Google User",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        },
        connectedAccounts:
          req.session?.tokens || req.session?.gmailConnected
            ? buildFallbackConnectedAccounts(req.auth.sub)
            : [],
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.auth.sub,
      },
      include: {
        connectedAccounts: true,
      },
    });

    if (!user) {
      return res.json({
        authenticated: true,
        user: {
          id: req.auth.sub,
          email: req.auth.email || "",
          name: req.auth.name || req.auth.email || "Google User",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        },
        connectedAccounts:
          req.session?.tokens || req.session?.gmailConnected
            ? buildFallbackConnectedAccounts(req.auth.sub)
            : [],
      });
    }

    return res.json({
      authenticated: true,
      user: serializeUser(user),
      connectedAccounts: user.connectedAccounts.map(serializeConnectedAccount),
    });
  } catch (error) {
    logger.warn("session_lookup_failed", {
      details: getErrorMessage(error),
    });

    return res.json({
      authenticated: Boolean(req.auth?.sub),
      user: req.auth?.sub
        ? {
            id: req.auth.sub,
            email: req.auth.email || "",
            name: req.auth.name || req.auth.email || "Google User",
            avatarUrl: null,
            createdAt: new Date().toISOString(),
          }
        : null,
      connectedAccounts: req.auth?.sub
        ? req.session?.tokens || req.session?.gmailConnected
          ? buildFallbackConnectedAccounts(req.auth.sub)
          : []
        : [],
    });
  }
}

export async function logout(req, res) {
  req.session.destroy(() => {
    clearSessionCookie(res);
    res.status(204).send();
  });
}
