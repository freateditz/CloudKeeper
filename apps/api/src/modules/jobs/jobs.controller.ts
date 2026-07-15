import { Request, Response } from "express";
import { JobsService } from "./jobs.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const JobsController = {
  async list(_req: Request, res: Response) {
    const jobs = await JobsService.list();
    res.json({ jobs });
  },

  async getById(req: Request, res: Response) {
    const job = await JobsService.getById(req.params.id as string);
    res.json({ job });
  },

  async create(req: Request, res: Response) {
    const { accountId, provider } = req.body;
    const job = await JobsService.create(accountId, provider);
    res.status(201).json({ job });
  },

  async runAll(req: Request, res: Response) {
    const { userId } = (req as AuthRequest).user;
    const result = await JobsService.runAllForUser(userId);
    res.status(201).json(result);
  },
};
