import { MaintenanceJobRepository, JobStatus, Provider } from "@cloudkeeper/database";
import { config } from "dotenv";
config({ path: ".env" });

async function trigger() {
  const repo = new MaintenanceJobRepository();
  const job = await repo.create({
    status: JobStatus.PENDING,
    totalAccounts: 1,
    successfulAccounts: 0,
    failedAccounts: 0,
    duration: 0,
    accountId: "46e56cb6-a7d5-4c17-91ed-5600f8db67fd",
    provider: Provider.MEGA
  });
  console.log("Job created:", job.id);
}
trigger().catch(console.error);
