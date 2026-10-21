import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.useSecureCookies,
    sameSite: env.crossSiteCookies ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function setSessionCookie(res, user) {
  res.cookie(env.sessionCookieName, signSessionToken(user), cookieOptions());
}

export function clearSessionCookie(res) {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.useSecureCookies,
    sameSite: env.crossSiteCookies ? "none" : "lax",
    path: "/",
  });
}

/**
 * Removes the express-session cookie so a stale session id is not sent back
 * to the server after a logout.
 */
export function clearExpressSessionCookie(res) {
  res.clearCookie(`${env.sessionCookieName}_state`, {
    httpOnly: true,
    secure: env.useSecureCookies,
    sameSite: env.crossSiteCookies ? "none" : "lax",
    path: "/",
  });
}
