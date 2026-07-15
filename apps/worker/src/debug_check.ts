import { MaintenanceJobRepository } from "@cloudkeeper/database";

async function check() {
  const jobRepo = new MaintenanceJobRepository();
  const jobs = await jobRepo.findAll(10);
  console.log("Recent jobs:", JSON.stringify(jobs, null, 2));
}

check().catch(console.error);
