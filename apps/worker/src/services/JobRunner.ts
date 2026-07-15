import { ProviderFactory } from "@cloudkeeper/provider-sdk";
import { BrowserManager } from "../browser/BrowserManager";
import { BrowserSession } from "../browser/BrowserSession";
import { Job, Queue } from "../queue";
import { WorkerLogger } from "../utils/Logger";
import { JobLogger } from "../utils/JobLogger";
import { MegaProvider } from "../providers/mega/MegaProvider";
import { CredentialResolver } from "../providers/mega/CredentialResolver";
import { CloudAccountRepository, Provider } from "@cloudkeeper/database";

export class JobRunner {
  private logger = new WorkerLogger();
  private accountRepository = new CloudAccountRepository();

  constructor(
    private browserManager: BrowserManager,
    private queue?: Queue
  ) {}

  async run(job: Job) {
    // Look up the account email once so we can tag every JobRunner-level
    // log line with [Job xxx] [Account email]. Provider-internal logs
    // already include jobId/accountId in their JSON context, so this
    // gives concurrent jobs enough disambiguation without touching the
    // provider.
    let accountEmail: string | null = null;
    const accountId = job.payload?.accountId as string | undefined;
    if (accountId) {
      try {
        const account = await this.accountRepository.findById(accountId);
        accountEmail = account?.accountEmail ?? null;
      } catch {
        // Lookup failure is non-fatal — we still log with accountId.
      }
    }

    const log = new JobLogger(this.logger, job.id, accountEmail);

    const baseContext = {
      timestamp: new Date().toISOString(),
      jobId: job.id,
      accountId,
      accountEmail,
      provider: job.payload?.provider,
      status: "RUNNING",
    };

    log.log("Running job", baseContext);

    try {
      const providerType = job.payload?.provider;
      log.log(`Provider type: ${providerType}`, baseContext);
      if (providerType === Provider.MEGA) {
        log.log("MEGA provider detected. Building dependencies.", baseContext);
        // Build dependencies
        const context = await this.browserManager.createSession();
        const session = new BrowserSession(context);
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        if (!masterKey) throw new Error("MASTER_ENCRYPTION_KEY missing");

        const credentialProvider = new CredentialResolver(masterKey);
        const megaProvider = new MegaProvider(session, credentialProvider);

        log.log(
          `Running MEGA login flow for account: ${accountId}`,
          baseContext
        );
        const result = await megaProvider.runFullLoginFlow(
          accountId as string,
          job.id
        );
        if (result.success) {
          log.log("MEGA maintenance complete: Login successful", {
            ...baseContext,
            success: true,
            durationMs: result.durationMs,
          });
        } else {
          const reason =
            (result.loginResult && (result.loginResult.errorMessage || result.loginResult.errorCode)) ||
            "unknown reason";
          log.log("MEGA maintenance complete: Login failed", {
            ...baseContext,
            success: false,
            reason,
            errorCode: result.loginResult?.errorCode,
            durationMs: result.durationMs,
          });
        }
        return result;
      } else {
        // Fallback for others
        log.log(`Using factory for provider: ${providerType}`, baseContext);
        const provider = ProviderFactory.createProvider(providerType);
        return await provider.maintenanceCheck();
      }
    } catch (error) {
      log.error("Job failed", error as Error, baseContext);
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
