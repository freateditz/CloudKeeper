import { Page } from "playwright";
import { LoginFailureCode } from "./LoginTypes";

export class FailureAnalyzer {
  static async analyze(page: Page): Promise<LoginFailureCode | undefined> {
    const errorText = await page.textContent('body');
    if (errorText?.includes("Invalid email or password")) return LoginFailureCode.INVALID_CREDENTIALS;
    if (await page.locator('input[name="otp"]').isVisible()) return LoginFailureCode.MFA_REQUIRED;
    return LoginFailureCode.UNKNOWN;
  }
}
