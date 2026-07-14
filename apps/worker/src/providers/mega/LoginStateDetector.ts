import { Page } from "playwright";
import { LoginStatus, LoginFailureCode } from "./LoginTypes";
import { SuccessAnalyzer } from "./SuccessAnalyzer";
import { FailureAnalyzer } from "./FailureAnalyzer";

export class LoginStateDetector {
  static async detect(page: Page): Promise<{ status: LoginStatus, errorCode?: LoginFailureCode }> {
    if (await SuccessAnalyzer.isSuccess(page)) {
      return { status: LoginStatus.SUCCESS };
    }

    const errorCode = await FailureAnalyzer.analyze(page);
    return { status: LoginStatus.FAILURE, errorCode };
  }
}
