import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";
import { MegaInputValidator } from "./MegaInputValidator";

export class MegaEmailEntryService {
  static async fillEmail(page: Page, email: string): Promise<boolean> {
    for (const selector of MegaSelectors.email) {
      const locator = page.locator(selector);
      try {
        await locator.waitFor({ state: "visible", timeout: 5000 });
        await locator.fill(email);
        return await MegaInputValidator.validateEmailField(page, email);
      } catch (e) {
        continue;
      }
    }
    throw new Error("Could not find email input field");
  }
}
