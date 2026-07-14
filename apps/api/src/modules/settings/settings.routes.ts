import { Router } from "express";
import { SettingsController } from "./settings.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", SettingsController.get);
router.patch("/", SettingsController.update);

export default router;
