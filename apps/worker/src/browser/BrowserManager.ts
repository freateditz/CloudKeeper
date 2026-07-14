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
        this.browser = await this.getBrowserLauncher(this.config.type).launch({ headless: this.config.headless });
        return;
      } catch (error) {
        attempts++;
        this.logger.error("Failed to launch browser", error as Error, { attempt: attempts });
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
