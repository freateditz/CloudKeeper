import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.cloudAccount.findMany({
    where: { provider: 'MEGA' }
  });
  console.log("MEGA Accounts:", JSON.stringify(accounts, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
