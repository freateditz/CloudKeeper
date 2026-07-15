import { Page } from "playwright";
import { LoginResult, LoginStatus, LoginFailureCode } from "./LoginTypes";
import { MegaLogger } from "./MegaLogger";

/**
 * How login state is verified:
 *
 * MEGA's login form submits via AJAX; the redirect to /fm/ happens in JS
 * about 1–2 seconds after the click. Using `waitForLoadState("networkidle")`
 * immediately after `click()` is unsafe — the network is already idle
 * (the page is sitting still) and the call returns in ~1ms, BEFORE the
 * AJAX response or the JS-driven navigation has happened.
 *
 * Instead we race a positive success signal (URL contains /fm/) against a
 * negative failure signal (.login-error-box becomes visible) using
 * `Promise.race`, and fall back to a final state inspection after a fixed
 * deadline if neither wins.
 */
const POST_CLICK_TIMEOUT_MS = 30_000;
const SETTLE_DELAY_MS = 1_500;

export class MegaLoginExecutor {
  private logger = new MegaLogger();

  async execute(page: Page): Promise<LoginResult> {
    const start = Date.now();
    try {
      this.logger.log("Clicking login button");
      await page.getByRole('button', { name: 'Log in' }).click();

      const outcome = await this.waitForLoginOutcome(page, POST_CLICK_TIMEOUT_MS);
      return this.toLoginResult(page, outcome, Date.now() - start);
    } catch (error) {
      this.logger.error("Login submission failed", error as Error);
      const diagnostic = await this.captureDiagnostic(page, Date.now() - start);
      return {
        status: LoginStatus.FAILURE,
        errorCode: LoginFailureCode.UNKNOWN,
        errorMessage: diagnostic.reason,
        durationMs: diagnostic.durationMs,
      };
    }
  }

  /**
   * Race positive and negative signals. Returns the first one that fires
   * and tags the outcome so the caller can build a structured result.
   */
  private async waitForLoginOutcome(
    page: Page,
    timeoutMs: number
  ): Promise<{ kind: "success" | "failure" | "timeout"; details: string }> {
    const successPromise = this.waitForSuccess(page, timeoutMs);
    const failurePromise = this.waitForFailure(page, timeoutMs);
    const timeoutPromise = this.waitForTimeout(page, timeoutMs);

    const winner = await Promise.race([successPromise, failurePromise, timeoutPromise]);
    return winner;
  }

  private async waitForSuccess(page: Page, timeoutMs: number) {
    try {
      await page.waitForURL(/\/fm(\/|$)/, { timeout: timeoutMs, waitUntil: "domcontentloaded" });
      return { kind: "success" as const, details: "URL navigated to /fm/" };
    } catch (e) {
      return { kind: "timeout" as const, details: `waitForURL /fm/ failed: ${(e as Error).message}` };
    }
  }

  private async waitForFailure(page: Page, timeoutMs: number) {
    try {
      // MEGA's login error banner has class .login-error-box with text
      // "Invalid email address or password" / "Email address or password is incorrect"
      await page.waitForSelector(".login-error-box:not(.hidden)", {
        state: "visible",
        timeout: timeoutMs,
      });
      const errorText = await page.locator(".login-error-text").textContent().catch(() => null);
      return {
        kind: "failure" as const,
        details: `login-error-box visible: ${errorText?.trim() || "(no text)"}`,
      };
    } catch (e) {
      return { kind: "timeout" as const, details: `waitForSelector .login-error-box failed: ${(e as Error).message}` };
    }
  }

  private async waitForTimeout(page: Page, timeoutMs: number) {
    await page.waitForTimeout(timeoutMs);
    return { kind: "timeout" as const, details: `no signal within ${timeoutMs}ms` };
  }

  /**
   * Convert the race outcome into a structured LoginResult. We re-inspect
   * the page at this point because:
   *   - The race winner may have reported "timeout" while the URL is now
   *     actually /fm/ (i.e. we just lost the race by a few ms).
   *   - The error box may have been replaced by other content; we capture
   *     whatever's there once for diagnostics.
   */
  private async toLoginResult(
    page: Page,
    outcome: { kind: "success" | "failure" | "timeout"; details: string },
    durationMs: number
  ): Promise<LoginResult> {
    // Small settle so any post-navigation DOM updates land.
    await page.waitForTimeout(SETTLE_DELAY_MS);

    const finalUrl = page.url();
    const onDashboard = /\/fm(\/|$)/.test(finalUrl);

    if (onDashboard) {
      this.logger.log("Login verification: SUCCESS", { url: finalUrl, outcome });
      return { status: LoginStatus.SUCCESS, durationMs };
    }

    // Not on /fm/. Collect the real reason.
    const diagnostic = await this.captureDiagnostic(page, durationMs, outcome.details);
    this.logger.log("Login verification: FAILURE", diagnostic);
    return {
      status: LoginStatus.FAILURE,
      errorCode: diagnostic.errorCode,
      errorMessage: diagnostic.reason,
      durationMs: diagnostic.durationMs,
    };
  }

  private async captureDiagnostic(
    page: Page,
    durationMs: number,
    extraNote?: string
  ): Promise<{
    reason: string;
    errorCode: LoginFailureCode;
    url: string;
    title: string;
    visibleErrorText: string | null;
    durationMs: number;
  }> {
    const url = page.url();
    const title = await page.title().catch(() => "(no title)");
    const visibleErrorText = await page
      .locator(".login-error-text")
      .first()
      .textContent()
      .catch(() => null);

    let reason: string;
    let errorCode: LoginFailureCode;

    if (visibleErrorText && /invalid|incorrect|wrong/i.test(visibleErrorText)) {
      reason = `Invalid credentials (${visibleErrorText.trim()})`;
      errorCode = LoginFailureCode.INVALID_CREDENTIALS;
    } else if (await page.locator('input[name="otp"]').isVisible().catch(() => false)) {
      reason = "Two-factor authentication required (otp field present)";
      errorCode = LoginFailureCode.MFA_REQUIRED;
    } else if (url.includes("/login")) {
      reason = `Still on login page after click${extraNote ? ` — ${extraNote}` : ""} (no error banner found)`;
      errorCode = LoginFailureCode.UNKNOWN;
    } else {
      reason = `Unexpected post-login state: ${url} (${title})`;
      errorCode = LoginFailureCode.UNKNOWN;
    }

    return {
      reason,
      errorCode,
      url,
      title,
      visibleErrorText: visibleErrorText?.trim() ?? null,
      durationMs,
    };
  }
}
