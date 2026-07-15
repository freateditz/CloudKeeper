import { Page } from "playwright";
import { MegaInputValidator } from "./MegaInputValidator";

export class MegaEmailEntryService {
  static async fillEmail(page: Page, email: string): Promise<boolean> {
    // Use the unique ID to avoid strict mode violations
    const emailInput = page.locator('#login-name3');
    
    // Wait for the input to be visible and interactable
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email);
    
    return await MegaInputValidator.validateEmailField(page, email);
  }
}
