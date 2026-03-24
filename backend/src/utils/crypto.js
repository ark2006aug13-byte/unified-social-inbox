import crypto from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

function resolveKey() {
  if (!env.tokenEncryptionKey) {
    throw new ApiError(
      500,
      "TOKEN_ENCRYPTION_KEY is required to securely store provider tokens.",
    );
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

export function decryptSecret(payload) {
  if (!payload) {
    return payload;
  }

  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  const key = resolveKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
