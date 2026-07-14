import { Request, Response } from "express";
import { ZodError } from "zod";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validator";
import { AuthRequest, authenticate } from "../../middleware/auth.middleware";

function formatZodError(err: ZodError) {
  return err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await AuthService.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      res.status(201).json({ user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatZodError(error),
        });
      }
      const status = error?.statusCode || 500;
      res.status(status).json({ error: error?.message || "Internal server error" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await AuthService.login(email, password);

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.status(200).json({ accessToken, user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: formatZodError(error),
        });
      }
      const status = error?.statusCode || 500;
      res.status(status).json({ error: error?.message || "Internal server error" });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const user = await AuthService.me(authReq.user.userId);
      res.json({ user });
    } catch (error: any) {
      const status = error?.statusCode || 500;
      res.status(status).json({ error: error?.message || "Internal server error" });
    }
  },

  async logout(_req: Request, res: Response) {
    // JWT is stateless, so logout is handled client-side by discarding the
    // access token. We also clear the refresh token cookie if one was set.
    res.clearCookie("refreshToken", { path: "/" });
    res.status(200).json({ success: true });
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token missing" });
      }

      const { accessToken, refreshToken: newRefreshToken, user } = await AuthService.refreshToken(refreshToken);

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.status(200).json({ accessToken, user });
    } catch (error: any) {
      const status = error?.statusCode || 500;
      res.status(status).json({ error: error?.message || "Internal server error" });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);
      res.status(200).json({ message: "If an account exists, a reset email has been sent." });
    } catch (error: any) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await AuthService.resetPassword(token, newPassword);
      res.status(200).json({ message: "Password reset successfully." });
    } catch (error: any) {
      const status = error?.statusCode || 500;
      res.status(status).json({ error: error?.message || "Internal server error" });
    }
  },

  // Middleware re-export so router can wire it up.
  authenticate,
};
