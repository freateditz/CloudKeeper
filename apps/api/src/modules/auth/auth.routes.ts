import { Router } from "express";
import { AuthController } from "./auth.controller";
import rateLimit from "express-rate-limit";

const router: Router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

router.post("/register", AuthController.register);
router.post("/login", loginLimiter, AuthController.login);

export default router;
