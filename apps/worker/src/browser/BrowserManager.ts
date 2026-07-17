import { Browser, BrowserContext, chromium, firefox, webkit } from "playwright";
import { BrowserConfig, BrowserType } from "./BrowserTypes";
import { BrowserLogger } from "./BrowserLogger";

export class BrowserManager {
  private browser: Browser | null = null;
  private logger = new BrowserLogger();

  constructor(private config: BrowserConfig) {}

  async launch(): Promise<void> {
    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        this.logger.log(`Launching browser (attempt ${attempts + 1})`, { type: this.config.type });
        
        // Log environment and configuration before launch
        this.logger.log("Browser launch diagnostic info", {
          type: this.config.type,
          headless: this.config.headless,
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || "Not set"
        });

        this.browser = await this.getBrowserLauncher(this.config.type).launch({ headless: this.config.headless });
        return;
      } catch (error: any) {
        attempts++;
        
        // Comprehensive error logging
        this.logger.error("Failed to launch browser", error as Error, {
          attempt: attempts,
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          fullError: error
        });
        
        if (attempts >= this.config.retryAttempts) throw error;
      }
    }
  }

  private getBrowserLauncher(type: BrowserType) {
    switch (type) {
      case "firefox": return firefox;
      case "webkit": return webkit;
      case "chromium":
      default: return chromium;
    }
  }

  async createSession(): Promise<BrowserContext> {
    if (!this.browser) throw new Error("Browser not launched");
    return await this.browser.newContext();
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log("Browser closed");
    }
  }
}
