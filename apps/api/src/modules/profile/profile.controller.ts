import { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { AuthRequest } from "../../middleware/auth.middleware";

export const ProfileController = {
  async get(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const profile = await ProfileService.get(authReq.user.userId);
    res.json({ profile });
  },

  async update(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const profile = await ProfileService.update(authReq.user.userId, req.body);
    res.json({ profile });
  },
};
