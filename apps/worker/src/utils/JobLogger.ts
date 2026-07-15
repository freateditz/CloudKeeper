import { WorkerLogger } from "./Logger";

/**
 * Wraps a WorkerLogger to prefix every log line with a per-job
 * context tag, e.g. "[Job 9ea3…] [Account abc@example.com]".
 *
 * Used by JobRunner.run so concurrent jobs are easy to disambiguate
 * when their log lines interleave on stdout.
 *
 * The prefix is folded into the JSON `message` field, so it survives
 * any downstream log parser that reads one JSON object per line.
 */
export class JobLogger {
  constructor(
    private readonly base: WorkerLogger,
    private readonly jobId: string,
    private readonly accountEmail: string | null
  ) {}

  private prefix(): string {
    const job = this.jobId ? this.jobId.slice(0, 8) : "unknown";
    const acct = this.accountEmail ?? "unknown-account";
    return `[Job ${job}] [Account ${acct}]`;
  }

  log(message: string, context?: Record<string, any>) {
    this.base.log(`${this.prefix()} ${message}`, context);
  }

  error(message: string, error: Error, context?: Record<string, any>) {
    this.base.error(`${this.prefix()} ${message}`, error, context);
  }
}
