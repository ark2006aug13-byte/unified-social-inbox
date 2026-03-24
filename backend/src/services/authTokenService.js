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

export function setSessionCookie(res, user) {
  res.cookie(env.sessionCookieName, signSessionToken(user), {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
  });
}
