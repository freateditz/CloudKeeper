import { BrowserConfig } from "./BrowserTypes";

export const defaultBrowserConfig: BrowserConfig = {
  type: "chromium",
  headless: true,
  timeout: 30000,
  retryAttempts: 3,
};
