import { MaintenanceJobRepository, Provider } from "@cloudkeeper/database";

const jobRepository = new MaintenanceJobRepository();

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
};
