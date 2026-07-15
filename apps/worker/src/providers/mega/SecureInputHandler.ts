import { Page } from "playwright";

export class SecureInputHandler {
  static async fillPassword(page: Page, password: string): Promise<void> {
    // Use the unique ID to avoid strict mode violations
    const passwordInput = page.locator('#login-password3');
    
    // Wait for the input to be visible and interactable
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(password);
  }
}
