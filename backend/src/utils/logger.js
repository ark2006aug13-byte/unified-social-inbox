const REDACTED_KEYS = new Set([
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "client_secret",
  "clientSecret",
  "apiKey",
  "api_key",
  "password",
  "secret",
  "token",
  "authorization",
]);

function redact(value, depth = 0) {
  if (depth > 4 || value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redact(entry, depth + 1));
  }

  const output = {};

  for (const [key, entry] of Object.entries(value)) {
    if (REDACTED_KEYS.has(key)) {
      output[key] = "[redacted]";
      continue;
    }

    output[key] = redact(entry, depth + 1);
  }

  return output;
}

function write(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug(message, meta = {}) {
    if (process.env.LOG_LEVEL === "debug") {
      write("debug", message, meta);
    }
  },
  info(message, meta = {}) {
    write("info", message, meta);
  },
  warn(message, meta = {}) {
    write("warn", message, meta);
  },
  error(message, meta = {}) {
    write("error", message, meta);
  },
};
