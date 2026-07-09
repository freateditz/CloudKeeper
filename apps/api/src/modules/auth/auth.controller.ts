import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validator";

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await AuthService.register(data);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await AuthService.login(email, password);
      
      res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict" });
      res.json({ accessToken, user });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },
};
