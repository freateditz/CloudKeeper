import { Router } from "express";
import { JobsController } from "./jobs.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", JobsController.list);
router.get("/:id", JobsController.getById);
router.post("/run-all", JobsController.runAll);
router.post("/", JobsController.create);

export default router;
