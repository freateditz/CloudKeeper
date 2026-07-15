import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";

export interface ValidationResult {
  emailFound: boolean;
  passwordFound: boolean;
  buttonFound: boolean;
  missing: string[];
}

export class MegaPageAnalyzer {
  static async validate(page: Page): Promise<ValidationResult> {
    const missing: string[] = [];
    
    const emailFound = await this.trySelectors(page, MegaSelectors.email);
    if (!emailFound) missing.push("email");
    
    const passwordFound = await this.trySelectors(page, MegaSelectors.password);
    if (!passwordFound) missing.push("password");
    
    const buttonFound = await this.trySelectors(page, MegaSelectors.loginButton);
    if (!buttonFound) missing.push("loginButton");

    return { emailFound, passwordFound, buttonFound, missing };
  }

  private static async trySelectors(page: Page, selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      // Check main page first
      if (await page.locator(selector).first().isVisible()) {
        return true;
      }
      // Check frames if not found
      for (const frame of page.frames()) {
        if (await frame.locator(selector).first().isVisible()) {
          return true;
        }
      }
    }
    return false;
  }
}
