import { Router } from "express";
import { AccountsController } from "./accounts.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router: Router = Router();

// All account routes require authentication.
router.use(authenticate);

router.get("/", AccountsController.list);
router.get("/:id", AccountsController.getById);
router.post("/", AccountsController.create);
router.put("/:id", AccountsController.update);
router.patch("/:id", AccountsController.update);
router.delete("/:id", AccountsController.delete);

export default router;
