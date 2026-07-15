import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const userCount = await prisma.user.count();
  console.log(`✅ Connected — ${userCount} user(s) in database`);
}

main()
  .catch((error) => {
    console.error("❌ Connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
