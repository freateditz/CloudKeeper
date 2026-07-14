import { Page } from "playwright";
import { MegaNavigationService, DiscoveryResult } from "./MegaNavigationService";

export class MegaLoginPage {
  constructor(private page: Page) {}

  async discover(): Promise<DiscoveryResult> {
    return await MegaNavigationService.discoverLoginPage(this.page);
  }
}
