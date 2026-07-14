import { Page } from "playwright";

export class SuccessAnalyzer {
  static async isSuccess(page: Page): Promise<boolean> {
    return page.url().includes("/fm/");
  }
}
