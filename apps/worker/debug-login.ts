// One-off debug script to inspect actual browser state after clicking login.
// Run with:  pnpm --filter @cloudkeeper/worker exec ts-node src/debug-login.ts <accountId>

import { config as loadEnv } from "dotenv";
import path from "path";
import fs from "fs";

const candidates = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];
for (const c of candidates) if (fs.existsSync(c)) loadEnv({ path: c });

import { PrismaClient } from "@prisma/client";
import { BrowserManager } from "./browser/BrowserManager";
import { BrowserSession } from "./browser/BrowserSession";
import { defaultBrowserConfig } from "./browser/BrowserConfig";
import { CredentialResolver } from "./providers/mega/CredentialResolver";
import { MegaProvider } from "./providers/mega/MegaProvider";
import { MEGA_URL } from "./providers/mega/MegaConstants";
import { MegaEmailEntryService } from "./providers/mega/MegaEmailEntryService";
import { MegaPasswordEntryService } from "./providers/mega/MegaPasswordEntryService";
import { MegaLoginExecutor } from "./providers/mega/MegaLoginExecutor";
import { LoginStateDetector } from "./providers/mega/LoginStateDetector";
import { SuccessAnalyzer } from "./providers/mega/SuccessAnalyzer";
import { FailureAnalyzer } from "./providers/mega/FailureAnalyzer";
import { Page } from "playwright";

const prisma = new PrismaClient();
const accountId = process.argv[2];

async function snapshot(page: Page, label: string, dir: string) {
  const url = page.url();
  const title = await page.title().catch(() => "(no title)");
  const htmlPath = path.join(dir, `dbg-${label}.html`);
  const pngPath = path.join(dir, `dbg-${label}.png`);
  const html = await page.content().catch(() => "(no content)");
  fs.writeFileSync(htmlPath, html);
  await page.screenshot({ path: pngPath, fullPage: false }).catch(() => {});
  console.log(`\n=== ${label} ===`);
  console.log(`URL:   ${url}`);
  console.log(`TITLE: ${title}`);
  console.log(`HTML:  ${htmlPath}`);
  console.log(`PNG:   ${pngPath}`);

  // Detect dashboard markers
  const hasFm = url.includes("/fm/");
  const hasLogin = url.includes("/login");
  const hasInvalidCred = html.includes("Invalid email or password");
  const hasOtp = await page.locator('input[name="otp"]').count();
  const has2fa = html.toLowerCase().includes("two-factor") || html.toLowerCase().includes("two factor");
  const cookieBanner = html.includes("cookie") || html.includes("accept all");
  const recovery = html.toLowerCase().includes("recover") && html.toLowerCase().includes("account");
  console.log(`HAS /fm/:    ${hasFm}`);
  console.log(`HAS /login:  ${hasLogin}`);
  console.log(`BadCreds:    ${hasInvalidCred}`);
  console.log(`OTP field:   ${hasOtp}`);
  console.log(`2FA hint:    ${has2fa}`);
  console.log(`Cookies:     ${cookieBanner}`);
  console.log(`Recovery:    ${recovery}`);
  return { url, title, hasFm, hasLogin, hasInvalidCred, hasOtp, has2fa, recovery };
}

async function main() {
  if (!accountId) {
    const accounts = await prisma.cloudAccount.findMany({ take: 5 });
    console.log("usage: ts-node src/debug-login.ts <accountId>");
    console.log("available accounts:");
    for (const a of accounts) console.log(`  ${a.id}  ${a.accountEmail}  ${a.provider}`);
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, "../logs/screenshots");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = new BrowserManager(defaultBrowserConfig);
  await browser.launch();
  const ctx = await browser.createSession();
  const session = new BrowserSession(ctx);

  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
  const resolver = new CredentialResolver(masterKey);
  const creds = await resolver.getCredentials(accountId);
  console.log("Credentials resolved for:", creds.email);

  const page = await session.createPage();
  try {
    await page.goto(`${MEGA_URL}/login`, { waitUntil: "networkidle" });
    try { await page.waitForSelector('.loading-main-block', { state: 'detached', timeout: 15000 }); } catch {}
    await page.waitForTimeout(1500);

    await snapshot(page, "01-loaded-login", outDir);

    await MegaEmailEntryService.fillEmail(page, creds.email);
    await snapshot(page, "02-email-filled", outDir);

    await MegaPasswordEntryService.fillPassword(page, creds.password);
    await snapshot(page, "03-password-filled", outDir);

    // Click login
    await page.getByRole('button', { name: 'Log in' }).click();
    console.log("LOGIN BUTTON CLICKED");

    // Wait for the URL to potentially change
    const t0 = Date.now();
    let urlStable = false;
    let prev = "";
    while (Date.now() - t0 < 30000) {
      const cur = page.url();
      if (cur !== prev) {
        console.log(`  t=${Date.now() - t0}ms  url=${cur}`);
        prev = cur;
      }
      if (!cur.includes("/login")) { urlStable = true; break; }
      await page.waitForTimeout(250);
    }
    console.log("URL stable (not /login):", urlStable);

    // Give it a moment to settle
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    await snapshot(page, "04-after-click", outDir);

    // Now invoke detector exactly as the executor does
    const isSuccess = await SuccessAnalyzer.isSuccess(page);
    console.log("\nSuccessAnalyzer.isSuccess ->", isSuccess);
    const failureCode = await FailureAnalyzer.analyze(page);
    console.log("FailureAnalyzer.analyze ->", failureCode);

    // What does the actual state detector return?
    const detection = await LoginStateDetector.detect(page);
    console.log("LoginStateDetector.detect ->", JSON.stringify(detection));

  } finally {
    await page.close();
    await browser.cleanup();
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
