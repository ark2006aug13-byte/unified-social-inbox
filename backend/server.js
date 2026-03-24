import dotenv from "dotenv";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const backendRootDirectory = path.dirname(currentFilePath);
const backendEnvPath = path.join(backendRootDirectory, ".env");

dotenv.config({ path: backendEnvPath });

const [
  { default: app },
  { env, validateEnvironmentVariables },
  { prisma, isDatabaseAvailable },
  { initializeSocket },
  { logger },
] = await Promise.all([
  import("./src/app.js"),
  import("./src/config/env.js"),
  import("./src/lib/prisma.js"),
  import("./src/services/socketService.js"),
  import("./src/utils/logger.js"),
]);

const environmentStatus = validateEnvironmentVariables();

if (!environmentStatus.ok) {
  logger.error("environment_validation_failed", {
    missingRequired: environmentStatus.missingRequired,
  });
}

if (environmentStatus.missingOptional.length > 0) {
  logger.warn("environment_validation_warning", {
    missingOptional: environmentStatus.missingOptional,
  });
}

console.log("OAuth configured:", environmentStatus.oauthConfigured);

const server = http.createServer(app);
let shuttingDown = false;

initializeSocket(server);

server.on("error", (error) => {
  void handleServerError(error);
});

server.listen(env.port, () => {
  console.log(`Backend running on port ${env.port}`);
  logger.info("backend_started", {
    port: env.port,
    backendUrl: env.backendUrl,
    googleOAuthConfigured: environmentStatus.oauthConfigured,
    database: isDatabaseAvailable(),
  });
});

async function handleServerError(error) {
  if (error?.code === "EADDRINUSE") {
    const existingBackend = await detectExistingBackend(env.port);

    if (existingBackend) {
      logger.warn("backend_already_running", {
        port: env.port,
        message: `Unified Social Inbox backend is already running on port ${env.port}.`,
      });
      return;
    }

    logger.error("server_startup_failed", {
      port: env.port,
      code: error.code,
      message: `Port ${env.port} is already in use. Stop the existing process or change PORT in backend/.env.`,
    });
    return;
  }

  logger.error("server_runtime_error", {
    code: error?.code || "UNKNOWN",
    message: error?.message || "Unknown server error.",
  });
}

async function detectExistingBackend(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return payload?.status === "ok";
  } catch (_error) {
    return false;
  }
}

async function disconnectAndExit(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await prisma.$disconnect();
  process.exit(exitCode);
}

async function shutdown(signal) {
  logger.info("backend_shutdown_requested", { signal });

  server.close(async () => {
    await disconnectAndExit(0);
  });

  setTimeout(async () => {
    await disconnectAndExit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (error) => {
  logger.error("unhandled_rejection", {
    details: error instanceof Error ? error.message : "Unknown rejection.",
  });
});

process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", {
    details: error instanceof Error ? error.message : "Unknown uncaught exception.",
  });
});
