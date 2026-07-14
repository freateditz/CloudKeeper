import { Router } from "express";
import { SessionsController } from "./sessions.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", SessionsController.list);
router.delete("/:id", SessionsController.delete);

export default router;
