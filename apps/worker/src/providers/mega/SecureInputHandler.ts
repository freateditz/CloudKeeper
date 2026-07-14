import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";

export class SecureInputHandler {
  static async fillPassword(page: Page, password: string): Promise<void> {
    for (const selector of MegaSelectors.password) {
      const locator = page.locator(selector);
      try {
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.fill(password);
        return;
      } catch (e) {
        continue;
      }
    }
    throw new Error("Could not find password input field");
  }
}
