import { Page } from "playwright";
import { MegaPageAnalyzer, ValidationResult } from "./MegaPageAnalyzer";
import { MEGA_URL } from "./MegaConstants";

export interface DiscoveryResult {
  detected: boolean;
  validation: ValidationResult;
  title: string;
  url: string;
  durationMs: number;
}

export class MegaNavigationService {
  static async discoverLoginPage(page: Page): Promise<DiscoveryResult> {
    const start = Date.now();
    await page.goto(`${MEGA_URL}/login`, { waitUntil: "networkidle" });
    
    const validation = await MegaPageAnalyzer.validate(page);
    const detected = validation.emailFound && validation.passwordFound && validation.buttonFound;
    
    return {
      detected,
      validation,
      title: await page.title(),
      url: page.url(),
      durationMs: Date.now() - start
    };
  }
}
