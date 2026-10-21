import crypto from "node:crypto";
import { env, validateEncryptionKey } from "../config/env.js";
import { ApiError } from "./apiError.js";

function resolveKey() {
  const keyError = validateEncryptionKey(env.tokenEncryptionKey);
  if (keyError) {
    throw new ApiError(500, keyError);
  }

  return Buffer.from(env.tokenEncryptionKey, "hex");
}

export function encryptSecret(value) {
  if (!value) {
    return value;
  }

  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSecret(payload) {
  if (!payload) {
    return payload;
  }

  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new ApiError(500, "Stored provider token is malformed.");
  }

  const key = resolveKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Decrypts a stored token and returns null instead of throwing when the value
 * cannot be read (missing key, rotated key, legacy plaintext). Callers treat
 * `null` as "no usable credential" and fall back to a session or re-auth.
 */
export function tryDecryptSecret(payload) {
  if (!payload) {
    return null;
  }

  try {
    return decryptSecret(payload);
  } catch (_error) {
    return null;
  }
}
