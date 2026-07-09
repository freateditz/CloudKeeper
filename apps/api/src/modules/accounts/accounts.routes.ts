import { Router } from "express";
import { AccountsService } from "./accounts.service";
import { authenticate } from "../../middleware/auth.middleware";
import { createAccountSchema } from "./accounts.validator";

const router: Router = Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  const accounts = await AccountsService.list((req as any).user.userId);
  res.json(accounts);
});

router.post("/", async (req, res) => {
  const data = createAccountSchema.parse(req.body);
  const account = await AccountsService.create((req as any).user.userId, data);
  res.status(201).json(account);
});

router.delete("/:id", async (req, res) => {
  await AccountsService.delete(req.params.id, (req as any).user.userId);
  res.status(204).send();
});

export default router;
