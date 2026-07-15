import { Page } from "playwright";

/**
 * True when the page is on the MEGA file manager dashboard.
 * MEGA redirects to /fm (no trailing slash on first load) or /fm/<folder-id>.
 */
export class SuccessAnalyzer {
  private static readonly FM_PATTERN = /\/fm(\/|$)/;

  static async isSuccess(page: Page): Promise<boolean> {
    return this.FM_PATTERN.test(page.url());
  }
}
