import { BrowserContext, Page } from "playwright";
import { IBrowserSession } from "./BrowserTypes";
import { BrowserLogger } from "./BrowserLogger";

export class BrowserSession implements IBrowserSession {
  private logger = new BrowserLogger();

  constructor(public context: BrowserContext) {}

  async createPage(): Promise<Page> {
    this.logger.log("Creating new page");
    return await this.context.newPage();
  }

  async close(): Promise<void> {
    this.logger.log("Closing browser session");
    await this.context.close();
  }
}
