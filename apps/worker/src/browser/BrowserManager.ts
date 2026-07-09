import { chromium, firefox, webkit, Browser, BrowserContext, Page } from "playwright";

export type BrowserType = "chromium" | "firefox" | "webkit";

export class BrowserManager {
  private browser: Browser | null = null;

  async launch(type: BrowserType = "chromium") {
    if (this.browser) return;
    
    if (type === "chromium") this.browser = await chromium.launch();
    else if (type === "firefox") this.browser = await firefox.launch();
    else if (type === "webkit") this.browser = await webkit.launch();
  }

  async newContext() {
    if (!this.browser) throw new Error("Browser not launched");
    return await this.browser.newContext();
  }

  async newPage(context: BrowserContext) {
    return await context.newPage();
  }

  async close() {
    if (this.browser) await this.browser.close();
    this.browser = null;
  }

  async cleanup() {
    await this.close();
  }
}
