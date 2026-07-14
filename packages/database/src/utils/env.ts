import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

let validated = false;

export function validateEnv() {
  if (validated) return envSchema.parse(process.env);
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Don't crash import — just log so the process can still start.
    // Callers that really need the DB will fail when they try to connect.
    // eslint-disable-next-line no-console
    console.warn(
      "[database] env validation warning:",
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    );
    return process.env as unknown as z.infer<typeof envSchema>;
  }
  validated = true;
  return result.data;
}

export function requireEnv() {
  return envSchema.parse(process.env);
}
