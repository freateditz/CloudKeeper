import {
  MaintenanceJobRepository,
  CloudAccountRepository,
  Provider,
  MaintenanceJob,
} from "@cloudkeeper/database";

const jobRepository = new MaintenanceJobRepository();
const accountRepository = new CloudAccountRepository();

export const JobsService = {
  async list() {
    return jobRepository.findAll();
  },

  async getById(id: string) {
    const job = await jobRepository.findById(id);
    if (!job) {
      const err: any = new Error("Job not found");
      err.statusCode = 404;
      throw err;
    }
    return job;
  },

  async create(accountId: string, provider: Provider) {
    return jobRepository.create({
      status: "PENDING",
      totalAccounts: 1,
      successfulAccounts: 0,
      failedAccounts: 0,
      duration: null,
      accountId,
      provider,
    });
  },

  /**
   * Queue one PENDING maintenance job for every connected MEGA account
   * that does not already have an in-flight (PENDING or RUNNING) job.
   *
   * Reuses `JobsService.create` so the job row shape is identical to
   * the per-account "Run Maintenance" flow — no schema or worker change.
   *
   * Returns the list of newly created jobs and counts of how many
   * accounts were queued vs. skipped.
   */
  async runAllForUser(userId: string): Promise<{
    queued: number;
    skipped: number;
    jobs: MaintenanceJob[];
  }> {
    const accounts = await accountRepository.findByUser(userId);
    const megaAccounts = accounts.filter((a) => a.provider === Provider.MEGA);

    if (megaAccounts.length === 0) {
      return { queued: 0, skipped: 0, jobs: [] };
    }

    const accountIds = megaAccounts.map((a) => a.id);
    const inFlight = await jobRepository.findInFlightForAccounts(accountIds);
    const inFlightAccountIds = new Set(
      inFlight.map((j) => j.accountId).filter((id): id is string => Boolean(id))
    );

    const eligible = megaAccounts.filter((a) => !inFlightAccountIds.has(a.id));

    const jobs: MaintenanceJob[] = [];
    for (const account of eligible) {
      const job = await JobsService.create(account.id, Provider.MEGA);
      jobs.push(job);
    }

    return {
      queued: jobs.length,
      skipped: inFlightAccountIds.size,
      jobs,
    };
  },
};
