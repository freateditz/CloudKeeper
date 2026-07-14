import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";

export class MegaInputValidator {
  static async validateEmailField(page: Page, expectedEmail: string): Promise<boolean> {
    const emailLocator = page.locator(MegaSelectors.email[0]);
    await emailLocator.waitFor({ state: "visible" });
    
    const value = await emailLocator.inputValue();
    const isVisible = await emailLocator.isVisible();
    const isEditable = await emailLocator.isEditable();
    
    return value === expectedEmail && isVisible && isEditable;
  }
}
