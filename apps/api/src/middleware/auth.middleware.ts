import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// I can't import from auth.service.ts because it causes a circular dependency (middleware -> controller -> service -> middleware).
// I will keep the definition here, but make sure it uses the same environment variables.

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "dev-access-secret-change-me";

export interface AuthUserPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: AuthUserPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.substring(7);
  }
  // Fallback to accessToken cookie
  const cookieToken = (req as any).cookies?.accessToken;
  if (cookieToken) return cookieToken;
  return null;
}
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthUserPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({ error: "Forbidden" });
  }
};
