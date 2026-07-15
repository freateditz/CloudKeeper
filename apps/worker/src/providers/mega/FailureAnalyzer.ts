import { Page } from "playwright";
import { LoginFailureCode } from "./LoginTypes";

/**
 * Inspects the page after a failed login attempt to identify the reason.
 * MEGA's error banner has class .login-error-box and contains a
 * .login-error-text child with the human-readable reason.
 */
export class FailureAnalyzer {
  static async analyze(page: Page): Promise<LoginFailureCode | undefined> {
    // Prefer the structured error box — it only becomes visible on a
    // failed submission, so checking visibility avoids false positives
    // from the dormant banner HTML.
    try {
      const errorBox = page.locator(".login-error-box:not(.hidden)");
      if (await errorBox.first().isVisible().catch(() => false)) {
        const text = (await errorBox.first().textContent().catch(() => ""))?.trim() ?? "";
        if (/invalid email|incorrect.*password|wrong.*password|invalid.*password/i.test(text)) {
          return LoginFailureCode.INVALID_CREDENTIALS;
        }
      }
    } catch {
      // ignore — fall through to other checks
    }

    // OTP / 2FA screen
    try {
      if (await page.locator('input[name="otp"]').isVisible()) {
        return LoginFailureCode.MFA_REQUIRED;
      }
    } catch {
      // ignore
    }

    // Fall back to a body scan in case MEGA renders errors elsewhere.
    const errorText = await page.textContent('body').catch(() => null);
    if (errorText && /invalid email|incorrect.*password|wrong.*password/i.test(errorText)) {
      return LoginFailureCode.INVALID_CREDENTIALS;
    }

    return LoginFailureCode.UNKNOWN;
  }
}
