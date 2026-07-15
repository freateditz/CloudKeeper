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
    const screenshotDir = `/Users/vivek/cloudkeeper/apps/worker/logs/screenshots/`;
    
    // Ensure dir exists (simplified: assumes it exists or worker has perms)

    const logStep = async (step: string, context?: any) => {
        const info = {
            step,
            url: page.url(),
            title: await page.title(),
            ...context
        };
        this.logger.log(`[Step] ${step}`, info);
    };

    try {
      await logStep("Navigating to login page");
      await page.goto(`${MEGA_URL}/login`, { waitUntil: "networkidle" });
      
      try {
        await page.waitForSelector('.loading-main-block', { state: 'detached', timeout: 15000 });
        await logStep("Loading screen detached");
      } catch (e) {
        this.logger.log("Warning: loading-main-block was not detached");
      }
      
      await page.waitForTimeout(2000); 

      await logStep("Attempting to fill email");
      const emailValid = await MegaEmailEntryService.fillEmail(page, credentials.email);
      await logStep("Email filled");

      await logStep("Attempting to fill password");
      await MegaPasswordEntryService.fillPassword(page, credentials.password);
      await logStep("Password filled");

      await logStep("Executing login");
      const loginResult = await executor.execute(page);
      await logStep("Login execution complete", {
        status: loginResult.status,
        errorCode: loginResult.errorCode,
        errorMessage: loginResult.errorMessage,
        durationMs: loginResult.durationMs,
      });

      // Always log the final state explicitly so the maintenance job
      // never reaches "MEGA maintenance complete" with success=false
      // and no explanation.
      if (loginResult.status === LoginStatus.SUCCESS) {
        this.logger.log("Login successful", {
          accountId,
          jobId,
          durationMs: loginResult.durationMs,
        });
      } else {
        this.logger.log("Login failed", {
          accountId,
          jobId,
          reason: loginResult.errorMessage || "unknown",
          errorCode: loginResult.errorCode,
          durationMs: loginResult.durationMs,
        });
      }

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
      const screenshotPath = `${screenshotDir}failure-${jobId}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      
      const content = await page.content();
      const htmlPath = `${screenshotDir}failure-${jobId}-${Date.now()}.html`;
      // Write content to file
      const fs = require('fs');
      fs.writeFileSync(htmlPath, content);
      
      this.logger.error("Login flow failed", error as Error, { 
        jobId, 
        accountId, 
        screenshot: screenshotPath,
        html: htmlPath
      });
      
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
