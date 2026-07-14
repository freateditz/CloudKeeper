import { Request, Response } from "express";
import { ZodError } from "zod";
import { AccountsService } from "./accounts.service";
import { createAccountSchema, updateAccountSchema } from "./accounts.validator";
import { AuthRequest } from "../../middleware/auth.middleware";

function formatZodError(err: ZodError) {
  return err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

function handleError(res: Response, error: any) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: formatZodError(error),
    });
  }
  const status = error?.statusCode || 500;
  return res.status(status).json({ error: error?.message || "Internal server error" });
}

export const AccountsController = {
  async list(req: Request, res: Response) {
    try {
      const { userId } = (req as AuthRequest).user;
      const accounts = await AccountsService.list(userId);
      res.json({ accounts });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { userId } = (req as AuthRequest).user;
      const account = await AccountsService.getById(userId, String(req.params.id));
      res.json({ account });
    } catch (error) {
      handleError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { userId } = (req as AuthRequest).user;
      const data = createAccountSchema.parse(req.body);
      const account = await AccountsService.create(userId, data);
      res.status(201).json({ account });
    } catch (error) {
      handleError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { userId } = (req as AuthRequest).user;
      const data = updateAccountSchema.parse(req.body);
      const account = await AccountsService.update(userId, String(req.params.id), data);
      res.json({ account });
    } catch (error) {
      handleError(res, error);
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { userId } = (req as AuthRequest).user;
      await AccountsService.delete(userId, String(req.params.id));
      res.status(200).json({ success: true });
    } catch (error) {
      handleError(res, error);
    }
  },
};
