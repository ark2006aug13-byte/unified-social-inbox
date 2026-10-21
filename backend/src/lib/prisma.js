import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const globalForPrisma = globalThis;

class DatabaseUnavailableError extends Error {
  constructor(message = "Database not connected, running in no-DB mode") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export { DatabaseUnavailableError };

let prismaClient = null;
let databaseConnected = false;
let reconnectTimer = null;
const databaseConfigured = Boolean(env.databaseUrl);
const RECONNECT_INTERVAL_MS = 10_000;

function createUnavailableMethod() {
  return async () => {
    throw new DatabaseUnavailableError();
  };
}

function createModelProxy() {
  return new Proxy(
    {},
    {
      get() {
        return createUnavailableMethod();
      },
    },
  );
}

const prismaFallback = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === "$connect" || property === "$disconnect") {
        return async () => null;
      }

      if (property === "$on") {
        return () => null;
      }

      return createModelProxy();
    },
  },
);

async function initializePrisma() {
  if (!databaseConfigured) {
    logger.warn("database_not_configured", {
      message: "Database not connected, running in no-DB mode",
    });
    return null;
  }

  const existingClient = globalForPrisma.prisma || new PrismaClient({
    log: ["warn", "error"],
  });

  try {
    await existingClient.$connect();
    prismaClient = existingClient;
    databaseConnected = true;

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = existingClient;
    }

    logger.info("database_connected", {
      database: true,
    });

    return existingClient;
  } catch (error) {
    databaseConnected = false;
    prismaClient = null;

    logger.warn("database_connection_failed", {
      message: "Database not connected, running in no-DB mode",
      details:
        error instanceof Error
          ? error.message
          : "Unknown database connection error.",
    });

    scheduleReconnect(existingClient);

    return null;
  }
}

/**
 * The database is often not ready yet when the API boots (docker compose,
 * managed Postgres cold starts). Instead of staying permanently in no-DB mode
 * we keep retrying in the background.
 */
function scheduleReconnect(client) {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setInterval(async () => {
    try {
      await client.$connect();
      prismaClient = client;
      databaseConnected = true;

      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
      }

      clearInterval(reconnectTimer);
      reconnectTimer = null;

      logger.info("database_reconnected", { database: true });
    } catch (_error) {
      logger.warn("database_reconnect_failed", {
        message: "Still unable to reach the database. Retrying.",
      });
    }
  }, RECONNECT_INTERVAL_MS);

  reconnectTimer.unref?.();
}

await initializePrisma();

/**
 * A live proxy: it always forwards to the real client when one is connected
 * and falls back to the "no database" stub otherwise. Because the client can
 * connect after boot (see `scheduleReconnect`), the target is resolved on
 * every property access instead of being captured at import time.
 */
export const prisma = new Proxy(
  {},
  {
    get(_target, property) {
      const activeClient = prismaClient;

      if (!activeClient) {
        const fallback = prismaFallback[property];
        return typeof fallback === "function" ? fallback : fallback;
      }

      const value = activeClient[property];
      return typeof value === "function" ? value.bind(activeClient) : value;
    },
  },
);

export function isDatabaseConfigured() {
  return databaseConfigured;
}

export function isDatabaseConnected() {
  return databaseConnected;
}

export function isDatabaseAvailable() {
  return databaseConfigured && databaseConnected;
}
