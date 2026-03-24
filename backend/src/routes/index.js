import authRoutes from "./auth.routes.js";
import gmailRoutes from "./gmail.routes.js";
import aiRoutes from "./ai.routes.js";
import messageRoutes from "./message.routes.js";
import integrationRoutes from "./integration.routes.js";
import healthRoutes from "./health.routes.js";

export function registerRoutes(app) {
  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/api/gmail", gmailRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/integrations", integrationRoutes);
}
