function write(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
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
