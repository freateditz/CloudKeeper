import { ProviderFactory } from "@cloudkeeper/provider-sdk";
import { BrowserManager } from "../browser/BrowserManager";
import { BrowserSession } from "../browser/BrowserSession";
import { Job, Queue } from "../queue";
import { WorkerLogger } from "../utils/Logger";
import { MegaProvider } from "../providers/mega/MegaProvider";
import { CredentialResolver } from "../providers/mega/CredentialResolver";
import { Provider } from "@cloudkeeper/database";

export class JobRunner {
  private logger = new WorkerLogger();

  constructor(
    private browserManager: BrowserManager,
    private queue?: Queue
  ) {}

  async run(job: Job) {
    const logContext = {
      timestamp: new Date().toISOString(),
      jobId: job.id,
      accountId: job.payload?.accountId,
      provider: job.payload?.provider,
      status: "RUNNING"
    };

    this.logger.log("[JobRunner] Running job", logContext);

    try {
      const providerType = job.payload?.provider;
      this.logger.log(`[JobRunner] Provider type: ${providerType}`, logContext);
      if (providerType === Provider.MEGA) {
        this.logger.log("[JobRunner] MEGA provider detected. Building dependencies.", logContext);
        // Build dependencies
        const context = await this.browserManager.createSession();
        const session = new BrowserSession(context);
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) throw new Error("MASTER_ENCRYPTION_KEY missing");
        
        const credentialProvider = new CredentialResolver(masterKey);
        const megaProvider = new MegaProvider(session, credentialProvider);

        this.logger.log(`[JobRunner] Running MEGA login flow for account: ${job.payload.accountId}`, logContext);
        const result = await megaProvider.runFullLoginFlow(job.payload.accountId, job.id);
        if (result.success) {
          this.logger.log("MEGA maintenance complete: Login successful", { ...logContext, success: true, durationMs: result.durationMs });
        } else {
          const reason =
            (result.loginResult && (result.loginResult.errorMessage || result.loginResult.errorCode)) ||
            "unknown reason";
          this.logger.log("MEGA maintenance complete: Login failed", {
            ...logContext,
            success: false,
            reason,
            errorCode: result.loginResult?.errorCode,
            durationMs: result.durationMs,
          });
        }
        return result;
      } else {
        // Fallback for others
        this.logger.log(`[JobRunner] Using factory for provider: ${providerType}`, logContext);
        const provider = ProviderFactory.createProvider(providerType);
        return await provider.maintenanceCheck();
      }
    } catch (error) {
      this.logger.error("Job failed", error as Error, logContext);
      throw error;
    }
  }

  enqueue(job: Job) {
    if (!this.queue) {
      this.logger.log("No queue attached — job dropped", { jobId: job.id });
      return;
    }
    this.queue.enqueue(job);
  }
}
