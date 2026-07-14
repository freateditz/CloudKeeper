import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", AnalyticsController.get);

export default router;
