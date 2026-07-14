import { BrowserManager } from "./BrowserManager";
import { BrowserSession } from "./BrowserSession";
import { BrowserConfig } from "./BrowserTypes";
import { defaultBrowserConfig } from "./BrowserConfig";

export class BrowserFactory {
  static createManager(config: Partial<BrowserConfig> = {}): BrowserManager {
    const finalConfig = { ...defaultBrowserConfig, ...config };
    return new BrowserManager(finalConfig);
  }

  static async createSession(manager: BrowserManager): Promise<BrowserSession> {
    const context = await manager.createSession();
    return new BrowserSession(context);
  }
}
