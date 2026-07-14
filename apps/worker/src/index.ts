// Load env from the monorepo root BEFORE anything else touches Prisma / Config
// / crypto so DATABASE_URL and other secrets are visible at module import time.
import { config as loadEnv } from "dotenv";
import path from "path";
import fs from "fs";

function findEnvFile(): string | null {
  const candidates = [
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(process.cwd(), ".env"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const envFile = findEnvFile();
if (envFile) {
  loadEnv({ path: envFile });
} else {
  // eslint-disable-next-line no-console
  console.warn("[worker] no .env file found in monorepo root");
}

import { BrowserManager } from "./browser/BrowserManager";
import { defaultBrowserConfig } from "./browser/BrowserConfig";
import { InMemoryQueue, Queue } from "./queue";
import { JobRunner } from "./services/JobRunner";
import { WorkerLogger } from "./utils/Logger";
import { JobStatus, MaintenanceJobRepository } from "@cloudkeeper/database";

const logger = new WorkerLogger();
const jobRepository = new MaintenanceJobRepository();

async function pollJobs(runner: JobRunner, queue: Queue) {
  try {
    const pendingJobs = await jobRepository.findPending();
    logger.log(`[pollJobs] Found ${pendingJobs.length} pending jobs`);
    for (const job of pendingJobs) {
      const logContext = {
        timestamp: new Date().toISOString(),
        jobId: job.id,
        accountId: job.accountId,
        provider: job.provider,
        status: job.status
      };
      logger.log(`[pollJobs] Found job:`, logContext);
      
      // Update status to RUNNING in DB immediately
      await jobRepository.update(job.id, { status: JobStatus.RUNNING, startedAt: new Date() });
      
      queue.enqueue({ id: job.id, payload: job, priority: 1 });
      logger.log(`[pollJobs] Job ${job.id} enqueued.`, logContext);
    }
  } catch (error) {
    logger.error("Error polling jobs", error as Error);
  }
}

async function processQueue(runner: JobRunner, queue: Queue) {
  while (queue.size() > 0) {
    const job = queue.dequeue();
    if (!job) continue;

    const logContext = {
      timestamp: new Date().toISOString(),
      jobId: job.id,
      accountId: job.payload?.accountId,
      provider: job.payload?.provider,
      status: "PROCESSING"
    };

    logger.log(`[processQueue] Processing job:`, logContext);

    try {
      await runner.run(job);
      await jobRepository.update(job.id, { status: JobStatus.COMPLETED, finishedAt: new Date() });
      logger.log(`[processQueue] Job ${job.id} completed successfully.`, logContext);
    } catch (error) {
      logger.error(`[processQueue] Job ${job.id} failed:`, error as Error, logContext);
      await jobRepository.update(job.id, { status: JobStatus.FAILED, finishedAt: new Date() });
    }
  }
}

async function bootstrap() {
  logger.log("Worker booting…", {
    env: process.env.NODE_ENV ?? "development",
    db: process.env.DATABASE_URL ? "set" : "MISSING",
    encryptionKey: process.env.MASTER_ENCRYPTION_KEY ? "set" : "MISSING",
  });

  const queue = new InMemoryQueue();
  const browserManager = new BrowserManager(defaultBrowserConfig);
  const runner = new JobRunner(browserManager, queue);

  // Best-effort browser launch — the worker can still operate in dry-run mode
  // without a browser, so a launch failure should not kill the process.
  try {
    await browserManager.launch();
    logger.log("Browser launched");
  } catch (error) {
    logger.error("Browser launch failed (continuing without browser)", error as Error);
  }

  logger.log("Worker started — listening for jobs");

  // Poll for jobs every 30s
  setInterval(() => void pollJobs(runner, queue), 30_000);
  setInterval(() => void processQueue(runner, queue), 5_000);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down…`);
    try {
      await browserManager.cleanup();
    } catch (error) {
      logger.error("Browser cleanup failed", error as Error);
    }
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[worker] fatal:", err);
  process.exit(1);
});
