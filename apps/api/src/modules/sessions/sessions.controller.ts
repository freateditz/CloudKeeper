import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

export const SessionsController = {
  async list(req: Request, res: Response) {
    // Basic JWT is stateless, so we list "sessions" based on active refresh tokens
    // For now, this is a placeholder.
    res.json({ sessions: [] });
  },
  
  async delete(req: Request, res: Response) {
      res.status(200).json({ success: true });
  }
};
