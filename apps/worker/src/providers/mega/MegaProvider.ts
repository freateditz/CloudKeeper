import { BaseProvider, HealthStatus, MaintenanceResult, ProviderMetadata, StorageInfo, ProviderCapabilities } from "@cloudkeeper/provider-sdk";
import { BrowserSession } from "../../browser/BrowserSession";
import { MEGA_URL, MEGA_DOMAIN } from "./MegaConstants";
import { MegaLogger } from "./MegaLogger";
import { Provider, CloudAccountRepository, MaintenanceLogRepository } from "@cloudkeeper/database";
import { Page } from "playwright";
import { MegaLoginPage } from "./MegaLoginPage";
import { MegaPageAnalyzer } from "./MegaPageAnalyzer";
import { DiscoveryResult } from "./MegaNavigationService";
import { CredentialProvider } from "./CredentialProvider";
import { MegaEmailEntryService } from "./MegaEmailEntryService";
import { MegaPasswordEntryService, PasswordEntryResult } from "./MegaPasswordEntryService";
import { MegaLoginExecutor } from "./MegaLoginExecutor";
import { LoginStatus } from "./LoginTypes";

export interface ExecutionResult {
  success: boolean;
  emailValid: boolean;
  passwordEntry?: PasswordEntryResult;
  loginResult?: any;
  durationMs: number;
}

export interface NavigationResult {
  url: string;
  title: string;
  status: number;
  browserVersion: string;
  durationMs: number;
}

export class MegaProvider extends BaseProvider {
  private logger = new MegaLogger();
  private accountRepo = new CloudAccountRepository();
  private logRepo = new MaintenanceLogRepository();

  constructor(
    private session: BrowserSession,
    private credentialProvider: CredentialProvider
  ) {
    super();
  }

  async runFullLoginFlow(accountId: string, jobId: string): Promise<ExecutionResult> {
    const start = Date.now();
    const credentials = await this.credentialProvider.getCredentials(accountId);
    const executor = new MegaLoginExecutor();

    const page = await this.session.createPage();
    try {
      await page.goto(`${MEGA_URL}/login`, { waitUntil: "load" });
      await page.waitForTimeout(2000); // Wait for JS to load

      // DEBUG: Log iframes
      const frames = page.frames();
      this.logger.log("Frames detected", { frameCount: frames.length, frames: frames.map(f => f.url()) });
      
      // DEBUG: Discover what's on the page
      const validation = await MegaPageAnalyzer.validate(page);
      this.logger.log("Page validation result", { validation });

      const emailValid = await MegaEmailEntryService.fillEmail(page, credentials.email);
      await MegaPasswordEntryService.fillPassword(page, credentials.password);

      const loginResult = await executor.execute(page);

      // Database updates
      await this.logRepo.create({
        cloudAccountId: accountId,
        maintenanceJobId: jobId,
        success: loginResult.status === LoginStatus.SUCCESS,
        errorMessage: loginResult.errorCode || null,
        screenshotPath: null,
        duration: loginResult.durationMs,
        finishedAt: new Date()
      });

      return {
        success: loginResult.status === LoginStatus.SUCCESS,
        emailValid,
        loginResult,
        durationMs: Date.now() - start
      };
    } catch (error) {
      await page.screenshot({ path: `failure-${jobId}.png` });
      this.logger.error("Login flow failed", error as Error, { jobId, accountId });
      throw error;
    } finally {
      await page.close();
    }
  }

  async discoverLoginPage(): Promise<DiscoveryResult> {
    const page = await this.session.createPage();
    try {
      const loginPage = new MegaLoginPage(page);
      return await loginPage.discover();
    } finally {
      await page.close();
    }
  }

  async validateCredentials(credentials: any): Promise<boolean> { return true; }
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  
  async checkHealth(): Promise<HealthStatus> {
    const page = await this.session.createPage();
    try {
      const response = await page.goto(MEGA_URL, { waitUntil: "domcontentloaded" });
      if (response && response.status() === 200 && page.url().includes(MEGA_DOMAIN)) {
        return HealthStatus.HEALTHY;
      }
      return HealthStatus.DOWN;
    } catch (error) {
      this.logger.error("Health check failed", error as Error);
      return HealthStatus.DOWN;
    } finally {
      await page.close();
    }
  }

  async navigateAndCapture(): Promise<NavigationResult> {
    const startTime = Date.now();
    const page = await this.session.createPage();
    
    try {
      const response = await page.goto(MEGA_URL, { waitUntil: "domcontentloaded" });
      const durationMs = Date.now() - startTime;
      
      return {
        url: page.url(),
        title: await page.title(),
        status: response?.status() || 0,
        browserVersion: page.context().browser()?.version() || "unknown",
        durationMs
      };
    } finally {
      await page.close();
    }
  }

  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "MEGA", provider: Provider.MEGA }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}
