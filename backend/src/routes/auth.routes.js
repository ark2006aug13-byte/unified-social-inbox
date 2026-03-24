import { Router } from "express";
import { getSession, handleGoogleCallback, logout, startGoogleAuth } from "../controllers/auth.controller.js";
import { maybeAuth } from "../middleware/auth.js";

const router = Router();

router.get("/google", startGoogleAuth);
router.get("/google/callback", handleGoogleCallback);
router.get("/callback", handleGoogleCallback);
router.get("/me", maybeAuth, getSession);
router.post("/logout", logout);

export default router;
