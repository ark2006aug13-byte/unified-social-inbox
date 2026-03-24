import { Router } from "express";
import { summarizeMessage, suggestReply } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.post("/summary", summarizeMessage);
router.post("/reply", suggestReply);

export default router;
