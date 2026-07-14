import { BrowserContext, Page } from "playwright";

export type BrowserType = "chromium" | "firefox" | "webkit";

export interface BrowserConfig {
  type: BrowserType;
  headless: boolean;
  timeout: number;
  retryAttempts: number;
}

export interface IBrowserSession {
  context: BrowserContext;
  createPage(): Promise<Page>;
  close(): Promise<void>;
}
