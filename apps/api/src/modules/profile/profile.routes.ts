import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", ProfileController.get);
router.patch("/", ProfileController.update);

export default router;
