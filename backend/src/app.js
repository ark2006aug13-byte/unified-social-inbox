import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";
import { logger } from "./utils/logger.js";

const app = express();
const allowedOrigin = env.frontendUrl;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(
  session({
    name: `${env.sessionCookieName}_state`,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info("http_request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully",
    backendUrl: env.backendUrl,
  });
});

app.get("/api/test", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Frontend and backend connected successfully",
    backendUrl: env.backendUrl,
    frontendUrl: env.frontendUrl,
  });
});

registerRoutes(app);

app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
