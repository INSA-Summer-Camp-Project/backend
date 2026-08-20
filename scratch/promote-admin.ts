import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Pass the telegramId as the first CLI argument
const targetTelegramId = process.argv[2];
if (!targetTelegramId) {
  console.error(
    "Please provide a telegramId. Example: pnpm exec tsx scratch/promote-admin.ts <telegramId>",
  );
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({
    where: { telegramId: targetTelegramId },
  });

  if (!user) {
    console.error(`User with telegramId ${targetTelegramId} not found.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { telegramId: targetTelegramId },
    data: { systemRole: "ADMIN" },
  });

  console.log(
    `Successfully promoted ${user.name} (${targetTelegramId}) to ADMIN.`,
  );
} catch (error) {
  console.error("Error promoting user:", error);
} finally {
  await prisma.$disconnect();
}
