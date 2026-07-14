import { Request, Response } from "express";
import { SettingsService } from "./settings.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const SettingsController = {
  async get(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const settings = await SettingsService.get(authReq.user.userId);
    res.json({ settings });
  },

  async update(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const settings = await SettingsService.update(authReq.user.userId, req.body);
    res.json({ settings });
  },
};
