import { ProviderFactory, BaseProvider } from "@cloudkeeper/provider-sdk";
import { BrowserManager } from "../browser/BrowserManager";
import { Job } from "../queue";

export class JobRunner {
  constructor(
    private browserManager: BrowserManager
  ) {}

  async run(job: Job) {
    const provider = ProviderFactory.createProvider(job.payload.provider);
    console.log(`Running job ${job.id} for ${provider.getProviderMetadata().name}`);
    // Future: implement execution logic
  }
}
