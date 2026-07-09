import { z } from "zod";
import { Provider, AccountStatus } from "@cloudkeeper/database";

export const createAccountSchema = z.object({
  provider: z.nativeEnum(Provider),
  accountEmail: z.string().email(),
  password: z.string().min(1),
  notes: z.string().optional(),
});

export const updateAccountSchema = z.object({
  accountEmail: z.string().email().optional(),
  password: z.string().min(1).optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});
