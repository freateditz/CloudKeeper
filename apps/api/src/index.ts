// Load environment variables from the monorepo root .env FIRST.
// This guarantees every package sees the same DATABASE_URL, JWT secrets,
// encryption keys, and other shared configuration.
import { config } from "dotenv";
import path from "path";
import fs from "fs";

function findMonorepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const repoRoot = findMonorepoRoot(__dirname);
const envPath = path.join(repoRoot, ".env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  // Fallback to cwd
  config({ path: path.resolve(process.cwd(), ".env") });
}

if (process.env.NODE_ENV !== "production") {
  // Helpful boot diagnostics in dev
  // eslint-disable-next-line no-console
  console.log(
    `[api] env loaded (DATABASE_URL=${process.env.DATABASE_URL ? "set" : "MISSING"}, PORT=${process.env.PORT ?? "5001"})`
  );
}

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";
import jobsRoutes from "./modules/jobs/jobs.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import profileRoutes from "./modules/profile/profile.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import sessionsRoutes from "./modules/sessions/sessions.routes";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Health probe
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "cloudkeeper-api", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/accounts", accountsRoutes);
app.use("/jobs", jobsRoutes);
app.use("/settings", settingsRoutes);
app.use("/profile", profileRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/sessions", sessionsRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralised error handler (must come last)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error:", err);
  const status = err?.statusCode || 500;
  res.status(status).json({
    error: err?.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" ? { stack: err?.stack } : {}),
  });
});

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
});
