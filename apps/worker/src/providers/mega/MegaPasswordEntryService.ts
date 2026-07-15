import { Page } from "playwright";
import { PasswordFieldValidator, PasswordValidationResult } from "./PasswordFieldValidator";
import { SecureInputHandler } from "./SecureInputHandler";
import { CredentialSanitizer } from "./CredentialSanitizer";

export interface PasswordEntryResult {
  validation: PasswordValidationResult;
  inputSuccessful: boolean;
  durationMs: number;
}

export class MegaPasswordEntryService {
  static async fillPassword(page: Page, password: string): Promise<PasswordEntryResult> {
    const start = Date.now();
    
    // 1. Validate field
    const validation = await PasswordFieldValidator.validate(page);
    
    // 2. Fill password
    let inputSuccessful = false;
    if (validation.isEditable) {
      await SecureInputHandler.fillPassword(page, password);
      // Verification step: use the unique password input id
      const val = await page.locator('#login-password3').inputValue();
      inputSuccessful = val === password;
    }

    // 3. Clear sensitive data (already local, just ensure it's not reused)
    const sensitiveData = { password };
    CredentialSanitizer.clear(sensitiveData);

    return {
      validation,
      inputSuccessful,
      durationMs: Date.now() - start
    };
  }
}
