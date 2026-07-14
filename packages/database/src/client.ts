// The API/worker entrypoints load .env before they import this module, so by
// the time the Prisma client is constructed, DATABASE_URL is already in
// process.env. We still defensively probe the monorepo root in case the
// package is imported directly (e.g. from a script) without an .env load.
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __cloudkeeper_prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__cloudkeeper_prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__cloudkeeper_prisma = prisma;
}
