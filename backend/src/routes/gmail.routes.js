import { Router } from "express";
import { connectGmail, getGmailMessage, getGmailMessages, syncGmail } from "../controllers/gmail.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/connect", connectGmail);
router.get("/messages", getGmailMessages);
router.post("/sync", syncGmail);
router.get("/message/:id", getGmailMessage);

export default router;
