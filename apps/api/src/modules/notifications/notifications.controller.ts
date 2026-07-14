import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

export const NotificationsController = {
  async list(req: Request, res: Response) {
    // For now, return empty list or mock data as notification system isn't fully defined
    res.json({ notifications: [] });
  },
};
