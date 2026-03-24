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

let prismaClient = null;
let databaseConnected = false;
const databaseConfigured = Boolean(env.databaseUrl);

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

    return null;
  }
}

await initializePrisma();

export const prisma = prismaClient || prismaFallback;

export function isDatabaseConfigured() {
  return databaseConfigured;
}

export function isDatabaseConnected() {
  return databaseConnected;
}

export function isDatabaseAvailable() {
  return databaseConfigured && databaseConnected;
}

export function isDatabaseUnavailableError(error) {
  return error instanceof DatabaseUnavailableError;
}
