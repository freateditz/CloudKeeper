import { BrowserManager } from "./browser/BrowserManager";
import { InMemoryQueue } from "./queue";
import { JobRunner } from "./services/JobRunner";

async function bootstrap() {
  const browserManager = new BrowserManager();
  const queue = new InMemoryQueue();
  const runner = new JobRunner(browserManager);

  await browserManager.launch("chromium");
  console.log("Worker started...");

  process.on("SIGTERM", async () => {
    await browserManager.cleanup();
    process.exit(0);
  });
}

bootstrap().catch(console.error);
