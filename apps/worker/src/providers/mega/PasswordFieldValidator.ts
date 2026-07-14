import { Page } from "playwright";
import { MegaSelectors } from "./MegaSelectors";

export interface PasswordValidationResult {
  exists: boolean;
  isVisible: boolean;
  isEditable: boolean;
}

export class PasswordFieldValidator {
  static async validate(page: Page): Promise<PasswordValidationResult> {
    const locator = page.locator(MegaSelectors.password[0]);
    const exists = await locator.count() > 0;
    const isVisible = exists && await locator.isVisible();
    const isEditable = exists && await locator.isEditable();
    
    return { exists, isVisible, isEditable };
  }
}
