import { Router } from "express";
import { AuthController } from "./auth.controller";
import rateLimit from "express-rate-limit";

const router: Router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created from this IP. Please try again later." },
});

router.post("/register", registerLimiter, AuthController.register);
router.post("/login", loginLimiter, AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Authenticated endpoints
router.get("/me", AuthController.authenticate, AuthController.me);
router.post("/logout", AuthController.authenticate, AuthController.logout);

export default router;
