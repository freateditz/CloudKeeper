import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma, UserRepository, PasswordResetTokenRepository } from "@cloudkeeper/database";
import { AuthTokens, AuthUser } from "@cloudkeeper/types";
import { sendEmail } from "@cloudkeeper/shared";

const userRepository = new UserRepository();
const passwordResetTokenRepository = new PasswordResetTokenRepository();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "dev-access-secret-change-me";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

export interface LoginResult extends AuthTokens {
  user: AuthUser;
}

export interface RegisterInput {
  username?: string;
  name?: string;
  email: string;
  password: string;
}

export const AuthService = {
  async register(data: RegisterInput): Promise<AuthUser> {
    const displayName = (data.username || data.name || "").trim();
    if (!displayName) {
      const err: any = new Error("Username is required");
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      const err: any = new Error("User already exists");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: displayName,
      email: data.email,
      passwordHash,
    });

    return { id: user.id, email: user.email, name: user.name };
  },

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err: any = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      const err: any = new Error("Invalid credentials");
      err.statusCode = 401;
      throw err;
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL as any,
    });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL as any,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return { id: user.id, email: user.email, name: user.name };
  },

  async refreshToken(refreshToken: string): Promise<LoginResult> {
    try {
      const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string, email: string };
      const user = await userRepository.findById(payload.userId);
      if (!user) {
        throw new Error("Invalid token");
      }
      const accessToken = jwt.sign({ userId: user.id, email: user.email }, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL as any,
      });
      const newRefreshToken = jwt.sign({ userId: user.id, email: user.email }, REFRESH_TOKEN_SECRET, {
        expiresIn: REFRESH_TOKEN_TTL as any,
      });
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: { id: user.id, email: user.email, name: user.name },
      };
    } catch (error) {
      const err: any = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    }
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silent return for security

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await passwordResetTokenRepository.create({ token, userId: user.id, expiresAt });
    
    await sendEmail(email, 'Reset your password', `<p>Click here to reset your password: <a href="${process.env.NEXT_PUBLIC_API_URL}/reset-password?token=${token}">Reset Password</a></p>`);
  },

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await passwordResetTokenRepository.findByToken(token);
    if (!resetToken || resetToken.expiresAt < new Date()) {
      const err: any = new Error("Invalid or expired token");
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(resetToken.userId, { passwordHash });
    await passwordResetTokenRepository.delete(token);
  },
};
