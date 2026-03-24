import { env } from "../config/env.js";
import { verifySessionToken } from "../services/authTokenService.js";

function extractToken(req) {
  const cookieToken = req.cookies?.[env.sessionCookieName];
  const authHeader = req.headers.authorization;

  if (cookieToken) {
    return cookieToken;
  }

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

function getSessionAuth(req) {
  const sessionUser = req.session?.user;

  if (!sessionUser?.id) {
    return null;
  }

  return {
    sub: sessionUser.id,
    email: sessionUser.email || "",
    name: sessionUser.name || sessionUser.email || "Google User",
  };
}

export function maybeAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.auth = getSessionAuth(req) || undefined;
      return next();
    }

    req.auth = verifySessionToken(token);
    return next();
  } catch (_error) {
    req.auth = getSessionAuth(req) || undefined;
    return next();
  }
}

export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      const sessionAuth = getSessionAuth(req);
      if (sessionAuth) {
        req.auth = sessionAuth;
        return next();
      }

      return res.status(401).json({ error: "Authentication required" });
    }

    req.auth = verifySessionToken(token);
    return next();
  } catch (_error) {
    const sessionAuth = getSessionAuth(req);
    if (sessionAuth) {
      req.auth = sessionAuth;
      return next();
    }

    return res.status(401).json({ error: "Authentication required" });
  }
}
