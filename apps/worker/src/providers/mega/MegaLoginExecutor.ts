import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";
import { LoginResult, LoginStatus } from "./LoginTypes";
import { LoginStateDetector } from "./LoginStateDetector";
import { MegaLogger } from "./MegaLogger";

export class MegaLoginExecutor {
  private logger = new MegaLogger();

  async execute(page: Page): Promise<LoginResult> {
    const start = Date.now();
    try {
      this.logger.log("Clicking login button");
      await page.locator(MegaSelectors.loginButton[0]).click();
      
      // Wait for navigation after click
      await page.waitForLoadState("networkidle");

      const detection = await LoginStateDetector.detect(page);
      return {
        status: detection.status,
        errorCode: detection.errorCode,
        durationMs: Date.now() - start
      };
    } catch (error) {
      this.logger.error("Login submission failed", error as Error);
      return {
        status: LoginStatus.FAILURE,
        durationMs: Date.now() - start
      };
    }
  }
}
