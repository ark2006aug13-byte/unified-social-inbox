import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req, _res, next) {
  next(
    new ApiError(404, "Route not found", {
      method: req.method,
      path: req.originalUrl,
    }),
  );
}

function isBodyParserError(error) {
  return (
    error?.type === "entity.parse.failed" ||
    error instanceof SyntaxError ||
    error?.status === 400
  );
}

function normalizeError(error) {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: "Request validation failed.",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    };
  }

  if (isBodyParserError(error)) {
    return {
      statusCode: 400,
      message: "Request body is not valid JSON.",
      details: null,
    };
  }

  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details ?? null,
    };
  }

  return {
    statusCode: 500,
    message: "Something went wrong.",
    details: null,
  };
}

export function errorHandler(error, req, res, _next) {
  const { statusCode, message, details } = normalizeError(error);

  logger.error("api_error", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    details: details ?? (error instanceof Error ? error.message : "Unknown error."),
  });

  const payload = {
    error: message,
    statusCode,
  };

  if (details) {
    payload.details = details;
  }

  if (statusCode >= 500 && !env.isProduction) {
    payload.debug = error instanceof Error ? error.message : String(error);
  }

  return res.status(statusCode).json(payload);
}
