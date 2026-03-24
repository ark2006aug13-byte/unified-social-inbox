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

export function errorHandler(error, req, res, _next) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const details =
    error instanceof Error ? error.message : "Unknown application error.";

  logger.error("api_error", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    details,
  });

  return res.status(statusCode).json({
    error: "Something went wrong",
    details,
  });
}
