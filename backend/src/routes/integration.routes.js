import { Router } from "express";
import { getIntegrationStatus } from "../controllers/integration.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getIntegrationStatus);

export default router;
