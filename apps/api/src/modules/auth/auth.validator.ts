import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Username may only contain letters, numbers, dot, dash and underscore",
  }),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
