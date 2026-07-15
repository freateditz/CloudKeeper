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
import { InMemoryQueue, Job, Queue } from "./queue";
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
  // Drain the queue with a bounded-concurrency worker pool.
  //
  // Up to `WORKER_CONCURRENCY` jobs may be in-flight at once. We never
  // redesign JobRunner or change the per-job wrapper (try → runner.run
  // → DB update) — we only stop blocking the loop on a single job.
  //
  // The pool terminates when the queue is empty AND no tasks are in
  // flight, so an invocation never leaves a job dangling.
  const concurrency = readConcurrency();
  logger.log(`[processQueue] Starting drain (concurrency=${concurrency})`);

  const inFlight = new Set<Promise<void>>();

  const startNext = (): boolean => {
    if (inFlight.size >= concurrency) return false;
    const job = queue.dequeue();
    if (!job) return false;

    const task = runJob(runner, job).finally(() => {
      inFlight.delete(task);
    });
    inFlight.add(task);
    return true;
  };

  // Prime the pool up to the concurrency limit.
  while (inFlight.size < concurrency && startNext()) {
    /* keep launching */
  }

  // Keep draining. Whenever a slot opens up (or new jobs are enqueued
  // by the polling loop), launch another task. When the queue empties
  // AND no tasks are in flight, we're done.
  while (inFlight.size > 0 || queue.size() > 0) {
    if (queue.size() > 0 && inFlight.size < concurrency) {
      while (startNext()) {
        /* keep launching up to the limit */
      }
    }
    if (inFlight.size === 0) break;
    // Wait for any in-flight task to settle, then loop and try to launch
    // another one. Promise.race over the current set is sufficient — the
    // .finally() above removes settled tasks so the set shrinks naturally.
    await Promise.race(inFlight);
  }

  logger.log(`[processQueue] Drain complete (concurrency=${concurrency})`);
}

/**
 * Run a single job with the same try/catch/DB-update/log wrapper that
 * the original sequential processQueue used. Extracted so the bounded
 * drain loop above can call it for each in-flight task.
 */
async function runJob(runner: JobRunner, job: Job): Promise<void> {
  const logContext = {
    timestamp: new Date().toISOString(),
    jobId: job.id,
    accountId: job.payload?.accountId,
    provider: job.payload?.provider,
    status: "PROCESSING",
  };

  logger.log(`[processQueue] Processing job:`, logContext);

  try {
    await runner.run(job);
    await jobRepository.update(job.id, {
      status: JobStatus.COMPLETED,
      finishedAt: new Date(),
    });
    logger.log(`[processQueue] Job ${job.id} completed successfully.`, logContext);
  } catch (error) {
    logger.error(
      `[processQueue] Job ${job.id} failed:`,
      error as Error,
      logContext
    );
    await jobRepository.update(job.id, {
      status: JobStatus.FAILED,
      finishedAt: new Date(),
    });
  }
}

/**
 * Read WORKER_CONCURRENCY from the environment.
 * Defaults to 1 (sequential), as specified. Must be a positive integer;
 * invalid values fall back to 1.
 */
function readConcurrency(): number {
  const raw = process.env.WORKER_CONCURRENCY;
  if (!raw) return 1;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    logger.log(
      `[processQueue] Invalid WORKER_CONCURRENCY=${raw}, defaulting to 1`
    );
    return 1;
  }
  return n;
}

async function bootstrap() {
  logger.log("Worker booting…", {
    env: process.env.NODE_ENV ?? "development",
    db: process.env.DATABASE_URL ? "set" : "MISSING",
    encryptionKey: process.env.MASTER_ENCRYPTION_KEY ? "set" : "MISSING",
    concurrency: readConcurrency(),
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
