import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma, UserRepository } from "@cloudkeeper/database";
import { AuthTokens } from "@cloudkeeper/types";

const userRepository = new UserRepository();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

export const AuthService = {
  async register(data: { name: string; email: string; password: string }) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) throw new Error("User already exists");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({ ...data, passwordHash });
    
    return { id: user.id, email: user.email, name: user.name };
  },

  async login(email: string, password: string): Promise<AuthTokens & { user: any }> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) throw new Error("Invalid credentials");

    const accessToken = jwt.sign({ userId: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } };
  },
};
