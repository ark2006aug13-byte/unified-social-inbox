import { Router } from "express";
import { getMessage, getMessages } from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getMessages);
router.get("/:id", getMessage);

export default router;
