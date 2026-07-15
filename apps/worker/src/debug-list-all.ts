import { prisma } from "@cloudkeeper/database";
import { config } from "dotenv";
config({ path: ".env" });

async function main() {
  const accounts = await prisma.cloudAccount.findMany({
    select: { id: true, accountEmail: true, provider: true, userId: true }
  });
  console.log("Accounts:", JSON.stringify(accounts, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
